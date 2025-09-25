# Chatbot Project - Version 2.0

AI駆動の営業支援ツール群を含む包括的なチャットボットシステムです。

## 主要コンポーネント

### 🤖 営業リスト生成エージェント
- **場所**: `sales-lead-generator/`
- **アクセス**: http://localhost:5000
- **機能**:
  - AI検索エンジン（Google Custom Search/SerpAPI）
  - Claude APIによる企業情報抽出
  - 自動スコアリング機能
  - CRM連携（HubSpot/Salesforce/Zoho）
  - データ出力（CSV/Excel/SQLite）

### 📋 営業リスト管理ツール
- **ファイル**: `sales-list-manager.html`
- **機能**:
  - 企業情報管理
  - ステータス・優先度管理
  - 検索・フィルター機能
  - 統計表示・データエクスポート

### ✅ Todoリストアプリ
- **ファイル**: `todo-app.html`
- **機能**: シンプルなタスク管理

## 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript
- **バックエンド**: Python Flask
- **AI**: Anthropic Claude API
- **検索**: Google Custom Search API, SerpAPI
- **スクレイピング**: Playwright, requests
- **データ**: SQLite, CSV, Excel出力
- **CRM**: HubSpot/Salesforce/Zoho API連携

## インストール・実行

### 営業リスト生成エージェント
```bash
cd sales-lead-generator
pip install -r requirements.txt
python web/app.py
# http://localhost:5000 でアクセス
```

### 営業リスト管理ツール・Todoアプリ
ブラウザでHTMLファイルを直接開く：
- `sales-list-manager.html`
- `todo-app.html`

## バージョン履歴

### Version 2.0 (2025-09-25)
- 営業リスト生成エージェント追加
- 営業リスト管理ツール追加
- Claude API連携機能実装
- CRM連携機能追加
- READMEファイル更新

### Version 1.0 (2025-08-21)
- 初回リリース
- 基本的なTodoリストアプリ
- プロジェクト構造確立

## 開発履歴

詳細な開発履歴は `CLAUDE.md` を参照してください。

## ライセンス

MIT License

---
🤖 Generated with [Claude Code](https://claude.ai/code)