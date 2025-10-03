# レポート自動生成機能 仕様書

## 概要
クライアント別にGoogle検索順位レポートをPDF・Excel形式で自動生成する機能

## 実装ファイル
- `backend/services/reportGenerator.js` - レポート生成サービス
- `backend/server-simple.js` - API エンドポイント追加

## 主な機能

### 1. PDFレポート生成
- **ライブラリ**: pdfkit
- **含まれる情報**:
  - 企業名
  - 期間（開始日〜終了日）
  - サマリー統計（総キーワード数、平均順位、TOP10入り数、TOP50入り数、圏外数）
  - 詳細データテーブル（キーワード、順位、AI Overview、日付）
- **ファイル名形式**: `report_{companyId}_{timestamp}.pdf`

### 2. Excelレポート生成  
- **ライブラリ**: exceljs
- **シート構成**:
  1. **Summary**: サマリー統計
  2. **Ranking Details**: 順位詳細データ
- **条件付き書式**:
  - 1-10位: 緑色背景
  - 11-50位: 黄色背景
  - 51-100位: 赤色背景
- **ファイル名形式**: `report_{companyId}_{timestamp}.xlsx`

### 3. APIエンドポイント

#### POST /api/reports/generate
```javascript
// リクエスト
{
  "companyId": "12345",
  "format": "pdf" | "excel" | "both",
  "startDate": "2025-09-26",
  "endDate": "2025-10-03"
}

// レスポンス
{
  "success": true,
  "pdfPath": "/reports/report_12345_1234567890.pdf",
  "excelPath": "/reports/report_12345_1234567890.xlsx"
}
```

#### GET /api/reports/download/:filename
- レポートファイルのダウンロード

## 必要な npm パッケージ
```json
{
  "pdfkit": "^0.14.0",
  "exceljs": "^4.4.0"
}
```

## 使用例

### Dashboard V2からの呼び出し
```javascript
async function generateReport(companyId, format = 'pdf') {
    try {
        const response = await fetch(`${API_BASE}/reports/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                companyId,
                format,
                startDate: '2025-09-26',
                endDate: '2025-10-03'
            })
        });

        const data = await response.json();

        if (data.success) {
            // ダウンロードリンクを表示
            if (data.pdfPath) {
                window.open(`${API_BASE}/reports/download/${data.pdfPath}`, '_blank');
            }
            if (data.excelPath) {
                window.open(`${API_BASE}/reports/download/${data.excelPath}`, '_blank');
            }
        }
    } catch (error) {
        console.error('Report generation error:', error);
    }
}
```

## 次の実装予定

1. ✅ レポート生成機能（PDF/Excel）
2. ⏳ クライアントポータル自動発行
3. ⏳ アラート通知機能
4. ⏳ 請求管理機能

