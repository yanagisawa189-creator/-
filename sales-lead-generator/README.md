# 営業リスト自動生成エージェント

## 概要

営業リスト自動生成エージェントは、業種・エリア・条件のキーワードから営業見込み先を自動的に検索・収集・分析するPythonアプリケーションです。

## 主な機能

### 🔍 検索フェーズ
- Google Custom Search API / SerpAPI を使用した候補URL一覧の取得
- 業種・エリア・追加キーワードに基づく効果的な検索クエリ生成

### 📊 取得・抽出フェーズ
- requests/httpx + Playwright による高度なウェブスクレイピング
- JavaScript必須サイト対応
- Claude APIによるAI企業情報抽出（JSON形式）

### 💡 情報補完フェーズ
- ドメインからの推定メール生成（info@, contact@, inquiry@等）
- 会社概要、採用、問い合わせページの追加クロール
- LinkedIn等の情報補完（合法手段のみ）

### 🎯 スコアリング・優先度付け
- 業種一致度(0-5) + 事業規模推定(0-3) + 直通問い合わせ有無(0-2) + エリア一致(0-3)
- 詳細なスコア分析とレポート生成

### 📤 出力・連携フェーズ
- CSV/Excel/SQLite形式での出力
- HubSpot / Salesforce / Zoho CRM API連携
- 重複チェック機能

## インストール

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd sales-lead-generator
```

### 2. 依存関係のインストール
```bash
pip install -r requirements.txt
```

### 3. Playwrightブラウザのインストール
```bash
playwright install chromium
```

### 4. 環境変数の設定
`.env.example`をコピーして`.env`を作成し、必要なAPIキーを設定してください：

```bash
cp .env.example .env
```

#### 必要なAPIキー
- **Anthropic Claude API**: 企業情報の抽出に必要
- **Google Custom Search API** または **SerpAPI**: ウェブ検索に必要
- **CRM API キー** (オプション): HubSpot, Salesforce, Zoho連携用

## 使用方法

### コマンドライン実行

```bash
python src/main.py --industry "IT" --location "東京都" --keywords "システム開発" "WEB制作"
```

#### オプション
- `--industry, -i`: 対象業種（必須）
- `--location, -l`: 対象エリア（必須）
- `--keywords, -k`: 追加キーワード（複数指定可能）
- `--max-results, -m`: 最大結果数（デフォルト: 50）
- `--export, -e`: エクスポート形式（csv, excel, sqlite, all）
- `--sync-crm`: CRMに同期するかどうか
- `--verbose, -v`: 詳細ログの表示

### 実行例

```bash
# 基本的な使用例
python src/main.py -i "飲食業" -l "大阪府" -k "レストラン" "カフェ"

# 全形式でエクスポート + CRM同期
python src/main.py -i "製造業" -l "愛知県" -e all --sync-crm

# 最大100件取得
python src/main.py -i "小売業" -l "福岡県" -m 100 -v
```

## 設定

### config/config.py
アプリケーションの動作を詳細に設定できます：

```python
# スコアリングの重み設定
industry_match_weight: float = 5.0
business_size_weight: float = 3.0
contact_info_weight: float = 2.0
location_match_weight: float = 3.0

# スクレイピング設定
max_concurrent_requests: int = 5
request_timeout: int = 30
respect_robots_txt: bool = True
```

## 出力形式

### CSV出力
企業の基本情報とスコアを含むCSVファイル

### Excel出力
- **Sales Leads**: 全リードデータ
- **High Priority**: 高優先度リード（スコア8.0以上）
- **Statistics**: 統計情報

### SQLite出力
- `sales_leads`: リードデータテーブル
- `export_stats`: 実行統計テーブル

## CRM連携

### HubSpot
企業データの自動作成・更新（重複チェック付き）

### Salesforce
リードデータの自動作成

### Zoho CRM
リードデータの自動作成

## 法務・コンプライアンス

- 各サイトの利用規約・robots.txtを遵守
- 個人情報の適切な取り扱い
- レート制限の厳守
- LinkedIn等のスクレイピングは公式API/CSV等の合法手段のみ

## プロジェクト構造

```
sales-lead-generator/
├── src/
│   ├── main.py              # メインエントリーポイント
│   ├── models.py            # データモデル定義
│   ├── search_engine.py     # 検索エンジン実装
│   ├── scraper.py           # ウェブスクレイピング
│   ├── claude_extractor.py  # Claude API連携
│   ├── data_enhancer.py     # データ拡張処理
│   ├── scorer.py            # スコアリング機能
│   ├── exporters.py         # データ出力機能
│   └── crm_integrations.py  # CRM連携機能
├── config/
│   └── config.py            # 設定管理
├── tests/                   # テストファイル
├── data/                    # データファイル
├── output/                  # 出力ファイル
├── requirements.txt         # 依存関係
├── .env.example            # 環境変数テンプレート
└── README.md               # このファイル
```

## トラブルシューティング

### よくある問題

1. **APIキー不足エラー**
   - `.env`ファイルに正しいAPIキーが設定されているか確認

2. **Playwright関連エラー**
   - `playwright install chromium`を実行

3. **検索結果が少ない**
   - 検索キーワードを調整
   - `max_results`を増加

4. **CRM同期エラー**
   - CRM APIキーと権限を確認
   - レート制限に注意

## ライセンス

MIT License

## 貢献

プルリクエストや issue の報告を歓迎します。

## サポート

問題が発生した場合は、ログファイル `sales_lead_generator.log` を確認し、GitHub Issues で報告してください。