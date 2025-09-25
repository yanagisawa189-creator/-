# Claude Code Session History

## Session Summary
- 初回セッション: 2025-08-21
- 現在のセッション: 2025-09-25
- 主要プロジェクト: 営業リスト生成エージェント、Todoリストアプリ、営業リスト管理ツール

## プロジェクト履歴

### 2025-08-21 セッション
1. ユーザーがこれまでの履歴をCLAUDE.mdに記憶するよう依頼
2. CLAUDE.mdファイルを作成し、セッション履歴を記録
3. ユーザーがClaudeTodoリストアプリの作成を依頼
4. シンプルなTodoリストアプリ（todo-app.html）を作成
5. ユーザーがGitHubに保管することを依頼
6. GitHubリポジトリ（https://github.com/yanagisawa189-creator/-.git）にプッシュ完了

### 2025-09-25 セッション（現在）
1. 営業リスト生成エージェントの復活を依頼
2. sales-lead-generator フォルダ内のWebアプリケーションを発見
3. 営業リスト生成エージェントのWebアプリを http://localhost:5000 で起動
4. 4つの主要機能の確認：
   - デモ実行（APIキー不要）
   - 実際の検索（API設定後）
   - 結果分析（優先度別可視化）
   - データ出力（CSV形式エクスポート）
5. sales-list-manager.html（営業リスト管理ツール）も利用可能

## 現在利用可能なツール・システム

### 営業リスト生成エージェント
- **場所**: `C:\ts\sales-lead-generator\`
- **アクセス**: http://localhost:5000
- **機能**:
  - AI検索（Google Custom Search/SerpAPI）
  - Claude APIによる企業情報抽出
  - スコアリング機能
  - CRM連携（HubSpot/Salesforce/Zoho）
  - CSV/Excel/SQLite出力

### 営業リスト管理ツール
- **場所**: `C:\ts\sales-list-manager.html`
- **機能**:
  - 企業情報管理
  - ステータス・優先度管理
  - 検索・フィルター機能
  - 統計表示
  - データエクスポート/インポート

### Todoリストアプリ
- **場所**: `C:\ts\todo-app.html`
- **機能**: シンプルなタスク管理

## プロジェクト設定
- 作業ディレクトリ: C:\ts
- Git リポジトリ: 初期コミット済み
- プラットフォーム: Windows (win32)
- 現在のブランチ: master

## 技術スタック
- **フロントエンド**: HTML, CSS, JavaScript
- **バックエンド**: Python Flask (営業リスト生成エージェント)
- **AI**: Anthropic Claude API
- **検索**: Google Custom Search API, SerpAPI
- **スクレイピング**: Playwright, requests
- **データ**: SQLite, CSV, Excel出力
- **CRM**: HubSpot/Salesforce/Zoho API連携