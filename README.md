# ビジネスマッチングプラットフォーム

営業会社と決裁者をマッチングするB2Bプラットフォームです。

## 機能

### 営業会社向け機能
- 決裁者の検索・閲覧
- マッチング申請の送信
- 申請状況の確認
- 会社プロフィールの管理

### 決裁者向け機能
- 営業会社の検索・閲覧
- マッチング申請の受信・承認/拒否
- 申請状況の確認
- 個人プロフィールの管理

## 技術スタック

### バックエンド
- Node.js
- TypeScript
- Express.js
- PostgreSQL
- JWT認証
- bcryptjs（パスワードハッシュ化）

### フロントエンド
- React
- TypeScript
- React Router
- Axios
- Context API（状態管理）

## セットアップ

### 前提条件
- Node.js (v18以上)
- PostgreSQL
- npm または yarn

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd business-matching-platform
```

2. バックエンドの依存関係をインストール
```bash
npm install
```

3. フロントエンドの依存関係をインストール
```bash
cd frontend
npm install
cd ..
```

4. 環境変数を設定
```bash
cp .env.example .env
```

`.env`ファイルを編集して、以下の値を設定：
- `DB_HOST`: PostgreSQLホスト
- `DB_PORT`: PostgreSQLポート
- `DB_NAME`: データベース名
- `DB_USER`: データベースユーザー
- `DB_PASSWORD`: データベースパスワード
- `JWT_SECRET`: JWT署名用の秘密鍵

5. データベースセットアップ
PostgreSQLで新しいデータベースを作成し、アプリケーションを起動すると自動でテーブルが作成されます。

### 開発環境での実行

1. バックエンドサーバーを起動
```bash
npm run dev
```

2. 別のターミナルでフロントエンドを起動
```bash
cd frontend
npm start
```

- バックエンド: http://localhost:3000
- フロントエンド: http://localhost:3001

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `GET /api/auth/verify` - トークン検証

### ユーザープロフィール
- `POST /api/users/profile` - プロフィール作成
- `GET /api/users/profile` - プロフィール取得
- `PUT /api/users/profile` - プロフィール更新

### マッチング
- `GET /api/matching/search/decision-makers` - 決裁者検索（営業会社用）
- `GET /api/matching/search/sales-companies` - 営業会社検索（決裁者用）
- `POST /api/matching/request` - マッチング申請送信（営業会社用）
- `PUT /api/matching/request/:requestId/respond` - 申請への応答（決裁者用）
- `GET /api/matching/requests` - 申請一覧取得

## テスト

```bash
npm test
```

## ビルド

### バックエンド
```bash
npm run build
npm start
```

### フロントエンド
```bash
cd frontend
npm run build
```

## データベーススキーマ

### users
- id (UUID, Primary Key)
- email (Unique)
- password (Hashed)
- user_type ('sales_company' | 'decision_maker')
- is_verified (Boolean)
- created_at, updated_at

### sales_companies
- id (UUID, Primary Key)
- user_id (Foreign Key)
- company_name
- industry
- description
- website
- employees
- target_industries (Array)
- services (Array)
- created_at, updated_at

### decision_makers
- id (UUID, Primary Key)
- user_id (Foreign Key)
- first_name, last_name
- position
- company_name
- industry
- company_size
- interests (Array)
- budget
- created_at, updated_at

### match_requests
- id (UUID, Primary Key)
- sales_company_id (Foreign Key)
- decision_maker_id (Foreign Key)
- message
- status ('pending' | 'accepted' | 'rejected')
- created_at, updated_at

## セキュリティ

- パスワードはbcryptjsでハッシュ化
- JWT トークンによる認証
- CORS設定
- Helmet.jsによるセキュリティヘッダー
- 入力値検証

## ライセンス

MIT