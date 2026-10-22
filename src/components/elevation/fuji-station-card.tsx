import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ElevationPalette, Spacing } from '@/constants/theme';
import type { FujiStationInfo } from '@/utils/fuji-station';
import type { RegionComparisonResult } from '@/utils/region-comparison';

export type ComparisonMode = 'region' | 'fuji';

interface FujiStationCardProps {
  fujiStation: FujiStationInfo;
  regionComparison?: RegionComparisonResult | null;
}

function RegionComparisonView({
  regionComparison,
}: {
  regionComparison: RegionComparisonResult;
}) {
  return (
    <>
      <View style={styles.fujiHeaderRow}>
        <ThemedText type="smallBold" style={styles.fujiAccentText}>
          🗺️ 現在の標高と近い地域・名所
        </ThemedText>
        <ThemedText type="code" themeColor="textSecondary">
          {`標高差 ±${regionComparison.elevationDiff.toFixed(1)} m`}
        </ThemedText>
      </View>

      <ThemedText type="smallBold" style={styles.fujiStationTitle}>
        {regionComparison.closestSpot.name}
      </ThemedText>

      <ThemedText type="smallBold" style={styles.fujiRemainingText}>
        {`代表標高 約 ${regionComparison.closestSpot.elevation} m（${regionComparison.closestSpot.prefectureOrCountry}）`}
      </ThemedText>

      <ThemedText type="small" themeColor="textSecondary">
        {regionComparison.closestSpot.description}
      </ThemedText>

      {regionComparison.nearbySpots.length > 0 && (
        <View style={styles.nearbyBox}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            他に標高が近い地域：
          </ThemedText>
          {regionComparison.nearbySpots.map((spot) => (
            <ThemedText key={spot.id} type="small" themeColor="textSecondary">
              {`・${spot.name}（約 ${spot.elevation} m）`}
            </ThemedText>
          ))}
        </View>
      )}
    </>
  );
}

function FujiStationView({ fujiStation }: { fujiStation: FujiStationInfo }) {
  return (
    <>
      <View style={styles.fujiHeaderRow}>
        <ThemedText type="smallBold" style={styles.fujiAccentText}>
          🗻 富士山（3,776m）換算
        </ThemedText>
        <ThemedText type="code" themeColor="textSecondary">
          達成率 {fujiStation.progressPercent.toFixed(1)}%
        </ThemedText>
      </View>

      <ThemedText type="smallBold" style={styles.fujiStationTitle}>
        {fujiStation.stationLabel}
      </ThemedText>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${fujiStation.progressPercent}%` },
          ]}
        />
      </View>

      <View style={styles.fujiFooter}>
        <ThemedText type="small" themeColor="textSecondary">
          {fujiStation.description}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.fujiRemainingText}>
          {`頂上（3,776m）まであと ${fujiStation.remainingToSummit.toFixed(1)} m`}
        </ThemedText>
      </View>
    </>
  );
}

export function FujiStationCard({
  fujiStation,
  regionComparison,
}: FujiStationCardProps) {
  const [mode, setMode] = useState<ComparisonMode>('region');

  return (
    <ThemedView type="backgroundElement" style={styles.fujiCard}>
      {regionComparison && (
        <View style={styles.modeTabsRow}>
          <Pressable
            onPress={() => setMode('region')}
            style={[
              styles.modeTabButton,
              mode === 'region' && styles.modeTabButtonActive,
            ]}>
            <ThemedText
              type="smallBold"
              style={
                mode === 'region'
                  ? styles.modeTabTextActive
                  : styles.modeTabTextInactive
              }>
              🗺️ 同じ標高の地域
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setMode('fuji')}
            style={[
              styles.modeTabButton,
              mode === 'fuji' && styles.modeTabButtonActive,
            ]}>
            <ThemedText
              type="smallBold"
              style={
                mode === 'fuji'
                  ? styles.modeTabTextActive
                  : styles.modeTabTextInactive
              }>
              🗻 富士山何合目
            </ThemedText>
          </Pressable>
        </View>
      )}

      {mode === 'region' && regionComparison ? (
        <RegionComparisonView regionComparison={regionComparison} />
      ) : (
        <FujiStationView fujiStation={fujiStation} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fujiCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: ElevationPalette.neutralTrackBg,
    borderRadius: Spacing.two,
    padding: 3,
    gap: 4,
    marginBottom: Spacing.one,
  },
  modeTabButton: {
    flex: 1,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabButtonActive: {
    backgroundColor: ElevationPalette.primary,
  },
  modeTabTextActive: {
    color: ElevationPalette.white,
  },
  modeTabTextInactive: {
    color: ElevationPalette.primary,
  },
  fujiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  fujiAccentText: {
    color: ElevationPalette.primary,
    flexShrink: 1,
  },
  fujiStationTitle: {
    fontSize: 22,
    lineHeight: 30,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: ElevationPalette.primaryTrackBg,
    overflow: 'hidden',
    marginVertical: Spacing.one,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: ElevationPalette.primary,
  },
  fujiFooter: {
    gap: Spacing.half,
  },
  fujiRemainingText: {
    color: ElevationPalette.accentTeal,
  },
  nearbyBox: {
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ElevationPalette.divider,
    gap: 2,
  },
});
