const GSI_ELEVATION_API_URL =
  'https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php';
const OPEN_METEO_ELEVATION_API_URL =
  'https://api.open-meteo.com/v1/elevation';

/** 外部標高APIの通信タイムアウト (ミリ秒) */
const API_TIMEOUT_MS = 5000;

/** 地球上の妥当な標高範囲 (m) — 死海周辺(-430m)〜エベレスト(8,849m)にマージンを加えた範囲 */
const MIN_VALID_ELEVATION = -500;
const MAX_VALID_ELEVATION = 10000;

/** 空間キャッシュを有効とする半径 (m) — 10m以内の移動はキャッシュを再利用 */
export const SPATIAL_CACHE_RADIUS_METERS = 10;

/** 空間キャッシュの有効期限 (ミリ秒) — 10分間 */
export const CACHE_TTL_MS = 10 * 60 * 1000;

/** 自動追従時の外部API最小通信間隔 (ミリ秒) — 3秒間 */
export const MIN_API_INTERVAL_MS = 3000;

interface GsiElevationResponse {
  elevation: number | string;
  hsrc: string;
}

interface OpenMeteoElevationResponse {
  elevation?: number[];
}

export interface GroundElevationResult {
  elevation: number | null;
  source: string | null;
}

export interface FetchElevationOptions {
  /** キャッシュを無視して強制的に外部APIから再取得するか */
  forceRefresh?: boolean;
  /** 自動追従モード用の連続リクエスト抑制（レート制限）を有効にするか */
  enableRateLimit?: boolean;
}

interface ElevationCacheEntry {
  latitude: number;
  longitude: number;
  result: GroundElevationResult;
  timestamp: number;
}

let lastCacheEntry: ElevationCacheEntry | null = null;
let lastRateLimitedFetchTime = 0;

/**
 * メモリ内の標高空間キャッシュおよびレート制限タイマーをクリアする
 */
export function clearElevationCache(): void {
  lastCacheEntry = null;
  lastRateLimitedFetchTime = 0;
}

/**
 * 2点間の緯度・経度から地表距離(m)を算出する（Haversine公式）
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusMeters = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

/**
 * 緯度・経度が有効な数値範囲（緯度: -90〜90、経度: -180〜180）かを検証する
 */
export function isValidCoordinate(
  latitude: number,
  longitude: number
): boolean {
  return (
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * APIレスポンスの標高値を数値へ変換し、妥当な範囲（-500m〜10,000m）内かを検証する
 */
function parseNumericElevation(raw: unknown): number | null {
  if (typeof raw !== 'number' && typeof raw !== 'string') {
    return null;
  }
  const parsed = typeof raw === 'number' ? raw : parseFloat(raw);
  if (
    !Number.isFinite(parsed) ||
    parsed < MIN_VALID_ELEVATION ||
    parsed > MAX_VALID_ELEVATION
  ) {
    return null;
  }
  return parsed;
}

/**
 * タイムアウト付きの fetch ラッパー（山間部など電波不安定時のハングアップ防止）
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 緯度・経度から地表の標高(m)を取得する
 * - 10m以内かつ10分以内の同一地点は空間キャッシュを再利用
 * - 自動追従時は最小通信間隔(3秒)のレート制限を適用
 * - 1. 国土地理院 標高API（日本国内で高精度・0.1m単位）
 * - 2. Open-Meteo Elevation API（海外や海上・フォールバック用）
 */
export async function fetchGroundElevation(
  latitude: number,
  longitude: number,
  options?: FetchElevationOptions
): Promise<GroundElevationResult> {
  if (!isValidCoordinate(latitude, longitude)) {
    return { elevation: null, source: null };
  }

  const now = Date.now();
  const forceRefresh = options?.forceRefresh ?? false;
  const enableRateLimit = options?.enableRateLimit ?? false;

  if (!forceRefresh && lastCacheEntry !== null) {
    const ageMs = now - lastCacheEntry.timestamp;
    if (ageMs <= CACHE_TTL_MS) {
      const distanceMeters = calculateDistanceMeters(
        latitude,
        longitude,
        lastCacheEntry.latitude,
        lastCacheEntry.longitude
      );
      // 1. 空間キャッシュ判定: 10m以内の移動なら外部APIを呼ばずキャッシュを返す
      if (distanceMeters <= SPATIAL_CACHE_RADIUS_METERS) {
        return lastCacheEntry.result;
      }

      // 2. レート制限判定: 自動追従モードで前回通信から3秒未満なら直近キャッシュを返す
      if (
        enableRateLimit &&
        lastRateLimitedFetchTime > 0 &&
        now - lastRateLimitedFetchTime < MIN_API_INTERVAL_MS
      ) {
        return lastCacheEntry.result;
      }
    }
  }

  if (enableRateLimit) {
    lastRateLimitedFetchTime = now;
  }

  try {
    const gsiUrl = `${GSI_ELEVATION_API_URL}?lon=${encodeURIComponent(
      longitude
    )}&lat=${encodeURIComponent(latitude)}&outtype=JSON`;
    const response = await fetchWithTimeout(gsiUrl);
    if (response.ok) {
      const data = (await response.json()) as GsiElevationResponse;
      const elevation = parseNumericElevation(data.elevation);
      if (elevation !== null) {
        const sourceDetail =
          data.hsrc && data.hsrc !== '-----' ? ` (${data.hsrc})` : '';
        const result: GroundElevationResult = {
          elevation,
          source: `国土地理院 DEM${sourceDetail}`,
        };
        lastCacheEntry = {
          latitude,
          longitude,
          result,
          timestamp: Date.now(),
        };
        return result;
      }
    }
  } catch {
    // 国土地理院APIが失敗・タイムアウトした場合はフォールバックへ進む
  }

  try {
    const meteoUrl = `${OPEN_METEO_ELEVATION_API_URL}?latitude=${encodeURIComponent(
      latitude
    )}&longitude=${encodeURIComponent(longitude)}`;
    const response = await fetchWithTimeout(meteoUrl);
    if (response.ok) {
      const data = (await response.json()) as OpenMeteoElevationResponse;
      if (Array.isArray(data.elevation) && data.elevation.length > 0) {
        const elevation = parseNumericElevation(data.elevation[0]);
        if (elevation !== null) {
          const result: GroundElevationResult = {
            elevation,
            source: 'Open-Meteo DEM',
          };
          lastCacheEntry = {
            latitude,
            longitude,
            result,
            timestamp: Date.now(),
          };
          return result;
        }
      }
    }
  } catch {
    // 両方失敗・タイムアウトした場合
  }

  return { elevation: null, source: null };
}
