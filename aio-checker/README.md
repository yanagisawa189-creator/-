# AIO表示チェックツール v0.1

Google検索結果のAI Overviews（AIO）表示監視ツール。自社ドメインがAIOの参照に含まれているかをキーワード単位で継続監視します。

## 機能

- ✅ Google検索のAI Overviews表示チェック
- ✅ AIO参照ソースの抽出
- ✅ 自社ドメインの参照有無判定
- ✅ 検索順位（1-100位）の取得
- ✅ 指数バックオフによるリトライ機能
- ✅ 詳細ログとデバッグ機能
- ✅ JSON形式での結果保存
- ✅ TypeScript完全対応

## セットアップ

### 1. 依存関係のインストール
```bash
cd aio-checker
npm install
```

### 2. 環境変数の設定
`.env`ファイルを作成し、SerpAPIキーを設定：

```env
# SerpAPI Configuration
SERPAPI_API_KEY=your_actual_serpapi_key_here

# Target domains for checking (comma-separated)
TARGET_DOMAINS=your-domain.com,another-domain.com

# Output settings
OUTPUT_DIR=./results
SCREENSHOT_DIR=./screenshots

# Debug
DEBUG=true
```

### 3. ビルド
```bash
npm run build
```

## 使用方法

### テストコマンド（最小E2E）
```bash
npm run dev -- test
```

### 単一キーワードチェック
```bash
# 基本的な使用方法
npx tsx src/index.ts check -k "検索キーワード"

# 詳細オプション付き
npx tsx src/index.ts check \
  -k "エクサージュ海岸 小顔エステ" \
  -l ja \
  -d mobile \
  --location-type city \
  --location-value "Tokyo" \
  --target-domains "own.jp,competitor.com" \
  --output result.json
```

### コマンドオプション

#### `check` コマンド
- `-k, --keyword <keyword>`: 検索キーワード（必須）
- `-l, --lang <lang>`: 言語 (ja, en など) [デフォルト: ja]
- `-d, --device <device>`: デバイス (desktop, mobile) [デフォルト: desktop]
- `--location-type <type>`: 地域タイプ (country, city など) [デフォルト: country]
- `--location-value <value>`: 地域値 [デフォルト: Japan]
- `--target-domains <domains>`: 監視対象ドメイン（カンマ区切り）
- `--output <file>`: 出力ファイルパス（任意）

## 結果フォーマット

```json
{
  "runAt": "2025-09-26T00:15:00+09:00",
  "engine": "google",
  "device": "mobile",
  "lang": "ja",
  "location": {"type": "city", "value": "Tokyo"},
  "keyword": "検索キーワード",
  "aio": {
    "present": true,
    "sources": [
      {"url": "https://example.com/post1", "domain": "example.com"}
    ],
    "ownCited": true,
    "ownUrls": ["https://own.jp/blog/aio"]
  },
  "serp": {
    "rank": 3,
    "top100": [
      {"rank": 1, "domain": "own.jp", "url": "https://own.jp/"}
    ]
  },
  "status": "ok"
}
```

## エラーハンドリング

- **指数バックオフ**: HTTP 5xxエラー時、最大3回のリトライ
- **タイムアウト**: 20秒でタイムアウト
- **ログレベル**: INFO/WARN/ERROR/DEBUG対応

## 次のステップ

1. **有効なSerpAPIキーの取得**: https://serpapi.com/
2. **監視対象キーワードの設定**: Googleスプレッドシート連携
3. **日次バッチ処理の実装**: クラウド環境での定期実行
4. **ダッシュボード作成**: 結果の可視化
5. **アラート機能**: Slack/メール通知

## 技術スタック

- **TypeScript**: 型安全性とメンテナンス性
- **Node.js**: ランタイム環境
- **SerpAPI**: Google検索結果API
- **Commander.js**: CLI インターフェース
- **dotenv**: 環境変数管理

## ライセンス

MIT License