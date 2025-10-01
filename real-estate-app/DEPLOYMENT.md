# 不動産向けサービス デプロイメントガイド

## 🚀 簡単デプロイメント

### Windows環境
```batch
deploy.bat
```

### Linux/macOS環境
```bash
chmod +x deploy.sh
./deploy.sh
```

## 📋 前提条件

- Docker Desktop がインストールされていること
- Docker Compose がインストールされていること
- ポート8000が利用可能であること

## 🔧 手動デプロイメント

### 1. Dockerイメージのビルド
```bash
docker-compose build
```

### 2. サービスの起動
```bash
docker-compose up -d
```

### 3. アクセス確認
- アプリケーション: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs

## 🗂️ デプロイメント構成

```
real-estate-app/
├── Dockerfile              # マルチステージビルド設定
├── docker-compose.yml      # サービス構成
├── .dockerignore           # Docker除外ファイル
├── deploy.sh              # Linux/macOS デプロイスクリプト
├── deploy.bat             # Windows デプロイスクリプト
└── DEPLOYMENT.md          # このファイル
```

## 🐳 Docker設定詳細

### Dockerfile
- **Stage 1**: Node.js環境でフロントエンドをビルド
- **Stage 2**: Python環境でバックエンドとフロントエンド静的ファイルを統合

### docker-compose.yml
- ポート8000でサービス公開
- 画像ファイル用ボリュームマウント
- データベースファイル永続化
- ヘルスチェック設定

## 🛠️ 運用コマンド

### ログ確認
```bash
docker-compose logs
```

### サービス停止
```bash
docker-compose down
```

### サービス再起動
```bash
docker-compose restart
```

### 完全リセット（データ削除注意）
```bash
docker-compose down -v
docker-compose up -d
```

## 🌐 本番環境デプロイメント

### クラウドサービス（例：AWS/GCP/Azure）

1. **VPS/EC2インスタンス**での運用:
   ```bash
   # リポジトリクローン
   git clone <your-repository>
   cd real-estate-app

   # デプロイメント実行
   ./deploy.sh
   ```

2. **Docker Hub**へのプッシュ:
   ```bash
   # イメージタグ付け
   docker tag real-estate-app_real-estate-app:latest your-username/real-estate-app:latest

   # Docker Hubにプッシュ
   docker push your-username/real-estate-app:latest
   ```

3. **環境変数設定**:
   ```bash
   # .env ファイルを作成
   echo "DATABASE_URL=sqlite:///./properties.db" > .env
   echo "CORS_ORIGINS=https://your-domain.com" >> .env
   ```

## 🔐 セキュリティ設定

本番環境では以下の設定を推奨:

1. **CORS設定の制限**:
   ```python
   # main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-domain.com"],  # 本番ドメインのみ
       allow_credentials=True,
       allow_methods=["GET", "POST"],
       allow_headers=["*"],
   )
   ```

2. **HTTPS設定**:
   - リバースプロキシ（Nginx）の設定
   - SSL証明書の設定

3. **データベース設定**:
   - PostgreSQL等の本格的なDBへの移行を推奨

## 📊 監視・ログ

### アプリケーション監視
```bash
# ヘルスチェック
curl http://localhost:8000/docs

# Docker stats
docker stats
```

### ログ出力設定
```yaml
# docker-compose.yml に追加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🚨 トラブルシューティング

### よくある問題

**Q: ポート8000が使用中**
```bash
# ポート使用確認
netstat -tlnp | grep :8000
# 他のサービスを停止するか、ポートを変更
```

**Q: Docker権限エラー**
```bash
# Dockerグループに追加（Linux）
sudo usermod -aG docker $USER
# 再ログインが必要
```

**Q: ビルドが失敗する**
```bash
# キャッシュをクリア
docker-compose build --no-cache
```

**Q: 画像アップロードが失敗**
```bash
# ディレクトリ権限確認
ls -la backend/static/
# 権限修正
chmod -R 755 backend/static/
```

## 📈 スケーリング

### 負荷分散
```yaml
# docker-compose.yml
version: '3.8'
services:
  real-estate-app:
    build: .
    deploy:
      replicas: 3
    ports:
      - "8000-8002:8000"
```

### データベース分離
```yaml
# PostgreSQL使用例
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: real_estate
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

---

**🎯 このガイドで不動産向けサービスのデプロイメントが完了します！**