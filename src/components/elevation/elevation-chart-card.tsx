import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ElevationPalette, Spacing } from '@/constants/theme';
import type { ElevationHistoryItem } from '@/hooks/use-elevation';
import { formatMeters } from '@/utils/format';

/** グラフに描画する直近の最大ポイント数 */
export const MAX_CHART_POINTS = 20;

interface ElevationChartCardProps {
  history: ElevationHistoryItem[];
}

interface ChartPointModel {
  id: string;
  seqNumber: number;
  barHeightPercent: number;
  isLatest: boolean;
}

interface ElevationChartModel {
  totalCount: number;
  rangeLabel: string;
  minElevation: number;
  maxElevation: number;
  elevationDelta: number;
  points: ChartPointModel[];
  latestSummaryLabel: string;
}

/**
 * 履歴配列からグラフ描画用のスライディングウィンドウ・統計値・バー高さを算出する純粋関数
 */
export function buildElevationChartModel(
  history: ElevationHistoryItem[]
): ElevationChartModel {
  const totalCount = history.length;
  // history[0] が最新なので、先頭から最大20件を取り出し、古い順（左）→ 新しい順（右）に並べる
  const chartItems = history.slice(0, MAX_CHART_POINTS).reverse();
  const startSeqNumber = Math.max(1, totalCount - chartItems.length + 1);
  const latestItem = chartItems[chartItems.length - 1];

  const elevations = chartItems.map((item) => item.elevation);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationDelta = Math.max(0, maxElevation - minElevation);

  const rangeLabel =
    totalCount > MAX_CHART_POINTS
      ? `直近 ${chartItems.length} 地点 (#${startSeqNumber}〜#${totalCount})`
      : `直近 ${chartItems.length} 地点`;

  const points: ChartPointModel[] = chartItems.map((item, idx) => {
    const normalizedRatio =
      elevationDelta > 0
        ? (item.elevation - minElevation) / elevationDelta
        : 0.5;
    return {
      id: item.id,
      seqNumber: startSeqNumber + idx,
      barHeightPercent: Math.round(20 + normalizedRatio * 80),
      isLatest: idx === chartItems.length - 1,
    };
  });

  const latestSummaryLabel = `最新 #${totalCount}: ${formatMeters(
    latestItem.elevation,
    1
  )} (${latestItem.savedAt.toLocaleTimeString('ja-JP')})`;

  return {
    totalCount,
    rangeLabel,
    minElevation,
    maxElevation,
    elevationDelta,
    points,
    latestSummaryLabel,
  };
}

export function ElevationChartCard({ history }: ElevationChartCardProps) {
  if (history.length === 0) {
    return null;
  }

  const model = buildElevationChartModel(history);

  return (
    <ThemedView type="backgroundElement" style={styles.chartCard}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">📈 標高推移グラフ</ThemedText>
        <ThemedText type="code" themeColor="textSecondary">
          {model.rangeLabel}
        </ThemedText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <ThemedText type="small" themeColor="textSecondary">
            最高標高
          </ThemedText>
          <ThemedText type="smallBold" style={styles.maxText}>
            {formatMeters(model.maxElevation, 1)}
          </ThemedText>
        </View>

        <View style={styles.statBadge}>
          <ThemedText type="small" themeColor="textSecondary">
            最低標高
          </ThemedText>
          <ThemedText type="smallBold" style={styles.minText}>
            {formatMeters(model.minElevation, 1)}
          </ThemedText>
        </View>

        <View style={styles.statBadge}>
          <ThemedText type="small" themeColor="textSecondary">
            高低差 (Δ)
          </ThemedText>
          <ThemedText type="smallBold" style={styles.deltaText}>
            {`${model.elevationDelta.toFixed(1)} m`}
          </ThemedText>
        </View>
      </View>

      <View style={styles.barsContainer}>
        {model.points.map((point) => (
          <View key={point.id} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: `${point.barHeightPercent}%` },
                  point.isLatest && styles.latestBarFill,
                ]}
              />
            </View>
            <ThemedText
              type="code"
              themeColor="textSecondary"
              style={[
                styles.barIndexText,
                point.isLatest && styles.latestBarIndexText,
              ]}>
              {point.seqNumber}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.chartFooterRow}>
        <ThemedText type="small" themeColor="textSecondary">
          左が過去 → 右端（緑色）が最新の記録
        </ThemedText>
        <ThemedText type="smallBold" style={styles.latestSummaryText}>
          {model.latestSummaryLabel}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  statBadge: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: ElevationPalette.primarySubtleBg,
    alignItems: 'center',
    gap: Spacing.half,
  },
  maxText: {
    color: ElevationPalette.primary,
  },
  minText: {
    color: ElevationPalette.accentTeal,
  },
  deltaText: {
    color: ElevationPalette.warningAmber,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 96,
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    maxWidth: 24,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: ElevationPalette.neutralTrackBg,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: ElevationPalette.primaryBarFill,
    borderRadius: 6,
  },
  latestBarFill: {
    backgroundColor: ElevationPalette.accentTeal,
  },
  barIndexText: {
    fontSize: 10,
  },
  latestBarIndexText: {
    color: ElevationPalette.accentTeal,
    fontWeight: '700',
  },
  chartFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  latestSummaryText: {
    color: ElevationPalette.accentTeal,
  },
});
