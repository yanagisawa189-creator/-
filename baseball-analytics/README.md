# 野球チームデータ分析プロジェクト

このプロジェクトは、野球チームのデータを分析するためのアプリケーションです。選手の成績、試合結果、チーム統計などを管理し、分析する機能を提供します。

## 機能

- ダッシュボード: チームの統計情報を表示
- 選手管理: 選手の成績を表示・更新
- 試合結果: 試合の結果を表示・更新
- 分析: データ分析とレポート生成

## セットアップ

1. リポジトリをクローンします。
   ```bash
   git clone <repository-url>
   ```

2. 依存関係をインストールします。
   ```bash
   cd baseball-analytics
   npm install
   ```

3. アプリケーションを起動します。
   ```bash
   npm start
   ```

## ディレクトリ構造

```
baseball-analytics
├── src
│   ├── app.ts
│   ├── controllers
│   ├── models
│   ├── services
│   ├── utils
│   └── types
├── public
│   ├── css
│   └── js
├── views
├── tests
├── package.json
└── tsconfig.json
```

## 使用方法

アプリケーションを起動した後、ブラウザで `http://localhost:3000` にアクセスしてください。ダッシュボード、選手、試合結果、分析の各ページに移動できます。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。