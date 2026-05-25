# 完全Push通知版セットアップ

## 何が変わった？
Netlify Functions + Netlify Blobs + Web Pushで、アプリを閉じていても通知できる構成にしました。

## 必要な環境変数
Netlifyの Site configuration → Environment variables に以下を追加してください。

- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT

VAPID_SUBJECT は例: mailto:your-email@example.com

## VAPIDキーの作り方
パソコンでこのフォルダを開いて:

```bash
npm install
npm run vapid
```

出てきた Public Key / Private Key をNetlifyの環境変数に入れます。

## デプロイ方法
ドラッグ&ドロップだけだとnpm依存がビルドされない場合があるので、GitHub連携かNetlify CLI推奨です。

```bash
npm install
netlify deploy --prod
```

## 使い方
1. デプロイ後、iPhoneのSafariで開く
2. ホーム画面に追加
3. ホーム画面アイコンから開く
4. 設定 → 「通知を許可・完全通知を登録」
5. 「完全通知の状態」が登録済み/同期済みになればOK

## 注意
Scheduled Functionは5分ごとに確認します。通知時刻ぴったりではなく、数分ずれる可能性があります。
