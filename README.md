# 🦒 Never Note

Evernote ライクな共同ノートアプリ。招待コード（例: `GIRAFFE-K7XQ9P`）を知っている人だけが同じワークスペースに参加し、リアルタイムでノートを共同編集できます。

## 技術スタック

| 役割 | 技術 |
| --- | --- |
| フレームワーク | Next.js 14（App Router、静的エクスポート） |
| デプロイ | Netlify |
| DB / リアルタイム同期 | Firebase Firestore |
| プレゼンス（オンライン人数） | Firebase Realtime Database |

## セットアップ

### 1. Firebase プロジェクトを作成

1. [console.firebase.google.com](https://console.firebase.google.com) でプロジェクトを作成
2. **Firestore Database** を作成（本番環境モード）
3. **Realtime Database** を作成
4. 「プロジェクトの設定」→「全般」→「マイアプリ」でウェブアプリを追加し、設定値をコピー
5. Firestore の「ルール」タブに `firestore.rules` の内容を貼り付けて公開
6. Realtime Database の「ルール」タブに `database.rules.json` の内容を貼り付けて公開

### 2. 環境変数を設定

```bash
cp .env.local.example .env.local
# .env.local に Firebase の設定値を記入
```

### 3. ローカルで確認

```bash
npm install
npm run dev
# http://localhost:3000
```

### 4. Netlify にデプロイ

1. GitHub にリポジトリを push し、Netlify で接続
2. 「Site settings」→「Environment variables」に `.env.local` の内容をすべて追加
3. ビルドコマンド: `npm run build` / 公開ディレクトリ: `out`（`netlify.toml` に設定済み）

> ワークスペースのコード（`/workspace/GIRAFFE-K7XQ9P` のようなURL）は静的ビルド時には存在しないため、`netlify.toml` の redirect ルールで `/workspace/*` を同じビルド済みページに書き換え、実際のコードはブラウザ側で URL から読み取っています。直接開いても正しく動作します。

## 環境変数一覧

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`（任意、App Check用）
- `NEXT_PUBLIC_SITE_URL`（OGP画像・サイトマップの絶対URL生成に使用。本番ドメインが決まったら必ず設定してビルドし直す）

## OGP / メタタグ

- `app/layout.jsx` にタイトル・description・OGP・Twitter Card・robots を設定済み
- `app/opengraph-image.jsx` / `app/twitter-image.jsx` — `next/og` の `ImageResponse` でビルド時に1200×630のバナー画像を生成（`lib/brandImage.jsx` がデザイン、`assets/fonts/NotoSansJP-subset.otf` が日本語テキスト描画用のサブセットフォント）
- `app/icon.jsx`（32×32favicon）/ `app/apple-icon.jsx`（180×180 Apple touch icon）も同様にビルド時生成
- `app/robots.js` — ワークスペース配下（`/workspace/`）はプライベートなユーザーデータのためクロール禁止、トップページのみ許可
- `app/sitemap.js` — 公開ページ（トップページ）のみ掲載
- `app/workspace/[code]/page.jsx` に `robots: { index: false, follow: false }` を個別設定し、サイト全体のデフォルト（index許可）を上書き

**バナー画像の日本語コピーを変更する場合**は、`assets/fonts/NotoSansJP-subset.otf` に必要な文字のグリフが含まれていないと文字化け（トーフ）します。`lib/loadFont.js` のコメントにある `fonttools` コマンドで文字を追加してサブセットを作り直してください。

## 機能

- ノートの作成・編集・削除
- タイトル・本文のリアルタイム検索
- ピン留め（重要ノートを上部固定）
- 自動保存（入力停止から約0.6秒後）
- 招待コード方式の共同編集
- オンライン人数の表示
- ワークスペースからの退出

## 共同編集の仕組み

1. ワークスペース作成時にランダムなコード（例: `GIRAFFE-K7XQ9P`）を生成し `workspaces/{code}` に記録
2. URL は `/workspace/GIRAFFE-K7XQ9P/` の形式
3. ノートは `workspaces/{code}/notes/{noteId}` に保存
4. Firestore の `onSnapshot` でリアルタイム同期（他のユーザーの変更が即時反映）
5. Firebase Realtime Database の `presence/{code}/{sessionId}` でオンライン人数を管理
6. 切断時は `onDisconnect` により自動的にプレゼンスが削除される

## 利用規約

`/terms` に利用規約ページを実装済みです（`app/terms/content.js` が条文データ、`app/terms/page.jsx` が表示コンポーネント）。

**公開前に必ず対応してください:**

1. `app/terms/content.js` の `termsOperatorName`（運営者名）・`termsContact`（連絡先）・`termsJurisdiction`（管轄裁判所）・`termsEffectiveDate`（制定日）のプレースホルダーを実際の内容に書き換える
2. **弁護士等の専門家によるレビューを受ける** — この下書きは一般的なテンプレートであり、法的助言ではありません。特に第3条（招待コードのみでワークスペースにアクセスできる、認証なしの設計）は一般的なSaaSの規約とは前提が異なるため、この免責が有効に機能するか確認してもらうことを強く推奨します
3. プライバシーポリシーも別途用意し、本規約と整合させる（本サービスはFirebaseにデータを保存するため、データの保存場所・第三者提供の有無等を明記する必要があります）

## セキュリティについて

このアプリは Firebase Auth を使わず、招待コードを知っていることだけが参加条件です。`firestore.rules` はデータ形式のバリデーションのみ行い、「コードを知っているかどうか」自体は検証できません（コード自体がドキュメントパスのため）。コードは合言葉として扱い、共有先には注意してください。

## パブリックリリース前に

招待コード方式は「コードの推測しにくさ」がセキュリティの要です。このプロジェクトでは以下を実施済みです:

- **コードの高エントロピー化**: `WORD-` + ランダム6文字（`0/O/1/I/L` を除いた32種の文字）で、1単語あたり約107億通り。総当たりでの推測を現実的でないレベルまで引き上げています（`lib/workspaceCode.js` 参照）
- **参加試行のクライアント側バックオフ**: `/`（トップページ）で存在しないコードへの参加を3回失敗すると、指数関数的に待機時間が増えます（`app/page.jsx` の `handleJoin`）。ただしこれはブラウザタブ内だけの抑止で、スクリプトによる総当たりへの根本対策ではありません
- **Firebase App Check の組み込み口**: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` を設定すると reCAPTCHA v3 による App Check が有効になり、ブラウザ以外からの機械的リクエストを Firebase 側で拒否できます

公開前に必ず対応すべきこと:

1. Firebase Console の **App Check** で reCAPTCHA v3 を登録し、`.env.local` / Netlify の環境変数に `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` を設定してから、Firestore と Realtime Database の App Check enforcement を有効化する
2. Firebase を **Blaze プラン**（従量課金）に切り替え、予算アラートを設定する（Spark プランの上限は公開トラフィックには不十分）
3. 利用規約・プライバシーポリシーで「コードを知っていれば誰でも読み書きできる」設計を明示する
4. Firestore の定期エクスポート（バックアップ）を設定する

## 今後の拡張アイデア

- ユーザー認証（Firebase Auth）
- フォルダ / タグ機能
- マークダウンプレビュー
- ノートの共有リンク（読み取り専用）
- 画像の添付
- 変更履歴 / バージョン管理
