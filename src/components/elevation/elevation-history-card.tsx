import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ElevationPalette, Spacing } from '@/constants/theme';
import type { ElevationHistoryItem } from '@/hooks/use-elevation';
import { formatCoordinates, formatMeters } from '@/utils/format';

interface ElevationHistoryCardProps {
  history: ElevationHistoryItem[];
  onClearHistory: () => void;
}

export function ElevationHistoryCard({
  history,
  onClearHistory,
}: ElevationHistoryCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.historyTitleGroup}>
          <ThemedText type="smallBold">標高の記録履歴</ThemedText>
          {history.length > 0 && (
            <ThemedText type="code" themeColor="textSecondary">
              {`記録件数: ${history.length}件`}
            </ThemedText>
          )}
        </View>

        {history.length > 0 && (
          <Pressable
            onPress={onClearHistory}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.buttonPressed,
            ]}>
            <ThemedText type="smallBold" style={styles.clearButtonText}>
              履歴をクリア
            </ThemedText>
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.emptyHistoryText}>
          まだ記録された履歴はありません
        </ThemedText>
      ) : (
        <View style={styles.historyList}>
          {history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyItemMain}>
                <ThemedText type="smallBold" style={styles.historyElevation}>
                  {formatMeters(item.elevation, 1)}
                </ThemedText>
                <ThemedText type="small" style={styles.historyFujiBadge}>
                  {item.fujiStationLabel}
                </ThemedText>
              </View>
              <View style={styles.historyItemSub}>
                <ThemedText type="code" themeColor="textSecondary">
                  {formatCoordinates(item.latitude, item.longitude, 4)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.savedAt.toLocaleTimeString('ja-JP')}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clearButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: ElevationPalette.dangerSoftBg,
  },
  clearButtonText: {
    color: ElevationPalette.dangerRed,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  emptyHistoryText: {
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  historyList: {
    gap: Spacing.two,
  },
  historyItem: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ElevationPalette.divider,
    gap: Spacing.one,
  },
  historyItemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyElevation: {
    fontSize: 18,
  },
  historyFujiBadge: {
    color: ElevationPalette.primary,
  },
  historyItemSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
