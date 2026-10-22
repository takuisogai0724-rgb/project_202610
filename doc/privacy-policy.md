# プライバシーポリシー & Google Play 公開設定ガイド

本書は、Android（Google Play ストア）公開時に必須となる **プライバシーポリシー本文**（Webページや GitHub Pages / Notion 等にそのまま掲載可能）および、**Google Play Console「データセーフティ」の回答テンプレート** をまとめたドキュメントです。

---

## 1. 公開用プライバシーポリシー本文（日本語版）

> ※以下の点線内のテキストを GitHub Pages、Notion の公開ページ、Google サイト等にそのまま貼り付け、`[お問い合わせ先メールアドレスまたはフォームURL]` と `[制定日]` を書き換えて公開URLを取得してください。

---

# プライバシーポリシー（「現在地の標高計」）

本プライバシーポリシーは、モバイルアプリケーション「現在地の標高計」（以下「本アプリ」といいます）における利用者情報の取り扱いについて定めるものです。

## 1. 取得する利用者情報および利用目的

本アプリは、以下の情報を取得・利用します。

### (1) 位置情報（緯度・経度・高度・精度）
- **取得方法**: 利用者の許可に基づき、端末の位置情報センサー（GPS / GNSS 等）から取得します。
- **利用目的**:
  1. 現在地の地表標高（海抜）およびGPS高度を算出・画面表示するため
  2. 現在の標高と同じ標高の地域・富士山何合目換算を計算・表示するため
  3. 利用者が任意で「現在の標高を記録」ボタンを押した際に、端末内の履歴として記録・グラフ表示するため
- **取得タイミング**: 本アプリを画面上に表示して利用している間（フォアグラウンド動作中）のみ取得します。アプリを閉じている間（バックグラウンド）における位置情報の取得・追跡は一切行いません。

### (2) 気圧センサー情報（大気圧 hPa）
- **取得方法**: 気圧センサー搭載端末において、端末内蔵センサーから取得します。
- **利用目的**: 気圧から換算高度を算出し、現在地の標高データを用いて海面気圧補正（キャリブレーション）を行うため。

## 2. 外部サービス（API）への情報送信について

本アプリは、現在地の地表標高（数値標高モデル：DEM）を取得する目的で、取得した **緯度および経度の数値のみ** を以下の外部APIへ HTTPS 暗号化通信にて送信します。

1. **国土地理院 標高API**（日本国内の標高取得）
   - 提供元: 国土交通省 国土地理院
   - URL: `https://cyberjapandata2.gsi.go.jp/`
2. **Open-Meteo Elevation API**（海外または国土地理院データ範囲外の標高取得）
   - 提供元: Open-Meteo.com
   - URL: `https://api.open-meteo.com/`

※上記の通信において、氏名、メールアドレス、電話番号、端末識別子（広告ID・デバイスID等）などの **個人を特定できる情報は一切取得・送信いたしません**。また、開発者自身のサーバーへ位置情報や利用履歴を送信・収集することも一切ありません。

## 3. 端末内へのデータ保存と削除方法

- 利用者が本アプリ内で「現在の標高を記録」ボタンを押した場合、記録された標高・緯度・経度・日時の履歴データ（最大100件）は、**利用者の端末内の暗号化ストレージ領域（Android Keystore / Encrypted SharedPreferences 相当の SecureStore）にのみ保存** されます。
- これらの履歴データは端末外部へ送信されることはなく、以下のいずれかの方法でいつでも完全に削除できます：
  1. 本アプリ内の「履歴をクリア」ボタンをタップする
  2. 端末の設定画面から本アプリのストレージデータを消去する、または本アプリをアンインストールする

## 4. 第三者提供および広告・解析ツールについて

- 本アプリは、利用者の情報を第三者へ販売・貸与・提供することはありません。
- 本アプリには、行動ターゲティング広告モジュールや第三者トラッキングSDKは組み込まれていません。

## 5. 免責事項

本アプリが表示する標高・高度・気圧換算高度・位置情報は参考値であり、測量・登山・航空・航海等の安全や正確性を保証するものではありません。本アプリの利用によって生じたいかなる損害についても、開発者は一切の責任を負いません。

## 6. プライバシーポリシーの変更

本ポリシーの内容は、法令の改正や本アプリの機能変更に伴い、必要に応じて改定されることがあります。改定後のプライバシーポリシーは、本ページまたは本アプリ内の「情報・規約」画面に掲載した時点から効力を生じるものとします。

