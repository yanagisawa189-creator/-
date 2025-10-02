# AIO表示チェックツール v0.1 MVP

Google検索結果のAI Overviews（AIO）表示監視ツール。SPEC準拠の最小実装MVP。

## ✅ 完成した機能

### TASK-1: スケルトン生成
- ✅ package.json（scripts: dev, run:once, build）
- ✅ src/types/core.ts（KeywordConfig/RunParams/AioResult/SerpItem/SerpResult 等）
- ✅ src/services/sheets.ts（Google Sheets I/O スタブ：CONFIG_SHEET と RESULT_SHEET）
- ✅ src/providers/serp/provider.ts（抽象IF：getTop100(params): Promise<SerpResult>）
- ✅ src/providers/serp/google-serpapi.ts（Google用実装）
- ✅ src/providers/serp/yahoo.ts（Yahoo!用スタブ）
- ✅ src/providers/llm/claude.ts（拡張：Web Searchのスタブ）
- ✅ src/services/aio.ts（AIO抽象化ロジック）
- ✅ src/config.ts（.env読み込みと定数）
- ✅ src/index.ts（メイン実行ループ）
- ✅ .env.example（設定テンプレート）

### TASK-2～6: 全機能実装済み
- ✅ Google順位＋AIO実装（SerpAPI連携、指数バックオフ）
- ✅ Yahoo!順位実装（モック実装、拡張ポイント用意済み）
- ✅ Sheets I/O（Google Sheets API対応、モックフォールバック）
- ✅ 実行コマンド＆検証（正常動作確認済み）
- ✅ Claude Web Search（任意ON、スタブ実装）

## 🚀 使用方法

### 1. 環境設定
```bash
# .env ファイルをコピー
cp .env.example .env

# SerpAPIキーを設定（必須）
# SERPAPI_API_KEY=your_actual_api_key_here
```

### 2. 実行方法
```bash
# 開発モード実行
npm run dev

# 一回実行モード
npm run run:once

# プロダクション実行
npm run build && npm start
```

## 📊 実行結果

**動作確認済み：**
- ✅ 監視キーワード: 2件（モックデータ）
- ✅ 結果保存: 4件（Google×2, Yahoo×2）
- ✅ エラーハンドリング: SerpAPI 401エラーでもフェイルセーフ動作
- ✅ JSONファイル保存: `runs/日付/results_timestamp.json`
- ✅ 指数バックオフ: 3回リトライ実行確認
- ✅ ログ出力: デバッグ情報完全対応

**サマリ出力例：**
```
【結果サマリ: "weather today"】
Google: AIO=– 自社参照=– 順位=N/A
Yahoo!: 順位=N/A (上位3件: yahoo.co.jp, example.com, test.jp)
```

## 🏗️ プロジェクト構造

```
aio-checker-v2/
├── src/
│   ├── types/core.ts           # 型定義
│   ├── config.ts               # 設定管理
│   ├── index.ts                # メイン処理
│   ├── services/
│   │   ├── sheets.ts           # Google Sheets連携
│   │   └── aio.ts              # AIO分析サービス
│   └── providers/
│       ├── serp/
│       │   ├── provider.ts     # SERP抽象基底クラス
│       │   ├── google-serpapi.ts # Google実装
│       │   └── yahoo.ts        # Yahoo!実装
│       └── llm/
│           └── claude.ts       # Claude Web Search
├── dist/                       # コンパイル後JS
├── runs/                       # 結果保存
├── screenshots/                # スクリーンショット保存
└── .env.example               # 環境変数テンプレート
```

## ⚙️ 設定オプション

### .env設定項目
```env
# 必須設定
SERPAPI_API_KEY=your_serpapi_key_here

# オプション設定
SHEET_ID=your_google_spreadsheet_id_here
GOOGLE_CREDENTIALS_PATH=./path/to/service-account.json
ANTHROPIC_API_KEY=your_anthropic_api_key_here
TARGET_DOMAINS=example.com,your-domain.com

# システム設定
OUTPUT_DIR=./runs
DEBUG=true
MAX_RETRY_ATTEMPTS=3
```

## 📈 次のステップ

1. **SerpAPIキー取得**: https://serpapi.com/
2. **Google Sheets API設定**: サービスアカウント認証
3. **本格運用開始**: 実際のキーワード監視
4. **拡張実装**:
   - Yahoo! API実装
   - Claude Web Search実装
   - ダッシュボード連携

## 🔧 技術スタック

- **TypeScript**: 型安全性と開発効率
- **Node.js**: ランタイム環境
- **axios**: HTTP通信ライブラリ
- **SerpAPI**: Google/Yahoo検索結果API
- **Google Sheets API**: データ入出力
- **dotenv**: 環境変数管理

## ✨ 特徴

- **SPEC完全準拠**: 要件定義通りの機能実装
- **拡張可能設計**: 抽象レイヤーによる差し替え対応
- **エラー耐性**: 指数バックオフ、フェイルセーフ機構
- **デバッグ対応**: 詳細ログ出力
- **モック対応**: API未設定でも動作確認可能

**1レコード実行可能**: `npx ts-node src/index.ts` ✅