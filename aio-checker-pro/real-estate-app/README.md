# 不動産媒体自動化ツール

一度の物件入力から、SUUMO/HOME'S/Instagram/紙チラシ向けのテキスト・CSV・画像を自動生成する最小可動プロダクト（MVP）です。

## 機能概要

### 🏠 入力機能
- 物件基本情報の入力フォーム（所在地・価格・面積・築年・間取り・沿線/駅・徒歩分数・PRポイント）
- 画像ドラッグ&ドロップアップロード（最大5枚）

### 📝 自動生成機能
- **SUUMO**: 250〜300字、駅徒歩・生活利便・教育環境・担当コメント順
- **HOME'S**: 箇条書き先行、上限200字×3ブロック
- **Instagram**: 280〜350字 + ハッシュタグ自動10件
- **紙チラシ**: 見出し20字以内 + サブコピー40字以内 + 箇条書き5点

### 🖼️ 画像処理機能
- 媒体別自動リサイズ
  - SUUMO: 760×570
  - HOME'S: 720×540
  - Instagram: 1080×1080（正方形クロップ）
  - 紙チラシ: A4 300dpi対応

### 📊 エクスポート機能
- **SUUMO/HOME'S**: CSV形式（UTF-8、カスタマイズ可能なマッピング）
- **Instagram**: Zip（post.txt + hashtags.txt + 画像）
- **紙チラシ**: Zip（copy.txt + 画像）

## 技術スタック

### Backend
- **Python 3.9+**
- **FastAPI** - RESTful API
- **SQLModel** - データベースORM
- **SQLite** - データベース
- **Pillow** - 画像処理
- **Uvicorn** - ASGIサーバー

### Frontend
- **Vite** - ビルドツール
- **React 18** + **TypeScript**
- **Tailwind CSS** - スタイリング
- **React Hook Form** - フォーム管理
- **React Dropzone** - ファイルアップロード

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd real-estate-app
```

### 2. Python環境構築

```bash
# Python 3.9以上がインストールされていることを確認
python --version

# 仮想環境作成（推奨）
python -m venv venv

# 仮想環境のアクティベート
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 依存関係インストール
pip install -r requirements.txt
```

### 3. Frontend環境構築

```bash
cd frontend
npm install
```

### 4. 開発サーバー起動

#### Backend (ターミナル1)
```bash
# プロジェクトルートディレクトリで
cd app
python -m uvicorn main:app --reload --port 8000
```

#### Frontend (ターミナル2)
```bash
cd frontend
npm run dev
```

### 5. アクセス

- **フロントエンド**: http://localhost:5173
- **API**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

## 使用方法

### 1. 物件登録
1. トップページで物件情報を入力
2. 画像をドラッグ&ドロップでアップロード（最大5枚）
3. 「物件を登録」ボタンをクリック

### 2. メディアコンテンツ生成
1. 物件登録後、詳細ページに自動遷移
2. 「メディアコンテンツを生成」ボタンをクリック
3. 各媒体向けのテキストと画像が自動生成

### 3. プレビュー・編集
1. タブで媒体を切り替えてプレビュー確認
2. 「コピー」ボタンでテキストをクリップボードにコピー
3. 画像プレビューで各媒体向けサイズを確認

### 4. エクスポート
1. 各媒体タブで「CSVダウンロード」または「ZIPダウンロード」
2. ファイルがローカルにダウンロードされます

## ファイル構成

```
real-estate-app/
├── README.md
├── requirements.txt
├── app/
│   ├── main.py                 # FastAPI アプリケーション
│   ├── models.py               # データベースモデル
│   └── services/
│       ├── copy_generator.py   # テキスト生成サービス
│       ├── image_service.py    # 画像処理サービス
│       ├── export_service.py   # エクスポートサービス
│       └── mapping.yaml        # CSV出力カラムマッピング
├── backend/
│   └── static/
│       └── images/            # アップロード画像保存先
│           ├── original/
│           ├── suumo/
│           ├── homes/
│           ├── instagram/
│           └── flyer/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── services/api.ts     # API クライアント
    │   └── pages/
    │       ├── PropertyForm.tsx    # 物件入力フォーム
    │       └── PropertyDetail.tsx  # 生成結果プレビュー
    └── public/
