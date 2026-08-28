Bean Growth v5.0

ONLINE START

1. Web版Googleログイン / 連携
- ゲスト（匿名）からGoogleアカウントへ linkWithPopup で連携
- すでに別端末で使っているGoogleアカウントの場合は、そのGoogleユーザーへログイン
- Googleのメールアドレスは公開プロフィールに含めない
- Androidアプリ内のネイティブGoogleログインは次段階（Web版を先行）

2. オンライン画面
- ホームに「オンライン」を追加
- オンライン認証状態
- 公開プロフィール更新
- 月間ランキングデータ送信
- Player ID検索
- 今月ランキングβ（上位50）

3. 公開プロフィール
- publicProfiles/{playerId}
- 公開許可された項目だけを送信
- Firebase UID / Googleメール / 詳細履歴 / 端末情報は非公開
- privateな users/{uid}/publicIdentity/main で所有Player IDを確認

4. 月間ランキングβ
- rankingBoards/{YYYY-MM}/players/{playerId}
- Player ID / nickname / monthHeight / records / success / failure / resets / fingerprint
- Firebase UIDは公開ランキング文書に保存しない
- Firestore Rulesで自分のPlayer ID以外には書けない
- v5.0時点ではクライアント計算値のβ版
- 完全な不正対策（サーバー側履歴再計算）は次段階

5. データ
- schemaVersion 17
- dataRevision 26

重要:
Googleログインを使うにはFirebase Console > Authentication > Sign-in methodでGoogleを有効化してください。
Firestoreのオンラインプロフィール/ランキングを使う前に新しいfirestore.rulesをdeployしてください。
