import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  clearElevationCache,
  type FetchElevationOptions,
  fetchGroundElevation,
} from '@/utils/elevation-api';
import { type FujiStationInfo, getFujiStationInfo } from '@/utils/fuji-station';
import {
  clearElevationHistory,
  loadElevationHistory,
  MAX_HISTORY_ITEMS,
  saveElevationHistory,
} from '@/utils/history-storage';
import {
  findSameElevationRegions,
  type RegionComparisonResult,
} from '@/utils/region-comparison';

export { clearElevationCache, fetchGroundElevation };

const PERMISSION_DENIED_MESSAGE =
  '位置情報の利用が許可されていません。ブラウザまたはスマホの設定から位置情報を許可してください。';

export interface ElevationData {
  /** 最終的に表示する代表標高 (m) — 国土地理院/DEMを優先し、なければGPS高度 */
  primaryElevation: number | null;
  /** スマホのGPSセンサーが直接返した高度 (m) */
  gpsAltitude: number | null;
  /** GPS高度の誤差精度 (±m) */
  gpsAltitudeAccuracy: number | null;
  /** 緯度・経度から算出した地表の標高 (m) */
  groundElevation: number | null;
  /** 地表標高のデータソース名（例: 国土地理院 5m（レーザ）） */
  groundSource: string | null;
  /** 緯度 */
  latitude: number;
  /** 経度 */
  longitude: number;
  /** 水平位置の誤差精度 (±m) */
  horizontalAccuracy: number | null;
  /** 取得時刻 */
  timestamp: Date;
  /** 富士山何合目かの判定情報 */
  fujiStation: FujiStationInfo | null;
  /** 同じ標高の地域・名所比較情報 */
  regionComparison: RegionComparisonResult | null;
}

export interface ElevationHistoryItem {
  /** 一意のID */
  id: string;
  /** 記録時の標高 (m) */
  elevation: number;
  /** 記録時の富士山何合目ラベル */
  fujiStationLabel: string;
  /** 記録時のデータソース */
  source: string;
  /** 緯度 */
  latitude: number;
  /** 経度 */
  longitude: number;
  /** 記録日時 */
  savedAt: Date;
}

/**
 * LocationObject と外部標高APIの結果を統合して ElevationData を生成する純粋非同期関数
 */
async function buildElevationData(
  loc: Location.LocationObject,
  options?: FetchElevationOptions
): Promise<ElevationData> {
  const { latitude, longitude, altitude, altitudeAccuracy, accuracy } =
    loc.coords;

  const { elevation: groundElevation, source: groundSource } =
    await fetchGroundElevation(latitude, longitude, options);

  const primaryElevation = groundElevation ?? altitude ?? null;
  const fujiStation = getFujiStationInfo(primaryElevation);
  const regionComparison = findSameElevationRegions(primaryElevation);

  return {
    primaryElevation,
    gpsAltitude: altitude,
    gpsAltitudeAccuracy: altitudeAccuracy,
    groundElevation,
    groundSource,
    latitude,
    longitude,
    horizontalAccuracy: accuracy,
    timestamp: new Date(loc.timestamp),
    fujiStation,
    regionComparison,
  };
}

/**
 * 位置情報権限の確認・現在地測位・標高データ構築を一括で行う純粋非同期関数
 */
async function acquireElevationResult(
  options?: FetchElevationOptions
): Promise<
  { ok: true; data: ElevationData } | { ok: false; errorMsg: string }
> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, errorMsg: PERMISSION_DENIED_MESSAGE };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    const data = await buildElevationData(loc, options);
    return { ok: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : '位置情報の取得に失敗しました。';
    return {
      ok: false,
      errorMsg: `位置情報の取得に失敗しました: ${message}`,
    };
  }
}

export function useElevation() {
  const [data, setData] = useState<ElevationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [history, setHistory] = useState<ElevationHistoryItem[]>([]);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const refreshElevation = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const result = await acquireElevationResult({ forceRefresh: true });
    if (result.ok) {
      setData(result.data);
      setErrorMsg(null);
    } else {
      setErrorMsg(result.errorMsg);
    }
    setLoading(false);
  }, []);

  const toggleWatching = useCallback(async () => {
    if (isWatching) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setIsWatching(false);
      return;
    }

    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg(PERMISSION_DENIED_MESSAGE);
        return;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000,
          distanceInterval: 2,
        },
        (loc) => {
          void buildElevationData(loc, { enableRateLimit: true }).then(
            (nextData) => {
              setData(nextData);
              setErrorMsg(null);
              setLoading(false);
            }
          );
        }
      );
      subscriptionRef.current = sub;
      setIsWatching(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'リアルタイム追従の開始に失敗しました。';
      setErrorMsg(message);
    }
  }, [isWatching]);

  const saveCurrentElevation = useCallback(() => {
    if (!data || data.primaryElevation === null) {
      return;
    }

    const newItem: ElevationHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      elevation: data.primaryElevation,
      fujiStationLabel:
        data.fujiStation?.stationLabel ?? '富士山 0合目（麓・平地エリア）',
      source: data.groundSource ?? '端末GPSセンサー',
      latitude: data.latitude,
      longitude: data.longitude,
      savedAt: new Date(),
    };

    setHistory((prev) => {
      const next = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      void saveElevationHistory(next);
      return next;
    });
  }, [data]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    void clearElevationHistory();
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadElevationHistory().then((savedItems) => {
      if (cancelled || savedItems.length === 0) return;
      setHistory((prev) => {
        if (prev.length === 0) {
          return savedItems;
        }
        const existingIds = new Set(prev.map((i) => i.id));
        const merged = [
          ...prev,
          ...savedItems.filter((i) => !existingIds.has(i.id)),
        ];
        return merged.slice(0, MAX_HISTORY_ITEMS);
      });
    });

    void acquireElevationResult().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setData(result.data);
        setErrorMsg(null);
      } else {
        setErrorMsg(result.errorMsg);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  return {
    data,
    loading,
    errorMsg,
    isWatching,
    history,
    refreshElevation,
    toggleWatching,
    saveCurrentElevation,
    clearHistory,
  };
}
