Bean Growth Version 4.83

【v4.80〜v4.83 一括更新】

v4.80 安定化
- v4.79.1 Hotfixを正常系の土台として継続
- schemaVersion 13 / dataRevision 9へ更新
- 既存の12禁欲・遡り記録・図鑑・分析・Firebase同期を維持

v4.81 Firebase / Android診断
- 既存のAuthentication / Firestore READ・WRITE診断を維持
- 現在端末をFirebase配下の devices コレクションへ登録
- Web / Androidの実行環境と最終確認時刻を端末一覧へ表示

v4.82 アカウント基盤
- Player IDを自動発行（BG-XXXX-XXXX）
- Player IDは変更不可
- ニックネームは1〜20文字で変更可能
- Firebase匿名ユーザーの状態をアカウント画面へ表示
- 将来の「ゲスト → Google連携 → Web/Android複数端末利用」に対応できるデータ構造を追加
- Google OAuthそのものはまだ接続しない。次フェーズで匿名UIDを維持した連携を実装予定

v4.83 同期競合UI
- 端末とクラウドの両方に変更がある場合、自動上書きしない
- 端末 / クラウドを比較する専用画面を追加
- Player ID、ニックネーム、最終変更、合計高さ、記録件数、最高連続、データ版を比較
- 「この端末を使う」「クラウドを使う」「あとで決める」を選択可能
- クラウド復元前の端末データは従来どおり安全用コピーへ退避

【更新方法】
1. ZIPを展開
2. 中のファイルを bean-growth-game のプロジェクト直下へ上書き
3. www フォルダを手動コピーしない
4. ターミナルで ./sync-web.command
5. Web版はLive Serverで確認
6. Wi-Fi環境が戻ったらAndroid Studioから実機へ再インストール
