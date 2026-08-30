Bean Growth v5.9

v5.2: 1 Googleアカウント = 1正式データ
- users/{uid}/canonical/main を正式データとして使用。
- localStorageは端末キャッシュ。

v5.3: 複数端末同期
- Firestore realtime listenerで別端末のRevisionを検出。
- ローカル未変更なら自動同期。
- 両方変更なら比較画面。

v5.4: データ復旧
- 正式データ更新前を5世代循環バックアップ。
- プロフィールから復元可能。

v5.5: Google管理
- Googleが唯一の認証手段なら連携解除不可。

v5.6: ランキング
- 総合 / LIGHT / NORMAL / HEAVY / 12禁欲別。
- 記録率を表示。

v5.7: 不正対策基盤
- Canonical Revision / content hash / integrity fingerprint。
- ランキングは client_checked。
- サーバー履歴再計算は未実装であることを明示。

v5.8: Player ID / 公開プロフィール
- 検索、公開情報のみ表示、通報。

v5.9: フレンド
- 申請、承認、拒否、一覧、閲覧、解除。

schemaVersion 20
dataRevision 36

必須:
firebase deploy --only firestore:rules,firestore:indexes
