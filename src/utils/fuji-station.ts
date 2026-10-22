export const FUJI_SUMMIT_ELEVATION = 3776;

export interface FujiStationInfo {
  /** 合目番号 (0〜10) */
  stationNumber: number;
  /** 表示用ラベル（例: "富士山 5合目相当"） */
  stationLabel: string;
  /** 富士山頂 (3,776m) に対する達成率 (0〜100%) */
  progressPercent: number;
  /** 富士山頂 (3,776m) までの残り標高 (m) */
  remainingToSummit: number;
  /** 補足説明テキスト */
  description: string;
}

interface StationThreshold {
  minElevation: number;
  stationNumber: number;
  stationLabel: string;
  detail: string;
}

/**
 * 富士山（吉田ルート基準）の各合目の標高目安テーブル（高い順）
 */
const FUJI_STATIONS: StationThreshold[] = [
  {
    minElevation: 3776,
    stationNumber: 10,
    stationLabel: '富士山 頂上（10合目）到達！',
    detail: '日本最高峰・剣ヶ峰（3,776m）以上の高さです！',
  },
  {
    minElevation: 3400,
    stationNumber: 9,
    stationLabel: '富士山 9合目相当',
    detail: '山頂目前の森林限界を超えた高산帯（約3,400m〜）',
  },
  {
    minElevation: 3100,
    stationNumber: 8,
    stationLabel: '富士山 8合目相当',
    detail: '雲海を見下ろす山小屋エリア（約3,100m〜）',
  },
  {
    minElevation: 2700,
    stationNumber: 7,
    stationLabel: '富士山 7合目相当',
    detail: '岩場が続く本格的な登山エリア（約2,700m〜）',
  },
  {
    minElevation: 2390,
    stationNumber: 6,
    stationLabel: '富士山 6合目相当',
    detail: '森林限界付近・安全指導センター周辺（約2,390m〜）',
  },
  {
    minElevation: 2300,
    stationNumber: 5,
    stationLabel: '富士山 5合目相当',
    detail: '富士スバルライン五合目・登山口エリア（約2,300m〜）',
  },
  {
    minElevation: 2150,
    stationNumber: 4,
    stationLabel: '富士山 4合目相当',
    detail: '大沢休泊所周辺の樹林帯（約2,150m〜）',
  },
  {
    minElevation: 2000,
    stationNumber: 3,
    stationLabel: '富士山 3合目相当',
    detail: '中腹の深い針葉樹林エリア（約2,000m〜）',
  },
  {
    minElevation: 1700,
    stationNumber: 2,
    stationLabel: '富士山 2合目相当',
    detail: '御室浅間神社周辺の森林帯（約1,700m〜）',
  },
  {
    minElevation: 1400,
    stationNumber: 1,
    stationLabel: '富士山 1合目相当',
    detail: '鈴原天照大神社周辺の登山道入口（約1,400m〜）',
  },
];

/**
 * 現在の標高(m)から富士山の何合目相当かを判定する
 */
export function getFujiStationInfo(
  elevation: number | null
): FujiStationInfo | null {
  if (elevation === null || Number.isNaN(elevation)) {
    return null;
  }

  const rawPercent = (elevation / FUJI_SUMMIT_ELEVATION) * 100;
  const progressPercent = Math.min(
    100,
    Math.max(0, Number(rawPercent.toFixed(1)))
  );
  const remainingToSummit = Math.max(
    0,
    Number((FUJI_SUMMIT_ELEVATION - elevation).toFixed(1))
  );

  for (const station of FUJI_STATIONS) {
    if (elevation >= station.minElevation) {
      return {
        stationNumber: station.stationNumber,
        stationLabel: station.stationLabel,
        progressPercent,
        remainingToSummit,
        description: station.detail,
      };
    }
  }

  // 1,400m未満（0合目・麓・平地エリア）
  const remainingToFirstStation = Number((1400 - elevation).toFixed(1));
  return {
    stationNumber: 0,
    stationLabel: '富士山 0合目（麓・平地エリア）',
    progressPercent,
    remainingToSummit,
    description: `1合目（1,400m）まであと ${remainingToFirstStation} m`,
  };
}
