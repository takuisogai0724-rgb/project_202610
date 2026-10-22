import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ElevationPalette, Spacing } from '@/constants/theme';
import type { BarometerState } from '@/hooks/use-barometer';
import type { ElevationData } from '@/hooks/use-elevation';
import { formatCoordinates, formatMeters } from '@/utils/format';

/** Android 12+ の「おおよその位置情報」等で水平誤差が大きいと判定する閾値 (m) */
export const COARSE_ACCURACY_THRESHOLD_METERS = 100;

interface ElevationDetailCardProps {
  data: ElevationData | null;
  barometer?: BarometerState;
}

export function ElevationDetailCard({
  data,
  barometer,
}: ElevationDetailCardProps) {
  const gpsAltitudeText =
    data?.gpsAltitude !== null && data?.gpsAltitude !== undefined
      ? `${data.gpsAltitude.toFixed(1)} m${
          data.gpsAltitudeAccuracy
            ? ` (±${data.gpsAltitudeAccuracy.toFixed(0)}m)`
            : ''
        }`
      : '未対応 / 未取得';

  const hasBarometerValue =
    Boolean(barometer?.isAvailable) &&
    barometer?.pressure !== null &&
    barometer?.pressure !== undefined;

  const isCoarseLocation =
    data?.horizontalAccuracy !== null &&
    data?.horizontalAccuracy !== undefined &&
    data.horizontalAccuracy > COARSE_ACCURACY_THRESHOLD_METERS;

  return (
    <ThemedView type="backgroundElement" style={styles.detailCard}>
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        計測データの詳細
      </ThemedText>

      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">
          地表の標高（国土地理院/DEM）
        </ThemedText>
        <ThemedText type="smallBold">
          {formatMeters(data?.groundElevation ?? null, 1)}
        </ThemedText>
      </View>

      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">
          GPSセンサー高度（端末直接）
        </ThemedText>
        <ThemedText type="smallBold">{gpsAltitudeText}</ThemedText>
      </View>

      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">
          気圧センサー（気圧 / 換算高度）
        </ThemedText>
        {hasBarometerValue &&
        barometer?.pressure !== null &&
        barometer?.pressure !== undefined ? (
          <View style={styles.barometerValueColumn}>
            <ThemedText type="smallBold" style={styles.rightAlignedText}>
              {`${barometer.pressure.toFixed(1)} hPa`}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.rightAlignedText}>
              {`（${formatMeters(barometer.estimatedAltitude, 1)}${
                barometer.isCalibrated ? '・補正済' : ''
              }）`}
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="smallBold">未搭載 / 非対応</ThemedText>
        )}
      </View>

      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">
          緯度 / 経度
        </ThemedText>
        <ThemedText type="code">
          {data ? formatCoordinates(data.latitude, data.longitude, 5) : '---'}
        </ThemedText>
      </View>

      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">
          位置情報の水平精度
        </ThemedText>
        <ThemedText type="small">
          {data?.horizontalAccuracy
            ? `±${data.horizontalAccuracy.toFixed(0)} m`
            : '---'}
        </ThemedText>
      </View>

      {isCoarseLocation && (
        <View style={styles.coarseWarningBox}>
          <ThemedText type="small" style={styles.coarseWarningText}>
            ※位置情報の誤差が大きいため標高が不正確な可能性があります。「正確な位置情報」を許可してください。
          </ThemedText>
        </View>
      )}

      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">
          最終取得時刻
        </ThemedText>
        <ThemedText type="small">
          {data ? data.timestamp.toLocaleTimeString('ja-JP') : '---'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  detailCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    marginBottom: Spacing.half,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  barometerValueColumn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rightAlignedText: {
    textAlign: 'right',
  },
  coarseWarningBox: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: ElevationPalette.warningSoftBg,
  },
  coarseWarningText: {
    color: ElevationPalette.warningAmber,
  },
});
