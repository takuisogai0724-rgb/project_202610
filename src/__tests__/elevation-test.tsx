import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Barometer } from 'expo-sensors';

import InfoScreen from '@/app/explore';
import HomeScreen, { formatMeters } from '@/app/index';
import {
  calculateSeaLevelPressure,
  estimateAltitudeFromPressure,
} from '@/hooks/use-barometer';
import {
  clearElevationCache,
  type ElevationHistoryItem,
  fetchGroundElevation,
} from '@/hooks/use-elevation';
import { calculateDistanceMeters } from '@/utils/elevation-api';
import { getFujiStationInfo } from '@/utils/fuji-station';
import {
  clearElevationHistory,
  loadElevationHistory,
  MAX_HISTORY_ITEMS,
  saveElevationHistory,
} from '@/utils/history-storage';
import { findSameElevationRegions } from '@/utils/region-comparison';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

jest.setTimeout(20000);

jest.mock('expo-location', () => ({
  Accuracy: {
    Highest: 6,
  },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

const mockSecureStoreMap = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => {
    return mockSecureStoreMap.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreMap.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreMap.delete(key);
  }),
}));

jest.mock('expo-sensors', () => ({
  Barometer: {
    isAvailableAsync: jest.fn(async () => false),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: unknown;
    }) => <View style={style}>{children}</View>,
  };
});

const mockedLocation = Location as jest.Mocked<typeof Location>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedBarometer = Barometer as jest.Mocked<typeof Barometer>;