```

## カスタマイズ

### CSVエクスポートカラム変更
`app/services/mapping.yaml`を編集することで、CSV出力のカラムマッピングをカスタマイズできます。

```yaml
suumo:
  columns:
    - csv_column: "物件名"
      property_field: "address"
    - csv_column: "価格"
      property_field: "price"
      format: "万円"
    # ... 他のカラム設定
```

### テキスト生成ルール変更
`app/services/copy_generator.py`の各媒体向けメソッドを編集することで、生成ルールを変更できます。

### 画像サイズ変更
`app/services/image_service.py`の`media_sizes`辞書を編集することで、各媒体の画像サイズを変更できます。

## API仕様

### POST /api/properties
物件を登録します。

**Request**: multipart/form-data
- `address`: 所在地
- `price`: 価格（整数）
- `area_sqm`: 面積（小数）
- `built_year`: 築年（整数）
- `layout`: 間取り
- `station`: 最寄り駅
- `walk_min`: 徒歩分数（整数）
- `pr`: PRポイント
- `images`: 画像ファイル配列

**Response**: 
```json
{
  "id": 1,
  "created_at": "2024-01-01T12:00:00"
}
```

### POST /api/properties/{id}/generate
メディアコンテンツを生成します。

**Response**:
```json
{
  "status": "ok",
  "copies": {
    "suumo": "生成されたSUUMO向けテキスト",
    "homes": "生成されたHOME'S向けテキスト",
    "instagram": {
      "content": "投稿文",
      "hashtags": ["#ハッシュタグ1", "#ハッシュタグ2"]
    },
    "flyer": {
      "headline": "見出し",
      "sub_copy": "サブコピー",
      "bullet_points": ["特徴1", "特徴2"]
    }
  },
  "images": {
    "suumo": ["画像パス1", "画像パス2"],
    "homes": ["画像パス1", "画像パス2"],
    "instagram": ["画像パス1", "画像パス2"],
    "flyer": ["画像パス1", "画像パス2"]
  }
}
```

### GET /api/properties/{id}/export?media={type}
メディアコンテンツをエクスポートします。

**Parameters**:
- `media`: `suumo`, `homes`, `instagram`, `flyer`

**Response**: CSV または ZIP ファイルのバイナリデータ

## 受け入れ基準

✅ 入力→生成→媒体別プレビュー→ダウンロードがエラーなく一連で実行可能  
✅ Instagram文が280–350字、ハッシュタグ10個自動生成  
✅ SUUMO/HOME'S CSVがUTF-8で正常に開ける  
✅ 画像が媒体ごとに指定サイズへ変換される  

## サンプルデータ

以下のサンプルデータで動作確認ができます：

```json
{
  "address": "京都府城陽市寺田水度坂",
  "price": 32800000,
  "area_sqm": 92.3,
  "built_year": 2001,
  "layout": "3LDK",
  "station": "奈良線 城陽",
  "walk_min": 12,
  "pr": "南向き・日当たり良好／小中学校が徒歩圏／買物施設充実"
}
```

## トラブルシューティング

### よくある問題

**Q: `ImportError: No module named 'PIL'`**  
A: Pillowがインストールされていません。`pip install pillow`を実行してください。

**Q: フロントエンドで画像が表示されない**  
A: Backendが起動していることを確認してください。また、`http://localhost:8000`でAPIにアクセスできることを確認してください。

**Q: CSVファイルが文字化けする**  
A: UTF-8対応のエディタで開いてください。Excelで開く場合は、「データ」→「テキストファイル」から文字コードをUTF-8に指定してインポートしてください。

**Q: 画像アップロードが失敗する**  
A: 画像ファイルサイズが大きすぎる可能性があります。10MB以下の画像を使用してください。

### ログの確認

Backend側のエラーログは起動しているターミナルに出力されます。詳細なエラー情報が必要な場合は確認してください。

## 今後の拡張予定

- LLM（Claude/OpenAI）との統合
- より詳細な媒体別設定
- バッチ処理機能
- ユーザー管理機能
- プレビュー画像の改善

## ライセンス

MIT License