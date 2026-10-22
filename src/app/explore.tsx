import { Image } from 'expo-image';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  ElevationPalette,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';

export default function InfoScreen() {
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
              ABOUT & PRIVACY POLICY
            </ThemedText>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              アプリ情報・利用規約
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.badgeRow}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                現在地の標高計
              </ThemedText>
              <View style={styles.versionBadge}>
                <ThemedText type="code" style={styles.versionText}>
                  v1.0.0
                </ThemedText>
              </View>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              現在地の緯度・経度から高精度な地表標高（海抜）を取得し、日本や世界の同じ標高の地域・富士山何合目換算・標高推移グラフ・気圧センサー補正高度をリアルタイムに確認できる標高計アプリです。
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              📐 標高・高度データの仕組み
            </ThemedText>

            <View style={styles.infoBlock}>
              <ThemedText type="smallBold" style={styles.accentTitle}>
                1. 地表の標高（国土地理院 / Open-Meteo DEM）
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                日本国内では国土地理院の数値標高モデル（DEM5A / DEM5B / DEM10B）を最優先で使用し、レーザー測量に基づく高精度な地表標高を表示します。海外やデータ範囲外の地域では Open-Meteo Elevation API（90mメッシュDEM）へ自動フォールバックします。
              </ThemedText>
            </View>

            <View style={styles.infoBlock}>
              <ThemedText type="smallBold" style={styles.accentTitle}>
                2. 端末GPSセンサー高度（オフライン対応）
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                スマートフォンのGNSS/GPSチップが直接算出する高度です。山間部など電波の届かない圏外環境で標高APIが取得できない場合でも、GPS高度へ自動的に切り替わり計測を継続します。
              </ThemedText>
            </View>

            <View style={styles.infoBlock}>
              <ThemedText type="smallBold" style={styles.accentTitle}>
                3. 気圧センサーと海面気圧（P0）自動補正
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                気圧センサー搭載端末では、国際標準大気（ISA）の測高公式から換算高度を算出します。天候（高気圧・低気圧）による数10m〜100mのズレを防ぐため、現在地の地表標高（DEM）を基準に当日の海面気圧（P0）を自動逆算してキャリブレーション（補正）を行っています。
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              🔒 プライバシーポリシー
            </ThemedText>

            <View style={styles.infoBlock}>
              <ThemedText type="smallBold">1. 取得する情報と利用目的</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                本アプリは、現在地の標高（海抜）の算出および画面表示の目的でのみ、端末の位置情報（緯度・経度・高度・精度）および気圧センサー値を使用します。アプリ起動中（フォアグラウンド）のみ位置情報を取得し、バックグラウンドでの位置情報追跡は一切行いません。
              </ThemedText>
            </View>

            <View style={styles.infoBlock}>
              <ThemedText type="smallBold">
                2. 外部APIへの送信について
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                現在地の地表標高を取得するため、取得した緯度・経度の数値のみを「国土地理院 標高API」または「Open-Meteo Elevation API」へHTTPS通信で送信します。端末識別子（ID）、氏名、メールアドレス等の個人を特定できる情報は一切取得・送信しません。
              </ThemedText>
            </View>

            <View style={styles.infoBlock}>
              <ThemedText type="smallBold">
                3. 記録履歴データの端末内保存と削除
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                「現在の標高を記録」ボタンで保存された履歴データ（最大100件）は、お使いの端末内の暗号化ストレージ（SecureStore / Web環境ではブラウザのローカルストレージ）にのみ保存され、開発者や第三者のサーバーへ送信・収集されることはありません。履歴データはホーム画面の「履歴をクリア」ボタン、またはアプリのアンインストールによりいつでも完全に削除できます。
              </ThemedText>
            </View>

            <View style={styles.infoBlock}>
              <ThemedText type="smallBold">4. 免責事項</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                本アプリが表示する標高・高度・位置情報は参考値であり、測量・航空・登山等の安全を保証するものではありません。本アプリの利用により生じたいかなる損害についても、開発者は責任を負いかねますのであらかじめご了承ください。
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              📚 データ出典・ライセンス表記
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ・国土地理院 標高API（数値地図5m・10mメッシュ（標高）データ）
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ・Open-Meteo.com Elevation API (Copernicus DEM GLO-90, CC BY 4.0)
            </ThemedText>
          </ThemedView>
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
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 16,
  },
  versionBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: ElevationPalette.primarySoftBg,
  },
  versionText: {
    color: ElevationPalette.primary,
  },
  infoBlock: {
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ElevationPalette.divider,
    gap: Spacing.one,
  },
  accentTitle: {
    color: ElevationPalette.primary,
  },
});

