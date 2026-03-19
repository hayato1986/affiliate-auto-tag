# 手動テストチェックリスト

## 基本動作
- [ ] `amazon.co.jp/dp/B08N5WRWNW` → tag付与
- [ ] `amazon.co.jp/s?k=keyboard` → tag付与
- [ ] `amazon.co.jp/gp/product/B08N5WRWNW` → tag付与
- [ ] `amazon.co.jp` トップページ → tag付与
- [ ] `amazon.co.jp/s?k=キーボード` → tag付与 + 日本語保持

## ループ防止
- [ ] tag=正しいID のURL → DevTools Networkでリダイレクトなし確認
- [ ] tag=wrong-id → 上書きしない（仕様）
- [ ] タブ2回リロード → 無限ループなし

## トグル
- [ ] グローバルOFF → tag付与されない
- [ ] グローバルON → tag付与再開
- [ ] 設定変更 → 新規タブで即時反映

## Service Worker
- [ ] 設定変更 → 30秒以上待機 → 再設定変更 → ルール正常更新
- [ ] Chrome再起動後 → 設定とルールが復元

## 競合
- [ ] uBlock Origin有効状態で動作確認

## UI
- [ ] ポップアップ: 未設定状態で「初期設定が必要です」表示
- [ ] ポップアップ: 設定済みでトグルと現在タブ状態表示
- [ ] ポップアップ: グローバルOFF時に無効状態表示
- [ ] オプション: ID入力で3段階バリデーション
- [ ] オプション: 全角入力が半角に変換される
- [ ] オプション: 自動保存 + フィードバック表示
- [ ] ダークモード: 自動切替

## セキュリティ
- [ ] manifest.json の permissions/host_permissions が最小限
- [ ] popup/optionsで `innerHTML` が使われていないことをコードレビュー
