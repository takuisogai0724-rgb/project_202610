/** 国際標準大気の海面気圧 (hPa) */
export const STANDARD_SEA_LEVEL_PRESSURE_HPA = 1013.25;

const SCALE_HEIGHT_METERS = 44330;
const BAROMETRIC_EXPONENT = 0.190295;
const MIN_VALID_PRESSURE_HPA = 100;
const MAX_VALID_PRESSURE_HPA = 1200;
const MIN_VALID_ELEVATION_METERS = -500;
const MAX_VALID_ELEVATION_METERS = 10000;

export interface BarometerState {
  /** 端末に気圧センサーが搭載・利用可能か */
  isAvailable: boolean;
  /** 現在の気圧 (hPa) */
  pressure: number | null;
  /** 気圧換算高度 (m) — 基準標高がある場合は自動補正後の高度 */
  estimatedAltitude: number | null;
  /** 地表標高（国土地理院/DEM）により基準海面気圧が自動補正済みか */
  isCalibrated: boolean;
  /** 計算に使用している基準海面気圧 P0 (hPa) */
  seaLevelPressure: number;
}

/**
 * 気圧値が有効な大気圧範囲（100〜1,200 hPa）内かを検証する
 */
export function isValidPressure(pressureHpa: number | null): pressureHpa is number {
  return (
    pressureHpa !== null &&
    Number.isFinite(pressureHpa) &&
    pressureHpa >= MIN_VALID_PRESSURE_HPA &&
    pressureHpa <= MAX_VALID_PRESSURE_HPA
  );
}

/**
 * 現在の気圧 (hPa) と既知の正確な標高 (m) から、その時点の海面更正気圧 P0 (hPa) を逆算する
 * P0 = P / (1 - h / 44330)^(1 / 0.190295)
 */
export function calculateSeaLevelPressure(
  pressureHpa: number | null,
  elevationMeters: number | null
): number | null {
  if (
    !isValidPressure(pressureHpa) ||
    elevationMeters === null ||
    !Number.isFinite(elevationMeters) ||
    elevationMeters < MIN_VALID_ELEVATION_METERS ||
    elevationMeters > MAX_VALID_ELEVATION_METERS
  ) {
    return null;
  }

  const baseRatio = 1 - elevationMeters / SCALE_HEIGHT_METERS;
  if (baseRatio <= 0) {
    return null;
  }

  const seaLevelPressure =
    pressureHpa / Math.pow(baseRatio, 1 / BAROMETRIC_EXPONENT);
  return Math.round(seaLevelPressure * 100) / 100;
}

/**
 * 気圧 (hPa) と基準海面気圧 P0 (hPa) から標高 (m) を算出する
 * h = 44330 * (1 - (P / P0)^0.190295)
 */
export function estimateAltitudeFromPressure(
  pressureHpa: number | null,
  seaLevelPressureHpa: number = STANDARD_SEA_LEVEL_PRESSURE_HPA
): number | null {
  if (
    !isValidPressure(pressureHpa) ||
    !Number.isFinite(seaLevelPressureHpa) ||
    seaLevelPressureHpa <= 0
  ) {
    return null;
  }

  const altitude =
    SCALE_HEIGHT_METERS *
    (1 - Math.pow(pressureHpa / seaLevelPressureHpa, BAROMETRIC_EXPONENT));
  const rounded = Math.round(altitude * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * センサー測定値と現在の基準標高から、適用すべき海面気圧 P0・補正状態・換算高度を決定する純粋関数
 */
export function resolveBarometerReading(params: {
  isAvailable: boolean;
  pressure: number | null;
  calibratedSeaLevelPressure: number | null;
  calibratedForElevation: number | null;
  referenceElevation: number | null;
}): BarometerState {
  const {
    isAvailable,
    pressure,
    calibratedSeaLevelPressure,
    calibratedForElevation,
    referenceElevation,
  } = params;

  let activeSeaLevelPressure = STANDARD_SEA_LEVEL_PRESSURE_HPA;
  let isCalibrated = false;

  if (pressure !== null) {
    if (
      referenceElevation !== null &&
      Number.isFinite(referenceElevation) &&
      calibratedForElevation !== referenceElevation
    ) {
      const immediateP0 = calculateSeaLevelPressure(
        pressure,
        referenceElevation
      );
      if (immediateP0 !== null) {
        activeSeaLevelPressure = immediateP0;
        isCalibrated = true;
      }
    } else if (calibratedSeaLevelPressure !== null) {
      activeSeaLevelPressure = calibratedSeaLevelPressure;
      isCalibrated = true;
    }
  }

  return {
    isAvailable,
    pressure,
    estimatedAltitude: estimateAltitudeFromPressure(
      pressure,
      activeSeaLevelPressure
    ),
    isCalibrated,
    seaLevelPressure: activeSeaLevelPressure,
  };
}
