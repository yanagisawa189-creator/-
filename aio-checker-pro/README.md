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

詳細なセットアップ手順は [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。

### クイックスタート

```bash
# 1. 依存関係インストール
npm install

# 2. データベースセットアップ
npm run init-db

# 3. サーバー起動
npm start
```

## 📡 API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン

### 企業管理
- `GET /api/companies` - 企業一覧取得
- `POST /api/companies` - 企業追加
- `POST /api/companies/:id/keywords` - キーワード追加

### AIOチェック
- `POST /api/check/run` - チェック実行
- `GET /api/check/results` - 結果取得

### レポート
- `POST /api/reports/weekly` - 週次レポート生成

## 📸 スクリーンショット証跡

引用が検出された際、実際の画面をキャプチャして保存します：

```
screenshots/
  ├── google_aio_keyword1_1234567890.png
  ├── chatgpt_keyword2_1234567891.png
  └── ...
```

## 📄 PDFレポート

週次/月次レポートを自動生成：
- サマリー統計
- LLM別検出状況
- スクリーンショット添付
- 推奨アクション

## 🔐 セキュリティ

- bcrypt パスワードハッシュ化
- JWT トークン認証
- 顧客データ完全分離
- SQL インジェクション対策

## 📈 料金プラン

- **Basic**: 月10,000円 / 10社まで
- **Standard**: 月30,000円 / 50社まで
- **Premium**: 月100,000円 / 200社まで
- **Enterprise**: カスタム見積もり

## 📝 ライセンス

Proprietary - All Rights Reserved

---

**Developed with ❤️ by AIO Checker Team**
