Version 4.79.1 hotfix
- v4.79で欠落した主要UI関数をv4.69の正常系から復元
- 全ボタンが反応しなくなる不具合を修正
- v4.79の図鑑豆知識UIと開発者BLACK HISTORYテストを維持

Bean Growth Version 4.79
========================

v4.70〜v4.79 一括アップデート

v4.70 開発者モード称号テスト修正
- 開発者モードの成功/失敗にもテスト履歴を保持
- 3連続失敗でBLACK HISTORY称号をテスト表示
- 本番の称号所持・本番データには影響しない

v4.71 図鑑詳細テンプレート簡素化
- 「読み方」「スケール」「基本情報」など反復カードを廃止
- 詳細は原則「豆知識1個 + Bean Growthの現在地」に集約

v4.72〜v4.75 図鑑376項目を一発豆知識型へ移行
- 全376項目に funFact を付与
- 既存の固有trivia/factsを優先して1個だけ選定
- 固有情報が不足する基準・宇宙・天体サイズ等は数値比較から固有の一言を生成
- 生物27項目は対象固有の豆知識を補強

v4.76 図鑑解放演出強化
- 新しい図鑑項目を解放した際、最新項目の豆知識を成功演出に表示

v4.77 PERSONAL ANALYTICS仕上げ
- v4.69の曜日・日付・カテゴリ分析を継続利用
- 記録件数を母数として読める構成を維持

v4.78 GLOBAL ANALYTICS仕上げ
- 参加人数 / 記録件数 / リセット件数を明記する仕様を維持
- 少人数時の「参考値」表示を維持

v4.79 回帰テスト向け更新
- schemaVersion 12 / dataRevision 7
- Web / www / Android同期方式はv4.69を継承
- Firebaseクラウド同期・遡り記録・12禁欲・深刻度設定を維持

導入
----
ZIP内のファイルをプロジェクト直下へ上書きし、wwwフォルダは手作業でコピーしないでください。
その後、プロジェクト直下で:

  ./sync-web.command

を実行すると、ルートの最新版が既存wwwへコピーされ、Androidにも同期されます。


--- v4.69以前の履歴 ---
Bean Growth Version 4.69
========================

v4.60〜v4.69 一括アップデート

v4.60 www / Android同期自動化
- ZIPには www フォルダを含めない方式へ変更（重複www事故を防止）
- sync-web.command を追加
- ルートの index.html / style.css / script.js / milestones.js / firebase-init.js を既存wwwへ上書き
- 続けて npx cap sync android を自動実行

v4.61 遡り記録UI完成
- 今日：通常編集
- 昨日：通常編集
- 一昨日：リワード広告で編集解放
- 3日前以前：編集不可
- 一昨日は広告1回で「その日全体（12カテゴリ）」を編集解放
- 広告SDK未接続時は開発用テスト解放

v4.62 遡り変更後の再計算を厳密化
- 履歴を日付順に再生して高さを再計算
- 成功ストリークは未記録日で切断
- 連続失敗は未記録日ではリセットしない
- 金土日ボーナス・日付イベント・Moon処理を再計算
- resetOccurredを履歴へ保持し分析精度を向上

v4.63 PERSONAL ANALYTICS強化
- 曜日別：成功 / 失敗 / 未記録 / 記録率 / 失敗率 / リセット
- 月内日付別：何日に失敗が多いか
- 12カテゴリ比較：失敗率 / リセット / 今月記録率
- 母数の少ない日付は表示を抑制

v4.64 GLOBAL ANALYTICSデータ構造
- analyticsContributions コレクションを追加
- 生の成功日・失敗日は公開しない
- 曜日別 / 月内日付別 / カテゴリ別の匿名集計値だけを保存
- Firestoreルールで本人のみ自分の集計を書込可
- 認証済みプレイヤーは匿名集計を読取可

v4.65 GLOBAL ANALYTICS Beta
- 全プレイヤーの匿名集計からクライアント側で分析
- 参加ユーザー数 / 記録件数 / リセット件数を必ず表示
- 30人未満は「参考値」を明記
- 失敗率が高い曜日 / リセット最多曜日 / 月内日 / カテゴリを表示
- v5系ではサーバー集計へ移行予定

v4.66 高さ図鑑詳細を再刷新
- 「同じ説明の羅列」をさらに削減
- 各項目名・カテゴリ・場所を使った固有導入
- 身長 / ドア / 車 / バス / 25mプール / 東京タワー等との数値比較
- 共通テンプレのfactsを除外し、固有facts/triviaを優先
- 山は標高比較として独立構成

v4.67 クラウド競合対策
- contentHashとlastSyncHashで同期基準を保持
- 端末だけ変更 / クラウドだけ変更 / 両方変更（競合）を区別
- 競合時は自動上書きを禁止
- 手動保存・復元時に警告して利用者が選択

v4.68 自動クラウド保存安定化
- saveDataイベントを検知してデバウンス自動保存
- 通常時の定期チェックは60秒
- オフライン中はpendingとして保持
- オンライン復帰後に自動同期を再試行
- クラウド側が新しい/競合中は自動保存を保留

v4.69 Android / Firebase診断
- 設定 > クラウド保存・同期 > Android / Firebase診断
- 実行環境 Web / Android Web / Android Capacitor を表示
- Firebase Authentication確認
- Firestore READ / WRITE往復テスト
- Android実機で同期経路を確認しやすくした
- schemaVersion 11 / dataRevision 6

重要: Firestoreルール更新
---------------------------
GLOBAL ANALYTICSを使用するため firestore.rules が更新されています。
プロジェクト直下で以下のどちらかを実行してください。

  firebase deploy --only firestore:rules,firestore:indexes

または

  ./deploy-firestore.command

www の更新方法
---------------
今後は www フォルダを手動でコピーしないでください。
プロジェクト直下の最新版を置き換えた後、以下を実行します。

  ./sync-web.command

これで既存wwwへ上書きし、その後AndroidへCapacitor同期します。

導入手順
--------
1. このZIPを別フォルダへ解凍
2. bean-growth-game直下へ次のファイルを上書き
   index.html
   script.js
   style.css
   milestones.js
   firebase-init.js
   README.txt
   firestore.rules
   firestore.indexes.json
3. tools フォルダ、sync-web.command、deploy-firestore.command、ANDROID_FIREBASE_TEST.txt を追加
4. www はコピーしない
5. ./sync-web.command を実行
6. ./deploy-firestore.command を実行（GLOBAL ANALYTICS用ルール更新）
7. Live Serverで Version 4.69 を確認

既存データ
----------
- localStorageキー beanGrowthGame_v1 は維持
- 既存12カテゴリ・深刻度・称号・図鑑・クラウドデータを継承
- schemaVersion 11へ自動マイグレーション

広告について
------------
- 実際のリワード広告SDK（AdMob）はまだ未接続
- 一昨日の編集は現在、開発用確認ダイアログでテスト解放
- AdMob導入後は window.BeanGrowthAds.showRewardedRecordEdit を実広告へ接続予定

GLOBAL ANALYTICSについて
------------------------
- v4.69はBeta実装
- raw history（具体的な成功日/失敗日）はanalyticsContributionsへ保存しない
- 集計カウントのみ共有
- プレイヤー数が増えた段階でv5系のサーバー集計へ移行する