describe('標高計アプリ 単体テスト・結合テストスイート (TDD)', () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStoreMap.clear();
    clearElevationCache();
    mockedBarometer.isAvailableAsync.mockResolvedValue(false);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. フォーマット関数の単体テスト (formatMeters)', () => {
    test('TC-01: 数値を指定桁数のメートル表記に変換し、nullやNaNは "---" を返す', () => {
      expect(formatMeters(35.42, 1)).toBe('35.4 m');
      expect(formatMeters(0, 1)).toBe('0.0 m');
      expect(formatMeters(3776.12, 2)).toBe('3776.12 m');
      expect(formatMeters(null)).toBe('---');
      expect(formatMeters(Number.NaN)).toBe('---');
    });
  });

  describe('2. 標高API取得・空間キャッシュ・レート制限の単体テスト (fetchGroundElevation)', () => {
    test('TC-02: 国土地理院APIから正常に標高とデータソースを取得できる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 42.8, hsrc: '5m（レーザ）' }),
      });

      const result = await fetchGroundElevation(35.68123, 139.76712);

      expect(result).toEqual({
        elevation: 42.8,
        source: '国土地理院 DEM (5m（レーザ）)',
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('TC-03: 国土地理院APIが範囲外("-----")の場合、Open-Meteo APIへフォールバックする', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: '-----', hsrc: '-----' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: [128.5] }),
        });

      const result = await fetchGroundElevation(37.7749, -122.4194);

      expect(result).toEqual({
        elevation: 128.5,
        source: 'Open-Meteo DEM',
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('TC-04: オフライン等で両方のAPIが失敗した場合、例外を投げずに null を返す', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchGroundElevation(35.0, 135.0);

      expect(result).toEqual({
        elevation: null,
        source: null,
      });
    });

    test('TC-14: 不正な緯度経度や異常な標高値(-500m未満/10,000m超)を安全に拒否する', async () => {
      const invalidCoordResult = await fetchGroundElevation(999, 139.7);
      expect(invalidCoordResult).toEqual({ elevation: null, source: null });
      expect(mockFetch).not.toHaveBeenCalled();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: 99999, hsrc: '5m（レーザ）' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: [-9999] }),
        });

      const abnormalElevationResult = await fetchGroundElevation(35.68, 139.76);
      expect(abnormalElevationResult).toEqual({
        elevation: null,
        source: null,
      });
    });

    test('TC-20: 【P3】10m以内の移動は空間キャッシュを再利用し、自動追従時の連続リクエストは3秒間レート制限される', async () => {
      // 2点間距離計算の検証（同一座標なら 0m）
      expect(calculateDistanceMeters(35.68123, 139.76712, 35.68123, 139.76712)).toBe(0);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 37.2, hsrc: '5m（レーザ）' }),
      });

      // 1回目: 初回通信でキャッシュに保存される
      const first = await fetchGroundElevation(35.68123, 139.76712, {
        enableRateLimit: true,
      });
      expect(first.elevation).toBe(37.2);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 2回目: 数メートル以内（約2m移動）の座標 -> APIを呼ばず空間キャッシュを返す
      const nearby = await fetchGroundElevation(35.68124, 139.76713);
      expect(nearby.elevation).toBe(37.2);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 3回目: 10m以上離れた場所だが、自動追従レート制限（3秒未満）によりキャッシュを返す
      const rateLimited = await fetchGroundElevation(35.69, 139.78, {
        enableRateLimit: true,
      });
      expect(rateLimited.elevation).toBe(37.2);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 4回目: forceRefresh 指定時はキャッシュを無視して新規取得する
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 52.0, hsrc: '5m（レーザ）' }),
      });
      const forced = await fetchGroundElevation(35.69, 139.78, {
        forceRefresh: true,
      });
      expect(forced.elevation).toBe(52.0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. 富士山何合目 & 同じ標高の地域比較ロジックの単体テスト', () => {
    test('TC-10: 標高に応じて0合目〜頂上(10合目)・達成率・頂上までの残り標高を正しく算出する', () => {
      expect(getFujiStationInfo(null)).toBeNull();

      const plain = getFujiStationInfo(35.4);
      expect(plain?.stationNumber).toBe(0);
      expect(plain?.stationLabel).toBe('富士山 0合目（麓・平地エリア）');
      expect(plain?.remainingToSummit).toBe(3740.6);

      const st1 = getFujiStationInfo(1500);
      expect(st1?.stationNumber).toBe(1);
      expect(st1?.stationLabel).toBe('富士山 1合目相当');

      const st5 = getFujiStationInfo(2305);
      expect(st5?.stationNumber).toBe(5);
      expect(st5?.stationLabel).toBe('富士山 5合目相当');
      expect(st5?.remainingToSummit).toBe(1471);

      const st8 = getFujiStationInfo(3250);
      expect(st8?.stationNumber).toBe(8);
      expect(st8?.stationLabel).toBe('富士山 8合目相当');

      const summit = getFujiStationInfo(3776);
      expect(summit?.stationNumber).toBe(10);
      expect(summit?.stationLabel).toBe('富士山 頂上（10合目）到達！');
      expect(summit?.progressPercent).toBe(100);
      expect(summit?.remainingToSummit).toBe(0);
    });

    test('TC-18: 【P2】現在の標高から最も標高が近い地域・都市・名所を正しく検索できる (findSameElevationRegions)', () => {
      expect(findSameElevationRegions(null)).toBeNull();
      expect(findSameElevationRegions(Number.NaN)).toBeNull();

      // 36.5m -> 東京都・新宿駅周辺 (37m)
      const shinjuku = findSameElevationRegions(36.5);
      expect(shinjuku?.closestSpot.name).toBe('東京都・新宿駅周辺');
      expect(shinjuku?.closestSpot.elevation).toBe(37);
      expect(shinjuku?.elevationDiff).toBe(0.5);
      expect(shinjuku?.nearbySpots).toHaveLength(2);

      // 942m -> 長野県・軽井沢駅周辺 (940m)
      const karuizawa = findSameElevationRegions(942);
      expect(karuizawa?.closestSpot.name).toBe('長野県・軽井沢駅周辺');
      expect(karuizawa?.elevationDiff).toBe(2);

      // 1500m -> 長野県・上高地（河童橋周辺） (1500m)
      const kamikochi = findSameElevationRegions(1500);
      expect(kamikochi?.closestSpot.name).toBe('長野県・上高地（河童橋周辺）');
      expect(kamikochi?.elevationDiff).toBe(0);

      // 2445m -> 富山県・立山室堂（アルペンルート） (2450m)
      const murodo = findSameElevationRegions(2445);
      expect(murodo?.closestSpot.name).toBe(
        '富山県・立山室堂（アルペンルート）'
      );
      expect(murodo?.elevationDiff).toBe(5);
    });
  });

  describe('4. 暗号化ストレージ永続化・気圧換算ロジックの単体テスト', () => {
    test('TC-16: 【P1】expo-secure-store にチャンク分割して暗号化保存・復元でき、上限100件を超えた古い履歴を自動で切り捨てる', async () => {
      // 105件のダミー履歴データを生成
      const sampleItems: ElevationHistoryItem[] = Array.from(
        { length: 105 },
        (_, i) => ({
          id: `item-${i + 1}`,
          elevation: 100 + i,
          fujiStationLabel: '富士山 0合目（麓・平地エリア）',
          source: '国土地理院 DEM (5m（レーザ）)',
          latitude: 35.68 + i * 0.0001,
          longitude: 139.76 + i * 0.0001,
          savedAt: new Date('2026-10-18T10:00:00.000Z'),
        })
      );

      const saved = await saveElevationHistory(sampleItems);
      expect(saved).toHaveLength(MAX_HISTORY_ITEMS);
      expect(MAX_HISTORY_ITEMS).toBe(100);
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalled();

      // チャンク結合して復元できることを確認
      const loaded = await loadElevationHistory();
      expect(loaded).toHaveLength(100);
      expect(loaded[0].id).toBe('item-1');
      expect(loaded[99].id).toBe('item-100');
      expect(loaded[0].savedAt).toBeInstanceOf(Date);

      // クリア後は空配列になることを確認
      await clearElevationHistory();
      const afterClear = await loadElevationHistory();
      expect(afterClear).toEqual([]);
    });

    test('TC-22: 【P4】気圧(hPa)と基準標高(m)から海面気圧P0を自動キャリブレーションし高精度な気圧換算高度を算出する', () => {
      expect(estimateAltitudeFromPressure(null)).toBeNull();
      expect(estimateAltitudeFromPressure(-10)).toBeNull();
      // 海面標準気圧 1013.25 hPa -> 0.0 m
      expect(estimateAltitudeFromPressure(1013.25)).toBe(0);
      // 約 900 hPa -> 約 988m
      const alt900 = estimateAltitudeFromPressure(900);
      expect(alt900).not.toBeNull();
      expect(alt900!).toBeGreaterThan(950);
      expect(alt900!).toBeLessThan(1020);

      // 高気圧の日（実標高 37.0m で 1021.4 hPa）の自動キャリブレーション検証
      const calibratedP0 = calculateSeaLevelPressure(1021.4, 37.0);
      expect(calibratedP0).not.toBeNull();
      // 補正前はマイナス（約-68m）になるが、補正後のP0を使えば正確に 37.0m になる
      expect(estimateAltitudeFromPressure(1021.4, calibratedP0!)).toBe(37.0);
    });
  });

  describe('5. HomeScreen UI & useElevation 結合テスト', () => {
    test('TC-05: 位置情報権限が許可されると、現在地の標高(m)と詳細データが画面に表示される', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 35.68123,
          longitude: 139.76712,
          altitude: 45.2,
          accuracy: 8,
          altitudeAccuracy: 12,
          heading: 0,
          speed: 0,
        },
        timestamp: new Date('2026-10-17T12:00:00+09:00').getTime(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 35.4, hsrc: '5m（レーザ）' }),
      });

      const { getByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('35.4')).toBeTruthy();
      });

      expect(getByText('データ元: 国土地理院 DEM (5m（レーザ）)')).toBeTruthy();
      expect(getByText('35.4 m')).toBeTruthy();
      expect(getByText('45.2 m (±12m)')).toBeTruthy();
      expect(getByText('35.68123°, 139.76712°')).toBeTruthy();
      expect(getByText('±8 m')).toBeTruthy();
    });

    test('TC-06: 位置情報権限が拒否された場合、エラーメッセージが表示される', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied' as Location.PermissionStatus,
        granted: false,
        canAskAgain: true,
        expires: 'never',
      });

      const { getByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(
          getByText(
            '位置情報の利用が許可されていません。ブラウザまたはスマホの設定から位置情報を許可してください。'
          )
        ).toBeTruthy();
      });
    });

    test('TC-07: 圏外で外部APIが失敗しても、端末のGPS高度が取得できればメイン標高として表示される', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 35.3606,
          longitude: 138.7274,
          altitude: 3776.0,
          accuracy: 5,
          altitudeAccuracy: 10,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });

      mockFetch.mockRejectedValue(new Error('Offline'));

      const { getByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('3776.0')).toBeTruthy();
      });
      expect(getByText('データ元: 端末GPSセンサー')).toBeTruthy();
    });

    test('TC-08: 「現在地を再取得」ボタンを押すと最新の標高に更新される', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync
        .mockResolvedValueOnce({
          coords: {
            latitude: 35.68,
            longitude: 139.76,
            altitude: 15.0,
            accuracy: 10,
            altitudeAccuracy: 15,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        })
        .mockResolvedValueOnce({
          coords: {
            latitude: 35.69,
            longitude: 139.77,
            altitude: 55.0,
            accuracy: 6,
            altitudeAccuracy: 10,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: 12.3, hsrc: '5m（レーザ）' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: 50.8, hsrc: '5m（レーザ）' }),
        });

      const { getByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('12.3')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('現在地を再取得'));
      });

      await waitFor(() => {
        expect(getByText('50.8')).toBeTruthy();
      });
    });

    test('TC-09: 「自動追従 (OFF)」ボタンでリアルタイム監視の開始・停止が切り替わる', async () => {
      const mockRemove = jest.fn();
      let watchCallback: ((loc: Location.LocationObject) => void) | null = null;

      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 35.68,
          longitude: 139.76,
          altitude: 20.0,
          accuracy: 10,
          altitudeAccuracy: 10,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });

      mockedLocation.watchPositionAsync.mockImplementation(
        async (
          _options: Location.LocationOptions,
          cb: Location.LocationCallback
        ) => {
          watchCallback = cb;
          return { remove: mockRemove };
        }
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: 20.0, hsrc: '5m（レーザ）' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: 88.5, hsrc: '5m（レーザ）' }),
        });

      const { getByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('20.0')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('自動追従 (OFF)'));
      });

      await waitFor(() => {
        expect(getByText('● 自動追従中 (ON)')).toBeTruthy();
      });

      await act(async () => {
        watchCallback?.({
          coords: {
            latitude: 35.7,
            longitude: 139.8,
            altitude: 90.0,
            accuracy: 5,
            altitudeAccuracy: 8,
            heading: 0,
            speed: 1.5,
          },
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(getByText('88.5')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('● 自動追従中 (ON)'));
      });

      await waitFor(() => {
        expect(getByText('自動追従 (OFF)')).toBeTruthy();
      });
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });

    test('TC-11: 現在の標高に応じた「富士山何合目」表示と頂上までの残り標高が画面に表示される', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 35.394,
          longitude: 138.732,
          altitude: 2305.0,
          accuracy: 5,
          altitudeAccuracy: 8,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 2305.0, hsrc: '5m（レーザ）' }),
      });

      const { getByText } = await render(<HomeScreen />);

      // 初期表示は「🗺️ 同じ標高の地域」モード（2305m -> 富山県・立山室堂 2450m）
      await waitFor(() => {
        expect(getByText('富山県・立山室堂（アルペンルート）')).toBeTruthy();
      });

      // 「🗻 富士山何合目」タブをタップすると富士山5合目表示に切り替わる
      await act(async () => {
        fireEvent.press(getByText('🗻 富士山何合目'));
      });

      expect(getByText('富士山 5合目相当')).toBeTruthy();
      expect(getByText('頂上（3,776m）まであと 1471.0 m')).toBeTruthy();
    });

    test('TC-12: 「現在の標高を記録」ボタンを押すと履歴リストに標高・合目・座標が保存される', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 35.68123,
          longitude: 139.76712,
          altitude: 42.0,
          accuracy: 6,
          altitudeAccuracy: 10,
          heading: 0,
          speed: 0,
        },
        timestamp: new Date('2026-10-17T13:00:00+09:00').getTime(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 42.0, hsrc: '5m（レーザ）' }),
      });

      const { getByText, queryByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('42.0')).toBeTruthy();
      });

      expect(getByText('まだ記録された履歴はありません')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByText('現在の標高を記録'));
      });

      expect(queryByText('まだ記録された履歴はありません')).toBeNull();
      expect(getByText('記録件数: 1件')).toBeTruthy();
    });

    test('TC-13 & TC-21: 【P4】複数回標高を記録すると標高推移グラフ(最高・最低・高低差)が表示され、「履歴をクリア」で全削除できる', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync
        .mockResolvedValueOnce({
          coords: {
            latitude: 35.68,
            longitude: 139.76,
            altitude: 1500.0,
            accuracy: 6,
            altitudeAccuracy: 10,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        })
        .mockResolvedValueOnce({
          coords: {
            latitude: 35.69,
            longitude: 139.77,
            altitude: 2305.0,
            accuracy: 6,
            altitudeAccuracy: 10,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: 1500.0, hsrc: '5m（レーザ）' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elevation: 2305.0, hsrc: '5m（レーザ）' }),
        });

      const { getByText, queryByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('1500.0')).toBeTruthy();
      });

      // 1回目の記録（1,500m / 1合目）
      await act(async () => {
        fireEvent.press(getByText('現在の標高を記録'));
      });
      expect(getByText('記録件数: 1件')).toBeTruthy();

      // 現在地を再取得（2,305m / 5合目）
      await act(async () => {
        fireEvent.press(getByText('現在地を再取得'));
      });

      await waitFor(() => {
        expect(getByText('2305.0')).toBeTruthy();
      });

      // 2回目の記録
      await act(async () => {
        fireEvent.press(getByText('現在の標高を記録'));
      });
      expect(getByText('記録件数: 2件')).toBeTruthy();

      // P4: 標高推移グラフが表示され、高低差 805.0 m (2305 - 1500) が表示されていることを確認
      expect(getByText('📈 標高推移グラフ')).toBeTruthy();
      expect(getByText('直近 2 地点')).toBeTruthy();
      expect(getByText('805.0 m')).toBeTruthy();

      // 履歴をクリア
      await act(async () => {
        fireEvent.press(getByText('履歴をクリア'));
      });

      expect(getByText('まだ記録された履歴はありません')).toBeTruthy();
      expect(queryByText('📈 標高推移グラフ')).toBeNull();
    });

    test('TC-15: おおよその位置情報（水平誤差100m超）のときに注意喚起と出典クレジットが表示される', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 35.68,
          longitude: 139.76,
          altitude: null,
          accuracy: 500,
          altitudeAccuracy: null,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 30.0, hsrc: '5m（レーザ）' }),
      });

      const { getByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('30.0')).toBeTruthy();
      });

      expect(
        getByText(
          '※位置情報の誤差が大きいため標高が不正確な可能性があります。「正確な位置情報」を許可してください。'
        )
      ).toBeTruthy();
      expect(
        getByText('出典：国土地理院 標高API / Open-Meteo DEM')
      ).toBeTruthy();
    });

    test('TC-17: 【P1 UI結合】起動時に暗号化ストレージに保存済みの履歴が自動復元され画面に表示される', async () => {
      await saveElevationHistory([
        {
          id: 'persisted-1',
          elevation: 940.0,
          fujiStationLabel: '富士山 0合目（麓・平地エリア）',
          source: '国土地理院 DEM (5m（レーザ）)',
          latitude: 36.342,
          longitude: 138.635,
          savedAt: new Date('2026-10-18T09:00:00+09:00'),
        },
      ]);

      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 35.68123,
          longitude: 139.76712,
          altitude: 37.0,
          accuracy: 8,
          altitudeAccuracy: 10,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 37.0, hsrc: '5m（レーザ）' }),
      });

      const { getAllByText, getByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('記録件数: 1件')).toBeTruthy();
      });
      expect(getAllByText('940.0 m').length).toBeGreaterThanOrEqual(1);
    });

    test('TC-19: 【P2 & P4 UI結合】「🗺️ 同じ標高の地域」タブ切替で同標高の地域名が表示され、気圧センサー値も詳細カードに表示される', async () => {
      let barometerCallback: ((data: { pressure: number }) => void) | null =
        null;
      mockedBarometer.isAvailableAsync.mockResolvedValue(true);
      mockedBarometer.addListener.mockImplementation((cb) => {
        barometerCallback = cb as (data: { pressure: number }) => void;
        return { remove: jest.fn() } as ReturnType<
          typeof Barometer.addListener
        >;
      });

      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as Location.PermissionStatus,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockedLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 35.6896,
          longitude: 139.7006,
          altitude: 37.0,
          accuracy: 6,
          altitudeAccuracy: 8,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 37.0, hsrc: '5m（レーザ）' }),
      });

      const { getByText } = await render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('37.0')).toBeTruthy();
      });

      // 気圧センサーイベントを発火: 高気圧の日 (1021.4 hPa) でも国土地理院標高 (37.0m) で自動補正され2行表示される
      await act(async () => {
        barometerCallback?.({ pressure: 1021.4 });
      });

      await waitFor(() => {
        expect(getByText('1021.4 hPa')).toBeTruthy();
        expect(getByText('（37.0 m・補正済）')).toBeTruthy();
      });

      // 同じ場所でエレベーター等で上階へ移動し気圧が 1.2 hPa 下がった場合 (1020.2 hPa -> 約 46.9 m)
      await act(async () => {
        barometerCallback?.({ pressure: 1020.2 });
      });

      await waitFor(() => {
        expect(getByText('1020.2 hPa')).toBeTruthy();
        expect(getByText('（46.9 m・補正済）')).toBeTruthy();
      });

      // 初期状態で「🗺️ 同じ標高の地域」が表示されていることを確認
      expect(getByText('🗺️ 現在の標高と近い地域・名所')).toBeTruthy();
      expect(getByText('東京都・新宿駅周辺')).toBeTruthy();
      expect(getByText('代表標高 約 37 m（東京都）')).toBeTruthy();

      // 21回連続で記録した際、推移グラフが #2〜#21（最新 #21）へスライド更新されることを確認
      for (let i = 0; i < 21; i += 1) {
        await act(async () => {
          fireEvent.press(getByText('現在の標高を記録'));
        });
      }
      expect(getByText('記録件数: 21件')).toBeTruthy();
      expect(getByText('直近 20 地点 (#2〜#21)')).toBeTruthy();
      expect(getByText('21')).toBeTruthy();
    });

    test('TC-23: アプリ情報・利用規約画面（InfoScreen）に標高データの仕組み・プライバシーポリシー・出典が表示される', async () => {
      const { getByText } = await render(<InfoScreen />);

      expect(getByText('アプリ情報・利用規約')).toBeTruthy();
      expect(getByText('📐 標高・高度データの仕組み')).toBeTruthy();
      expect(getByText('🔒 プライバシーポリシー')).toBeTruthy();
      expect(getByText('📚 データ出典・ライセンス表記')).toBeTruthy();
    });
  });
});

