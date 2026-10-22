import { Image } from 'expo-image';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ElevationChartCard } from '@/components/elevation/elevation-chart-card';
import { ElevationDetailCard } from '@/components/elevation/elevation-detail-card';
import { ElevationHeroCard } from '@/components/elevation/elevation-hero-card';
import { ElevationHistoryCard } from '@/components/elevation/elevation-history-card';
import { FujiStationCard } from '@/components/elevation/fuji-station-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  ElevationPalette,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { useBarometer } from '@/hooks/use-barometer';
import { useElevation } from '@/hooks/use-elevation';
import { formatMeters } from '@/utils/format';

export { formatMeters };

export default function HomeScreen() {
  const {
    data,
    loading,
    errorMsg,
    isWatching,
    history,
    refreshElevation,
    toggleWatching,
    saveCurrentElevation,
    clearHistory,
  } = useElevation();

  const barometer = useBarometer(
    data?.groundElevation ?? data?.primaryElevation ?? null
  );

  const canSave = data !== null && data.primaryElevation !== null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/splash-icon.png')}
              style={styles.headerIcon}
              accessibilityLabel="現在地の標高計アイコン"
            />
            <ThemedText type="smallBold" themeColor="textSecondary">
              ALTITUDE & ELEVATION
            </ThemedText>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              現在地の標高計
            </ThemedText>
          </View>

          <ElevationHeroCard data={data} loading={loading} />

          {data?.fujiStation && (
            <FujiStationCard
              fujiStation={data.fujiStation}
              regionComparison={data.regionComparison}
            />
          )}

          {errorMsg && (
            <View style={styles.errorBanner}>
              <ThemedText type="smallBold" style={styles.errorText}>
                {errorMsg}
              </ThemedText>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => void refreshElevation()}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || loading) && styles.buttonPressed,
              ]}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                {loading ? '取得中...' : '現在地を再取得'}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => void toggleWatching()}
              style={({ pressed }) => [
                styles.secondaryButton,
                isWatching && styles.watchingActiveButton,
                pressed && styles.buttonPressed,
              ]}>
              <ThemedText
                type="smallBold"
                style={
                  isWatching
                    ? styles.watchingActiveText
                    : styles.secondaryButtonText
                }>
                {isWatching ? '● 自動追従中 (ON)' : '自動追従 (OFF)'}
              </ThemedText>
            </Pressable>
          </View>

          <Pressable
            onPress={saveCurrentElevation}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.recordButton,
              (!canSave || pressed) && styles.buttonPressed,
            ]}>
            <ThemedText type="smallBold" style={styles.recordButtonText}>
              現在の標高を記録
            </ThemedText>
          </Pressable>

          <ElevationDetailCard data={data} barometer={barometer} />

          <ElevationChartCard history={history} />

          <ElevationHistoryCard
            history={history}
            onClearHistory={clearHistory}
          />

          <View style={styles.footerNotice}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.footerText}>
              出典：国土地理院 標高API / Open-Meteo DEM
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.footerText}>
              ※記録した位置情報の履歴は端末内にのみ保持され、外部サーバーへは送信されません。
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    flexShrink: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.select({
      web: Spacing.six + Spacing.two,
      default: Spacing.four,
    }),
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  headerIcon: {
    width: 56,
    height: 56,
    marginBottom: Spacing.half,
  },
  headerTitle: {
    textAlign: 'center',
  },
  errorBanner: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: ElevationPalette.dangerSoftBg,
  },
  errorText: {
    color: ElevationPalette.dangerRed,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: ElevationPalette.primary,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: ElevationPalette.white,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: ElevationPalette.primary,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: ElevationPalette.primary,
  },
  watchingActiveButton: {
    backgroundColor: ElevationPalette.accentTeal,
    borderColor: ElevationPalette.accentTeal,
  },
  watchingActiveText: {
    color: ElevationPalette.white,
  },
  recordButton: {
    backgroundColor: ElevationPalette.accentTeal,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonText: {
    color: ElevationPalette.white,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  footerNotice: {
    paddingTop: Spacing.two,
    alignItems: 'center',
    gap: Spacing.half,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
