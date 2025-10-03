# 沖縄本島 市町村 2025年度予算比較システム 仕様書 v0.1

## 1. プロジェクト概要
- **目的**：沖縄本島に所在する各市町村の **2025（令和7）年度 当初予算** を横並び比較できるよう、予算資料の取得→解析→科目正規化→比較UI（HTML）までを一気通貫で実装する。
- **成果物**：
  1. 市町村公式HP一覧（URL・連絡窓口）  
  2. 予算資料への到達URL・PDFダウンロード（可能な範囲）  
  3. 主要科目の数値（一般会計中心）を正規化した **CSV/JSON**  
  4. ブラウザで閲覧・比較・ソート・検索できる **静的HTML**  
  5. 取得ログ・エラーレポート（再取得・再解析が容易）  

## 2. 対象範囲
- **地理的範囲**：沖縄 **本島** に所在する市町村  
- **会計範囲**：まず **一般会計 当初予算（歳出）** を必須。必要に応じて特別会計・企業会計は拡張。  
- **年度**：2025年度（令和7年度）。補正は除外（初版では当初のみ）。  

## 3. 収集要件
- **公式HPリスト化**：自治体名、日本語正式表記、公式サイトURL、予算関連の起点URL  
- **予算ページ探索**：以下のキーワード候補で探索  
  - 「予算」「当初予算」「令和7年度 予算」「一般会計」「歳出」「予算書」「予算説明書」「財政」  
- **PDF取得**：リンク先がPDFならダウンロード。HTMLのみの場合は当該URLを保存。スキャンPDFはOCRする。  
- **メタ情報**：発表日・掲載日・改訂日、元URL、ファイルハッシュ、コンテンツ種別（PDF/HTML/Excel等）。  

## 4. 解析・正規化
- **文字起こし**：テキストPDFは直接抽出、画像/スキャンPDFはOCR。  
- **表抽出**：Camelot/Tabula系ツール利用。  
- **正規化マッピング（例）**：  
  - 総務費 → `general_admin`  
  - 民生費 → `welfare`  
  - 衛生費 → `health_sanitation`  
  - 労働費 → `labor`  
  - 農林水産業費 → `agri_fishery`  
  - 商工費 → `commerce_industry`  
  - 土木費 → `public_works`  
  - 消防費 → `fire_service`  
  - 教育費 → `education`  
  - 災害復旧費 → `disaster_recovery`  
  - 公債費 → `debt_service`  
  - 議会費 → `assembly`  
  - 予備費 → `contingency`  

## 5. データモデル（例）
```json
{
  "municipality_id": "JP-OKI-NAHA",
  "municipality_name": "那覇市",
  "official_site_url": "https://...",
  "budget_page_url_2025": "https://...",
  "budget_documents": [
    {
      "type": "initial_general",
      "format": "pdf",
      "source_url": "https://...",
      "local_path": "data/raw_pdfs/naha_2025_initial.pdf",
      "hash": "sha256:..."
    }
  ],
  "fiscal_values": {
    "currency": "JPY",
    "unit": "thousand_yen",
    "total_general_expenditure": 123456789,
    "breakdown": {
      "general_admin": 12345,
      "welfare": 23456,
      "education": 45678
    },
    "unmapped_items": [
      {"label": "○○費", "amount": 999}
    ]
  }
}
```

## 6. フォルダ構成（案）
```
project/
  data/
    registry/municipalities.csv
    raw_html/
    raw_pdfs/
    ocr_txt/
    normalized/okinawa_budget_2025.csv
  app/
    index.html
    assets/
      app.js
      style.css
  scripts/
    01_registry_build.py
    02_discover_budget_pages.py
    03_download_pdfs.py
    04_extract_tables.py
    05_normalize_mapping.py
    06_build_site.py
  config/
    mapping.json
```

## 7. 比較UI要件
- 列ソート・検索・フィルタ  
- 行クリックで右パネルに原資料リンク表示  
- 各自治体を切り替えて比率表示（円/棒グラフ）  

## 8. 取得・法務
- robots.txt・サイトポリシー順守  
- レート制御（1〜2req/秒）  
- 出典URL・ページ番号を必ず保存  

## 9. 品質基準
- 到達率 95%+  
- 総額抽出成功率 90%+  
- 主要5科目正規化成功率 85%+  

## 10. 作業ステップ
1. 自治体レジストリ作成  
2. 予算ページ探索  
3. PDF/HTML収集  
4. OCR・表抽出・正規化  
5. CSV/JSON生成  
6. HTML比較UI生成  
7. 検証・注記  

## 11. 未確定事項
- 対象自治体の範囲（本島のみ？離島除外？）  
- 会計範囲（一般会計のみ？）  
- 金額の表示単位  
- OCRの扱い  
- 公開形態（社内のみ or 外部公開）  

---

# 追加事例（類似仕様）

## B. 防災計画比較
- **対象**：沖縄本島市町村の最新地域防災計画  
- **比較項目**：指定避難所数、緊急避難場所数、対応ハザード（津波/洪水/土砂など）  
- **成果物**：CSV+HTML UI（フィルタ、色分け）  

## C. 観光統計比較
- **対象**：沖縄本島自治体の観光統計（月次/四半期）  
- **比較項目**：入域観光客数、宿泊稼働率、観光消費額  
- **成果物**：CSV+HTML UI（期間切替、前年比/前期比の計算）  

---

# Claude Code プロンプト例

## A. 予算比較（本案件）
```
claude: 
沖縄本島の市町村ごとに「2025年度 当初予算 一般会計」のページを探し、PDFを取得。
PDFから歳出款別の表を抽出し、mapping.jsonに基づいて正規化。
data/normalized/okinawa_budget_2025.csv を生成し、
app/index.html に比較表（ソート/検索/比率グラフ付）を出力せよ。
```

## B. 防災計画比較
```
claude: 
沖縄本島の市町村の「地域防災計画」を探し、指定避難所数・緊急避難場所数・対応ハザードを抽出。
CSV化し、app/index.html にフィルタ付き比較表を生成せよ。
```

## C. 観光統計比較
```
claude: 
沖縄本島の自治体の「観光統計（月次/四半期）」を収集。
入域観光客数・宿泊稼働率・観光消費額を正規化し、CSV化。
app/index.html に期間切替・前年比/前期比表示付きUIを出力せよ。
```
ブラウザで閲覧したいです

