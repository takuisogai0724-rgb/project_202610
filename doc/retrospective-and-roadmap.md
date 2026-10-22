# 今後の課題（ロードマップ）と対応状況

作成日: 2026-10-17（最終更新: 2026-10-18）
関連ドキュメント: [開発の振り返り：プロンプトの評価と改善ヒント (`doc/prompt-retrospective.md`)](file:///c:/Users/takui/OneDrive/codes/project_202610/doc/prompt-retrospective.md)

---

## このアプリの改修ロードマップ・対応状況（最新）

初期リリース（v1.0）から v2.0・ストア公開準備フェーズにかけて、**コード・デザイン・ドキュメント面で必要な開発項目はすべて実装・テスト完了（全22テスト PASS・ラインカバレッジ 90.97%）** しました。
現在の実装完了項目と、Google Play ストア公開時に行う実作業（ビルド・審査登録）のステータスを以下に整理します。

### 1. セキュリティ・データ管理面の課題（すべて対応完了 ✅）

| 優先度 | 課題・項目 | 対応状況 | 実装内容 |
| :---: | :--- | :---: | :--- |
| **高 (P1)** | **履歴データの端末内永続化と暗号化** | **✅ 対応済** | [`src/utils/history-storage.ts`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/utils/history-storage.ts) にて `expo-secure-store`（1,500文字チャンク分割暗号化保存）を導入し、アプリ再起動後も最大 **100件** まで履歴を安全に保持・復元。 |
| **中 (P3)** | **自動追従モード時のAPIキャッシュ・レート制限** | **✅ 対応済** | [`src/utils/elevation-api.ts`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/utils/elevation-api.ts) にて半径10m以内・10分間の空間キャッシュ再利用および自動追従時の3秒間レート制限を実装。 |
| **高** | **最小権限の徹底とバックグラウンド権限遮断** | **✅ 対応済** | [`app.json`](file:///c:/Users/takui/OneDrive/codes/project_202610/app.json) にてフォアグラウンド位置情報権限のみを要求し、`ACCESS_BACKGROUND_LOCATION` 等を `blockedPermissions` で明示的にブロック。 |

---

### 2. 機能拡張・UI/UX改善項目（すべて対応完了 ✅）

| 優先度 | 課題・項目 | 対応状況 | 実装内容 |
| :---: | :--- | :---: | :--- |
| **高 (P2)** | **同じ標高の地域・名所比較モード（初期表示化）** | **✅ 対応済** | [`src/utils/region-comparison.ts`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/utils/region-comparison.ts) および [`FujiStationCard`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/components/elevation/fuji-station-card.tsx) にて、現在地と同じ標高の地域・都市・名所（全28スポット）を検索・比較するモードを実装し、初期表示タブ（`🗺️ 同じ標高の地域`）に設定。 |
| **低 (P4)** | **標高推移グラフと20地点スライディング表示** | **✅ 対応済** | [`src/components/elevation/elevation-chart-card.tsx`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/components/elevation/elevation-chart-card.tsx)（`buildElevationChartModel`）にて、最高・最低・高低差（$\Delta\text{m}$）および20件超の記録時に `#2〜#21` のように自動スライド更新されるバーチャートを実装。 |
| **低 (P4)** | **気圧センサー連携と海面気圧（$P_0$）自動補正・2行表示** | **✅ 対応済** | [`src/utils/barometer.ts`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/utils/barometer.ts)・[`src/hooks/use-barometer.ts`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/hooks/use-barometer.ts)・[`ElevationDetailCard`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/components/elevation/elevation-detail-card.tsx) にて、国土地理院DEM標高から当日の海面気圧 $P_0$ を自動逆算してキャリブレーションし、`1025.6 hPa` / `（-1.1 m・補正済）` の2行で見切れずに表示。 |
| **高** | **モバイルブラウザ（エミュレータ）横幅・中央表示対応** | **✅ 対応済** | [`src/global.css`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/global.css)・[`src/components/app-tabs.web.tsx`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/components/app-tabs.web.tsx)・[`src/app/index.tsx`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/app/index.tsx) にて `width: '100%'`・`flexShrink: 1`・`overflow-x: hidden` を徹底し、Pixel 9 Pro 等のエミュレータや狭小画面でも中央に均等表示されるよう修正。 |

---

### 3. ストア公開（Google Play / Android）に向けた準備状況と残作業

| 優先度 | 課題・項目 | 対応状況 | 現在の状態と今後のアクション |
| :---: | :--- | :---: | :--- |
| **高** | **不要なテンプレート画面の削除と「情報・規約」画面の実装** | **✅ 対応済** | 英語の初期サンプル画面（`Explore`）および `Expo Starter` / `Docs` 表記を廃止し、[`src/app/explore.tsx`](file:///c:/Users/takui/OneDrive/codes/project_202610/src/app/explore.tsx) に日本語の **「情報・規約（データの仕組み・アプリ内プライバシーポリシー全文・出典）」画面（`InfoScreen`）** を実装完了。 |
| **高** | **アプリアイコン・スプラッシュ画面の専用デザイン化** | **✅ 対応済** | **「高度計（アルティメーター）文字盤＋富士山シルエット」** の専用デザインで [`assets/images/`](file:///c:/Users/takui/OneDrive/codes/project_202610/assets/images/) 内の全6アセット（`icon.png`, Androidアダプティブ前景/背景/モノクロ, `splash-icon.png`, `favicon.png`）を作成・適用し、画面ヘッダー内にもエンブレムを配置完了。 |
| **高** | **プライバシーポリシー文面・データセーフティ回答の作成** | **✅ 文面作成済**<br>（⏳ URL登録待ち） | アプリ内への全文掲載は完了。ストア提出用のWeb公開文面（日英併記）と Google Play Console「データセーフティ」回答表を [`doc/privacy-policy.md`](file:///c:/Users/takui/OneDrive/codes/project_202610/doc/privacy-policy.md) に作成済。<br>👉 **残作業**：[`doc/privacy-policy.md`](file:///c:/Users/takui/OneDrive/codes/project_202610/doc/privacy-policy.md) の本文を Notion 公開ページや GitHub Pages 等に貼り付け、発行されたURLを Play Console に登録する。 |
| **高** | **本番用ビルド（AAB / APK）の作成と Google Play 提出** | **⏳ ストア提出時** | [`app.json`](file:///c:/Users/takui/OneDrive/codes/project_202610/app.json) に `versionCode: 1` 等を設定済。<br>👉 **残作業**：<br>1. 必要に応じて [`app.json`](file:///c:/Users/takui/OneDrive/codes/project_202610/app.json) の `android.package` 名を最終確定<br>2. `npx eas-cli@latest build --platform android --profile production` で署名付き `.aab` をクラウドビルド<br>3. Google Play Console（初回登録 $25）へアップロードし、クローズドテスト（個人開発者アカウントの場合は12人×14日間）を経て本番公開申請を行う。 |

