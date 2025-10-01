# AIO Checker Pro

**プロフェッショナル版AI Overviews監視システム**

顧客企業のWebサイトが ChatGPT、Claude、Gemini、Google AI Overviews で引用されているかを監視し、エビデンス（スクリーンショット）付きでレポートを生成する SaaS サービスです。

## 🎯 主な機能

### 1. マルチLLM対応
- ✅ **ChatGPT (OpenAI)** - GPT-4 Turbo
- ✅ **Claude (Anthropic)** - Claude 3.5 Sonnet
- ✅ **Gemini (Google AI)** - Gemini Pro
- ✅ **Google AI Overviews** - 検索結果のAI要約

### 2. スクリーンショット証跡機能
- 引用が表示されている実際の画面をキャプチャ
- エビデンスとしてPDFレポートに自動添付
- 時系列での比較が可能

### 3. 顧客認証システム
- JWT認証によるセキュアなアクセス
- 顧客ごとのデータ分離
- 企業単位での管理

### 4. 自動チェック＆通知
- 定期実行スケジューラー（日次/週次/月次）
- 新規引用検出時のメール通知
- 引用消失時の即時アラート
- 順位変動通知

### 5. PDFレポート自動生成
- 週次/月次レポートの自動作成
- グラフ・チャート付き
- スクリーンショット添付
- 推奨アクション提示

### 6. 200社対応の企業管理
- 企業別キーワード登録
- 業種別分類
- CSV一括インポート
- GA4連携対応

## 🚀 セットアップ手順

### 1. 必要な環境

```bash
Node.js 18.x 以上
PostgreSQL 14.x 以上
```

### 2. データベースセットアップ

```bash
# PostgreSQLにログイン
psql -U postgres

# データベース作成
CREATE DATABASE aio_checker;

# テーブル作成
cd aio-checker-pro
npm run init-db
```

### 3. 環境変数設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

以下の値を設定：

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aio_checker
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret（ランダムな文字列を生成）
JWT_SECRET=your_random_secret_key_here

# API Keys
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key
SERPAPI_KEY=your-serpapi-key

# Email（Gmail推奨）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 4. 依存関係インストール

```bash
npm install
```

### 5. サーバー起動

```bash
# 開発環境
npm run dev

# 本番環境
npm start
```

サーバーは http://localhost:3000 で起動します。

## 📡 API エンドポイント

### 認証

```
POST /api/auth/register  - ユーザー登録
POST /api/auth/login     - ログイン
```

### 企業管理

```
GET    /api/companies                      - 企業一覧取得
POST   /api/companies                      - 企業追加
POST   /api/companies/:id/keywords         - キーワード追加
```

### AIOチェック

```
POST   /api/check/run                      - チェック実行
GET    /api/check/results                  - 結果取得
```

### レポート

```
POST   /api/reports/weekly                 - 週次レポート生成
```

### スケジュール

```
POST   /api/schedules                      - 定期実行設定
```

## 🔄 定期実行スケジュール

- **毎日午前6時**: 日次チェック実行
- **毎週月曜午前7時**: 週次レポート生成・メール送信

## 📊 使用例

### 1. ユーザー登録

```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'customer@example.com',
        password: 'secure_password',
        company_name: '株式会社サンプル',
        plan: 'premium'
    })
});

const { user, token } = await response.json();
```

### 2. 企業追加

```javascript
const response = await fetch('http://localhost:3000/api/companies', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        name: 'クライアント企業A',
        domain: 'https://client-a.com',
        industry: 'IT',
        manager: '田中太郎',
        memo: 'SaaS企業'
    })
});
```

### 3. AIOチェック実行

```javascript
const response = await fetch('http://localhost:3000/api/check/run', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        companyId: 1,
        keywords: ['クラウド会計ソフト', '経費精算システム']
    })
});

const { results } = await response.json();
// results に ChatGPT, Claude, Gemini, Google AIO の結果が含まれる
```

## 📸 スクリーンショット保存

チェック実行時、引用が検出された場合は自動的に以下に保存されます：

```
screenshots/
  ├── google_aio_keyword1_1234567890.png
  ├── google_aio_keyword2_1234567891.png
  └── ...
```

## 📄 PDFレポート

生成されたレポートは以下に保存されます：

```
reports/
  ├── weekly_report_company_a_1234567890.pdf
  ├── weekly_report_company_b_1234567891.pdf
  └── ...
```

レポート内容：
- サマリー統計
- LLM別検出状況
- キーワード別パフォーマンス
- 新規検出一覧
- スクリーンショット添付（最大5件）
- 推奨アクション

## 🔐 セキュリティ

- パスワードは bcrypt でハッシュ化
- JWT トークンによる API 認証
- 顧客データは完全分離
- SQL インジェクション対策済み

## 🚢 デプロイ

### Heroku

```bash
heroku create aio-checker-pro
heroku addons:create heroku-postgresql:standard-0
heroku config:set JWT_SECRET=your_secret
heroku config:set OPENAI_API_KEY=your_key
git push heroku master
```

### AWS / Docker

Dockerfile を提供予定

## 📈 料金プラン

- **Basic**: 月10,000円 / 10社まで
- **Standard**: 月30,000円 / 50社まで
- **Premium**: 月100,000円 / 200社まで
- **Enterprise**: カスタム見積もり

## 💡 今後の追加予定機能

- [ ] 競合他社モニタリング
- [ ] Slack通知連携
- [ ] Webhook対応
- [ ] ダッシュボードのリアルタイム更新
- [ ] モバイルアプリ
- [ ] APIレート制限機能
- [ ] 多言語対応

## 🤝 サポート

- ドキュメント: [docs/](./docs/)
- 問い合わせ: support@aiochecker.com

## 📝 ライセンス

Proprietary - All Rights Reserved

---

**Developed with ❤️ by AIO Checker Team**
