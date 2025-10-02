# AIO Checker Pro - セットアップガイド

## 🎯 目的

このガイドでは、AIO Checker Proを本番環境で稼働させるための詳細な手順を説明します。

## 📋 前提条件

### 必須アカウント

1. **OpenAI アカウント** (ChatGPT API用)
   - https://platform.openai.com/
   - クレジットカード登録必須
   - 従量課金: $0.01/1K tokens (GPT-4 Turbo)

2. **Anthropic アカウント** (Claude API用)
   - https://console.anthropic.com/
   - クレジットカード登録必須
   - 従量課金: $0.003/1K tokens

3. **Google AI アカウント** (Gemini API用)
   - https://makersuite.google.com/
   - 無料枠あり
   - 従量課金: $0.001/1K tokens

4. **PostgreSQL データベース**
   - ローカル or クラウド (Heroku Postgres, AWS RDS等)

5. **メールサーバー**
   - Gmail (推奨)
   - または SMTP対応メールサーバー

## ⚙️ ステップ1: API キーの取得

### OpenAI API キー取得

1. https://platform.openai.com/ にログイン
2. 左メニューから「API keys」をクリック
3. 「Create new secret key」をクリック
4. キーをコピーして保存（二度と表示されません）

### Anthropic API キー取得

1. https://console.anthropic.com/ にログイン
2. 「API Keys」セクションへ移動
3. 「Create Key」をクリック
4. キーをコピーして保存

### Google AI API キー取得

1. https://makersuite.google.com/ にアクセス
2. 「Get API key」をクリック
3. Google Cloudプロジェクトを作成
4. APIキーを生成してコピー

## 🗄️ ステップ2: データベースセットアップ

### ローカルPostgreSQLの場合

```bash
# PostgreSQLインストール（Windowsの場合）
# https://www.postgresql.org/download/windows/

# インストール後、コマンドプロンプトで：
psql -U postgres

# データベース作成
CREATE DATABASE aio_checker;
\q
```

### Heroku Postgresの場合

```bash
# Heroku CLIインストール
# https://devcenter.heroku.com/articles/heroku-cli

# ログイン
heroku login

# アプリ作成
heroku create aio-checker-pro

# PostgreSQL追加
heroku addons:create heroku-postgresql:standard-0

# 接続情報確認
heroku config:get DATABASE_URL
```

## 📧 ステップ3: Gmailアプリパスワード設定

1. Googleアカウントにログイン
2. セキュリティ設定へ移動
3. 「2段階認証プロセス」を有効化
4. 「アプリパスワード」を生成
   - アプリ: メール
   - デバイス: その他（カスタム名）
   - 名前: AIO Checker
5. 16桁のパスワードをコピー

## 🛠️ ステップ4: プロジェクトセットアップ

### リポジトリクローン

```bash
git clone https://github.com/your-org/aio-checker-pro.git
cd aio-checker-pro
```

### 依存関係インストール

```bash
npm install
```

### 環境変数設定

`.env` ファイルを作成：

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aio_checker
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Secret (ランダムな文字列を生成)
JWT_SECRET=your_random_32_character_secret_key_here

# API Keys
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxx

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-digit-app-password
SMTP_FROM=AIO Checker <noreply@aiochecker.com>

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=http://localhost:8080

# Storage
SCREENSHOT_PATH=./screenshots
REPORT_PATH=./reports
```

### データベース初期化

```bash
npm run init-db
```

成功すると以下のメッセージが表示されます：
```
✅ Database initialized successfully!
```

## 🚀 ステップ5: サーバー起動

### 開発環境

```bash
npm run dev
```

### 本番環境

```bash
npm start
```

サーバーが起動すると以下のメッセージが表示されます：

```
🚀 AIO Checker Pro API server running on port 3000
📊 Dashboard: http://localhost:8080
⏰ Scheduled checks: Enabled
```

## 🧪 ステップ6: 動作確認

### ヘルスチェック

```bash
curl http://localhost:3000/health
```

レスポンス：
```json
{
  "status": "ok",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### ユーザー登録テスト

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "company_name": "テスト株式会社",
    "plan": "basic"
  }'
```

### AIOチェックテスト

1. 上記でユーザー登録
2. 返ってきた `token` を使用
3. 企業を追加
4. チェックを実行

```bash
# 企業追加
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "テスト企業",
    "domain": "https://example.com",
    "industry": "IT"
  }'

# キーワード追加
curl -X POST http://localhost:3000/api/companies/1/keywords \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "keywords": ["AI", "機械学習"]
  }'

# チェック実行
curl -X POST http://localhost:3000/api/check/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyId": 1,
    "keywords": ["AI", "機械学習"]
  }'
```

## 📊 ステップ7: フロントエンド接続

フロントエンドHTMLファイルを編集して、APIエンドポイントを設定：

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 🌐 ステップ8: 本番デプロイ

### Heroku デプロイ

```bash
# Heroku アプリ作成
heroku create aio-checker-pro

# PostgreSQL追加
heroku addons:create heroku-postgresql:standard-0

# 環境変数設定
heroku config:set JWT_SECRET=your_secret
heroku config:set OPENAI_API_KEY=sk-xxxxx
heroku config:set ANTHROPIC_API_KEY=sk-ant-xxxxx
heroku config:set GOOGLE_AI_API_KEY=AIzaSyxxxxx
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASSWORD=your-app-password

# デプロイ
git push heroku master

# データベース初期化
heroku run npm run init-db
```

### AWS / VPS デプロイ

1. Ubuntu 22.04 サーバーを準備
2. Node.js 18.x をインストール
3. PostgreSQL 14 をインストール
4. Nginx をリバースプロキシとして設定
5. PM2 でプロセス管理

```bash
# PM2インストール
npm install -g pm2

# アプリ起動
pm2 start backend/server.js --name aio-checker

# 自動起動設定
pm2 startup
pm2 save
```

## 🔒 セキュリティ対策

### 1. ファイアウォール設定

```bash
# UFW設定（Ubuntu）
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSL証明書設定

```bash
# Certbot インストール
sudo apt install certbot python3-certbot-nginx

# SSL証明書取得
sudo certbot --nginx -d yourdomain.com
```

### 3. 環境変数の保護

- `.env` ファイルは `.gitignore` に追加
- 本番環境では環境変数を直接設定
- パスワードは定期的に変更

## 📈 モニタリング

### ログ確認

```bash
# PM2 ログ
pm2 logs aio-checker

# Heroku ログ
heroku logs --tail
```

### パフォーマンス監視

- New Relic
- Datadog
- CloudWatch (AWS)

## 🆘 トラブルシューティング

### データベース接続エラー

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解決方法:**
- PostgreSQLが起動しているか確認
- 接続情報（ホスト、ポート、ユーザー名、パスワード）を確認
- ファイアウォール設定を確認

### API キーエラー

```
Error: Invalid API key
```

**解決方法:**
- `.env` ファイルにAPIキーが正しく設定されているか確認
- APIキーの有効期限を確認
- APIキーの権限を確認

### スクリーンショットエラー

```
Error: Failed to launch browser
```

**解決方法:**
- Playwright のブラウザをインストール

```bash
npx playwright install chromium
```

## 📞 サポート

問題が解決しない場合：
- GitHub Issues: https://github.com/your-org/aio-checker-pro/issues
- メール: support@aiochecker.com
- ドキュメント: https://docs.aiochecker.com

---

**セットアップ完了おめでとうございます！🎉**
