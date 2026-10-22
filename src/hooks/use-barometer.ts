import { Barometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

import {
  type BarometerState,
  calculateSeaLevelPressure,
  estimateAltitudeFromPressure,
  resolveBarometerReading,
  STANDARD_SEA_LEVEL_PRESSURE_HPA,
} from '@/utils/barometer';

export {
  type BarometerState,
  calculateSeaLevelPressure,
  estimateAltitudeFromPressure,
  STANDARD_SEA_LEVEL_PRESSURE_HPA,
};

interface InternalSensorState {
  isAvailable: boolean;
  pressure: number | null;
  calibratedSeaLevelPressure: number | null;
  calibratedForElevation: number | null;
}

/**
 * 気圧センサーを購読し、基準標高（国土地理院/DEM）が与えられた場合は
 * 海面気圧 P0 を自動キャリブレーション（補正）して高精度な気圧高度を算出するフック
 */
export function useBarometer(
  referenceElevation: number | null = null
): BarometerState {
  const [sensorState, setSensorState] = useState<InternalSensorState>({
    isAvailable: false,
    pressure: null,
    calibratedSeaLevelPressure: null,
    calibratedForElevation: null,
  });

  const referenceElevationRef = useRef<number | null>(referenceElevation);

  useEffect(() => {
    referenceElevationRef.current = referenceElevation;
  }, [referenceElevation]);

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    if (typeof Barometer?.isAvailableAsync !== 'function') {
      return;
    }

    void Barometer.isAvailableAsync()
      .then((available) => {
        if (cancelled) return;
        if (!available) {
          setSensorState({
            isAvailable: false,
            pressure: null,
            calibratedSeaLevelPressure: null,
            calibratedForElevation: null,
          });
          return;
        }

        setSensorState((prev) => ({ ...prev, isAvailable: true }));

        if (typeof Barometer.setUpdateInterval === 'function') {
          Barometer.setUpdateInterval(1500);
        }

        subscription = Barometer.addListener((measurement) => {
          if (cancelled) return;
          const pressure =
            typeof measurement?.pressure === 'number' &&
            Number.isFinite(measurement.pressure)
              ? Math.round(measurement.pressure * 10) / 10
              : null;

          setSensorState((prev) => {
            const refElev = referenceElevationRef.current;
            let nextCalibratedP0 = prev.calibratedSeaLevelPressure;
            let nextCalibratedElev = prev.calibratedForElevation;

            if (
              refElev !== null &&
              Number.isFinite(refElev) &&
              prev.calibratedForElevation !== refElev
            ) {
              const basePressure = prev.pressure ?? pressure;
              const computedP0 = calculateSeaLevelPressure(
                basePressure,
                refElev
              );
              if (computedP0 !== null) {
                nextCalibratedP0 = computedP0;
                nextCalibratedElev = refElev;
              }
            }

            return {
              isAvailable: true,
              pressure,
              calibratedSeaLevelPressure: nextCalibratedP0,
              calibratedForElevation: nextCalibratedElev,
            };
          });
        });
      })
      .catch(() => {
        // 気圧センサー非対応環境（Web等）では安全にスキップ
      });

    return () => {
      cancelled = true;
      subscription?.remove();
      subscription = null;
    };
  }, []);

  return resolveBarometerReading({
    isAvailable: sensorState.isAvailable,
    pressure: sensorState.pressure,
    calibratedSeaLevelPressure: sensorState.calibratedSeaLevelPressure,
    calibratedForElevation: sensorState.calibratedForElevation,
    referenceElevation,
  });
}
