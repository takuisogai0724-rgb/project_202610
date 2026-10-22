import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ElevationPalette, Spacing } from '@/constants/theme';
import type { ElevationData } from '@/hooks/use-elevation';

interface ElevationHeroCardProps {
  data: ElevationData | null;
  loading: boolean;
}

export function ElevationHeroCard({ data, loading }: ElevationHeroCardProps) {
  const sourceLabel = data?.groundSource
    ? `データ元: ${data.groundSource}`
    : data?.gpsAltitude !== null && data?.gpsAltitude !== undefined
      ? 'データ元: 端末GPSセンサー'
      : '位置情報を待機中';

  return (
    <ThemedView type="backgroundElement" style={styles.heroCard}>
      <ThemedText type="small" themeColor="textSecondary">
        現在の標高（海抜）
      </ThemedText>

      {loading && !data ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={ElevationPalette.primary} />
          <ThemedText type="small" themeColor="textSecondary">
            位置情報から標高を計算中...
          </ThemedText>
        </View>
      ) : (
        <View style={styles.elevationRow}>
          <ThemedText style={styles.elevationValue}>
            {data?.primaryElevation !== null &&
            data?.primaryElevation !== undefined
              ? data.primaryElevation.toFixed(1)
              : '---'}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.elevationUnit}>
            m
          </ThemedText>
        </View>
      )}

      <View style={styles.badge}>
        <ThemedText type="code" style={styles.badgeText}>
          {sourceLabel}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: Spacing.four,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingBox: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  elevationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  elevationValue: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  elevationUnit: {
    fontSize: 28,
    lineHeight: 36,
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    backgroundColor: ElevationPalette.primarySoftBg,
  },
  badgeText: {
    color: ElevationPalette.primary,
  },
});