## 7. お問い合わせ先

本アプリのプライバシーポリシーに関するお問い合わせは、以下までご連絡ください。

- **開発者名**: airgroove0724
- **連絡先**: taku.isogai0724@gmail.com
- **制定日**: 2026年10月18日

---

## 2. 公開用プライバシーポリシー本文（English Version）

> ※Google Play で海外ユーザーにも公開される場合に備え、上記日本語の下に併記しておくと審査がよりスムーズになります。

---

# Privacy Policy ("Current Elevation Meter / 現在地の標高計")

## 1. Information We Process and Purpose of Use
- **Location Information (Latitude, Longitude, Altitude, Accuracy)**: Used solely while the app is in use (foreground) to calculate and display your current ground elevation, GPS altitude, region comparisons, and elevation history initiated by the user. We never access or track your location in the background.
- **Barometric Pressure Sensor Data**: Used locally on the device to calculate calibrated barometric altitude.

## 2. Transmission to External Elevation APIs
To retrieve ground elevation (Digital Elevation Model) for your current coordinates, the app transmits **only numerical latitude and longitude coordinates** over HTTPS to:
1. **Geospatial Information Authority of Japan (GSI) Elevation API** (`cyberjapandata2.gsi.go.jp`)
2. **Open-Meteo Elevation API** (`api.open-meteo.com`)

No personally identifiable information (such as name, email address, user ID, or device/advertising identifiers) is ever collected or transmitted. The developer does not operate any backend server that collects or stores your location data.

## 3. Local Data Storage and Deletion
Elevation history records saved by pressing the "Record Current Elevation" button are stored **exclusively on your device** using encrypted local storage (`expo-secure-store`). You can permanently delete all recorded history at any time by tapping the "Clear History" button inside the app or by uninstalling the app.

## 4. Contact Us
- **Developer**: airgroove0724
- **Contact**: taku.isogai0724@gmail.com
- **Effective Date**: October 18, 2026

---

## 3. Google Play Console「データセーフティ (Data Safety)」回答ガイド

Google Play Console の **［アプリのコンテンツ］＞［データセーフティ］** では、以下のように回答してください。

| 設問項目 | 推奨回答 | 理由・補足 |
| :--- | :--- | :--- |
| **アプリで必須のユーザーデータの収集または共有を行っていますか？** | **はい**（位置情報を標高APIへ送信するため）<br>※または「一時的処理（エフェメラル処理）」として申告 | 緯度・経度を標高取得のために HTTPS で外部APIへ送信するため、位置情報（おおよその位置情報・正確な位置情報）にチェックを入れます。 |
| **収集したすべてのユーザーデータは転送中に暗号化されますか？** | **はい** | 国土地理院API・Open-Meteo API ともに `https://`（TLS暗号化）で通信しているため。 |
| **ユーザーにデータの削除をリクエストする方法を提供していますか？** | **いいえ（サーバーにデータを保存しないため、アカウントや削除リクエスト窓口は不要）**<br>※補足欄がある場合は「アプリ内のクリアボタンで端末内データを削除可能」と選択 | 開発者サーバーに個人データや履歴を一切保存せず、一時的（エフェメラル）に標高値を取得するだけであるため。 |
| **データタイプ：位置情報 ＞ おおよその位置情報 / 正確な位置情報** | **収集（Collected）にチェック** | アプリの機能（App functionality）のために使用。 |
| **このデータは一時的（エフェメラル）に処理されますか？** | **はい（Yes, this data is processed ephemerally）** | メモリ上およびAPIリクエスト時に一時的に処理するだけで、サーバーに保存しないため「はい」を選択します。 |
| **このデータの収集は必須ですか、それとも任意ですか？** | **必須（Required）** | 位置情報がないと現在地の標高計として機能しないため。 |
| **データの利用目的** | **アプリの機能（App functionality）** のみにチェック | 広告・アナリティクス・マーケティング等は一切使用しないため。 |

---

## 4. Google Play Console「権限の宣言」について

本アプリは `app.json` にて以下の通り **バックグラウンド位置情報権限を明示的にブロック** しています：

```json
"blockedPermissions": [
  "android.permission.ACCESS_BACKGROUND_LOCATION",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_LOCATION"
]
```

これにより、Google Play 審査で最も厳しい **「バックグラウンドでの位置情報アクセスに関する申告（動画提出）」は不要** です。通常のフォアグラウンド位置情報利用（アプリ使用中のみ許可）としてスムーズに審査を通過できます。
