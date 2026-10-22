export interface ElevationRegionSpot {
  id: string;
  /** 地域・都市・名所名（例: "東京都・新宿駅周辺"） */
  name: string;
  /** 都道府県または国・エリア名 */
  prefectureOrCountry: string;
  /** 代表標高 (m) */
  elevation: number;
  /** 地域の特徴・説明 */
  description: string;
}

export interface RegionComparisonResult {
  /** 現在の標高に最も近い地域スポット */
  closestSpot: ElevationRegionSpot;
  /** 現在の標高との差 (m, 絶対値・小数第1位丸め) */
  elevationDiff: number;
  /** 同標高帯で他に高度が近い地域スポット（最大2件） */
  nearbySpots: ElevationRegionSpot[];
}

/**
 * 0m〜3,776m の代表的な地域・都市・駅・高原の標高マスターデータ
 */
export const ELEVATION_REGION_SPOTS: readonly ElevationRegionSpot[] = [
  {
    id: 'tsukiji',
    name: '東京都・築地 / 豊洲周辺',
    prefectureOrCountry: '東京都',
    elevation: 2,
    description: '東京湾に面した臨海部・湾岸エリアと同じ高さ',
  },
  {
    id: 'umeda',
    name: '大阪市・梅田駅周辺',
    prefectureOrCountry: '大阪府',
    elevation: 3,
    description: '大阪平野の中心部・淀川河口に近い都心エリアと同じ高さ',
  },
  {
    id: 'minatomirai',
    name: '横浜市・みなとみらい周辺',
    prefectureOrCountry: '神奈川県',
    elevation: 4,
    description: '横浜港を望むウォーターフロント地域と同じ高さ',
  },
  {
    id: 'tokyo-station',
    name: '東京都・東京駅（丸の内）周辺',
    prefectureOrCountry: '東京都',
    elevation: 5,
    description: '日本の主要ターミナル・日比谷〜丸の内の平地と同じ高さ',
  },
  {
    id: 'hakata',
    name: '福岡市・博多駅周辺',
    prefectureOrCountry: '福岡県',
    elevation: 8,
    description: '博多湾に近い福岡市中心部の平地と同じ高さ',
  },
  {
    id: 'nagoya-station',
    name: '名古屋市・名古屋駅周辺',
    prefectureOrCountry: '愛知県',
    elevation: 10,
    description: '濃尾平野の南部に広がる東海地方の中心街と同じ高さ',
  },
  {
    id: 'sapporo-station',
    name: '札幌市・札幌駅周辺',
    prefectureOrCountry: '北海道',
    elevation: 18,
    description: '豊平川の扇状地に広がる札幌中心部と同じ高さ',
  },
  {
    id: 'shibuya',
    name: '東京都・渋谷駅ハチ公前',
    prefectureOrCountry: '東京都',
    elevation: 19,
    description: '渋谷川の谷あい（すり鉢状の底）に位置する街と同じ高さ',
  },
  {
    id: 'kyoto-station',
    name: '京都市・JR京都駅周辺',
    prefectureOrCountry: '京都府',
    elevation: 28,
    description: '京都盆地の南側に位置する古都の玄関口と同じ高さ',
  },
  {
    id: 'shinjuku-station',
    name: '東京都・新宿駅周辺',
    prefectureOrCountry: '東京都',
    elevation: 37,
    description: '武蔵野台地の東端（山手線内の高台エリア）と同じ高さ',
  },
  {
    id: 'sendai-station',
    name: '仙台市・仙台駅周辺',
    prefectureOrCountry: '宮城県',
    elevation: 42,
    description: '広瀬川の段丘上に広がる杜の都の中心部と同じ高さ',
  },
  {
    id: 'kichijoji',
    name: '東京都・吉祥寺駅周辺',
    prefectureOrCountry: '東京都',
    elevation: 55,
    description: '武蔵野台地の中央部に広がる住宅・商業エリアと同じ高さ',
  },
  {
    id: 'kobe-kitano',
    name: '神戸市・北野異人館街',
    prefectureOrCountry: '兵庫県',
    elevation: 65,
    description: '六甲山系の麓に広がる港町の高台エリアと同じ高さ',
  },
  {
    id: 'kiyomizudera',
    name: '京都市・清水寺（音羽山山麓）',
    prefectureOrCountry: '京都府',
    elevation: 85,
    description: '京都盆地を一望する東山の中腹エリアと同じ高さ',
  },
  {
    id: 'arashiyama',
    name: '京都市・嵐山（渡月橋周辺）',
    prefectureOrCountry: '京都府',
    elevation: 120,
    description: '桂川が山間から京都盆地へ出る景勝地と同じ高さ',
  },
  {
    id: 'aizuwakamatsu',
    name: '福島県・会津若松市街（鶴ヶ城周辺）',
    prefectureOrCountry: '福島県',
    elevation: 215,
    description: '磐梯山の麓に広がる会津盆地の城下町と同じ高さ',
  },
  {
    id: 'chichibu',
    name: '埼玉県・秩父市街',
    prefectureOrCountry: '埼玉県',
    elevation: 230,
    description: '周囲を山々に囲まれた秩父盆地の中心部と同じ高さ',
  },
  {
    id: 'kofu',
    name: '山梨県・甲府駅周辺',
    prefectureOrCountry: '山梨県',
    elevation: 272,
    description: '南アルプスと富士山に囲まれた甲府盆地と同じ高さ',
  },
  {
    id: 'nagano-zenkoji',
    name: '長野市・善光寺周辺',
    prefectureOrCountry: '長野県',
    elevation: 370,
    description: '善光寺平（長野盆地）を見渡す門前町と同じ高さ',
  },
  {
    id: 'hakone-gora',
    name: '神奈川県・箱根強羅温泉',
    prefectureOrCountry: '神奈川県',
    elevation: 550,
    description: '箱根登山鉄道の終点・外輪山に囲まれた温泉郷と同じ高さ',
  },
  {
    id: 'takayama',
    name: '岐阜県・飛騨高山市街',
    prefectureOrCountry: '岐阜県',
    elevation: 570,
    description: '北アルプス山麓の飛騨高地に広がる城下町と同じ高さ',
  },
  {
    id: 'matsumoto-castle',
    name: '長野県・松本城周辺',
    prefectureOrCountry: '長野県',
    elevation: 590,
    description: '北アルプスの玄関口・松本盆地の中心市街と同じ高さ',
  },
  {
    id: 'lake-kawaguchi',
    name: '山梨県・河口湖畔',
    prefectureOrCountry: '山梨県',
    elevation: 830,
    description: '富士五湖のひとつ・富士山北麓の高原エリアと同じ高さ',
  },
  {
    id: 'karuizawa',
    name: '長野県・軽井沢駅周辺',
    prefectureOrCountry: '長野県',
    elevation: 940,
    description: '浅間山の南麓に広がる日本屈指の高原避暑地と同じ高さ',
  },
  {
    id: 'lake-chuzenji',
    name: '栃木県・奥日光 中禅寺湖畔',
    prefectureOrCountry: '栃木県',
    elevation: 1269,
    description: 'いろは坂を登りきった男体山麓の山上湖と同じ高さ',
  },
  {
    id: 'kiyosato',
    name: '山梨県・清里高原（JR最高地点付近）',
    prefectureOrCountry: '山梨県',
    elevation: 1375,
    description: '八ヶ岳南麓・JR鉄道最高地点（野辺山）付近の高原と同じ高さ',
  },
  {
    id: 'kamikochi',
    name: '長野県・上高地（河童橋周辺）',
    prefectureOrCountry: '長野県',
    elevation: 1500,
    description: '穂高連峰の麓に広がる日本屈指の山岳景勝地と同じ高さ',
  },
  {
    id: 'utsukushigahara',
    name: '長野県・美ヶ原高原',
    prefectureOrCountry: '長野県',
    elevation: 2000,
    description: '八ヶ岳中信高原国定公園の広大な雲上台地と同じ高さ',
  },
  {
    id: 'tateyama-murodo',
    name: '富山県・立山室堂（アルペンルート）',
    prefectureOrCountry: '富山県',
    elevation: 2450,
    description: '立山黒部アルペンルートの最高地点・雪の大谷と同じ高さ',
  },
  {
    id: 'norikura-tatamidaira',
    name: '長野県/岐阜県・乗鞍岳 畳平',
    prefectureOrCountry: '長野県・岐阜県',
    elevation: 2702,
    description: '日本一高いバス停がある雲上の森林限界エリアと同じ高さ',
  },
  {
    id: 'yarigatake',
    name: '長野県・北アルプス 槍ヶ岳山頂付近',
    prefectureOrCountry: '長野県',
    elevation: 3180,
    description: '日本第5位の高峰・3,000m級の北アルプス稜線と同じ高さ',
  },
  {
    id: 'fuji-summit',
    name: '静岡県/山梨県・富士山山頂（剣ヶ峰）',
    prefectureOrCountry: '静岡県・山梨県',
    elevation: 3776,
    description: '日本の最高峰・富士山山頂と同じ高さ',
  },
];

/**
 * 現在の標高(m)に最も近い地域・都市・名所を検索する
 */
export function findSameElevationRegions(
  elevation: number | null
): RegionComparisonResult | null {
  if (elevation === null || !Number.isFinite(elevation)) {
    return null;
  }

  const sortedByDiff = [...ELEVATION_REGION_SPOTS].sort((a, b) => {
    const diffA = Math.abs(a.elevation - elevation);
    const diffB = Math.abs(b.elevation - elevation);
    return diffA - diffB;
  });

  const closestSpot = sortedByDiff[0];
  const elevationDiff = Math.round(
    Math.abs(closestSpot.elevation - elevation) * 10
  ) / 10;
  const nearbySpots = sortedByDiff.slice(1, 3);

  return {
    closestSpot,
    elevationDiff,
    nearbySpots,
  };
}
