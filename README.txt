Bean Growth v5.1.1 Hotfix

修正:
- Android Google連携時の `linkWithCredential is not defined` を修正。
- firebase-init.js の Firebase Authentication import に linkWithCredential を追加。
- Android Credential Manager / SHA設定 / google-services.json の構成はv5.1から変更なし。

更新手順:
1. ZIP内をプロジェクト直下へ上書き
2. ./sync-web.command
3. Android StudioでGradle Sync
4. Xiaomi XIG04へ ▶ Run
5. プロフィール → Googleと連携 / ログイン
