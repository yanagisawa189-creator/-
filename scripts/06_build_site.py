#!/usr/bin/env python3
"""
防災計画比較サイトを構築・生成するスクリプト
"""

import csv
import json
import os
from pathlib import Path
import shutil

class SiteBuilder:
    def __init__(self):
        self.data_file = "data/normalized/sample_evacuation_data.csv"
        self.output_dir = Path("app")
        self.build_dir = Path("build")
        
    def load_evacuation_data(self):
        """避難所データを読み込み"""
        data = []
        
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # 数値フィールドを変換
                    for field in ['designated_shelters', 'emergency_evacuation_sites', 
                                'tsunami_evacuation_buildings', 'total_facilities']:
                        try:
                            row[field] = int(row[field]) if row[field] else 0
                        except ValueError:
                            row[field] = 0
                    data.append(row)
        
        print(f"避難所データ読み込み完了: {len(data)} 件")
        return data
        
    def generate_data_js(self, evacuation_data):
        """JavaScriptデータファイルを生成"""
        js_content = f"""// 自動生成された避難所データ
const EVACUATION_DATA = {json.dumps(evacuation_data, ensure_ascii=False, indent=2)};

// データ読み込み関数を更新
async function loadEvacuationData() {{
    try {{
        evacuationData = EVACUATION_DATA;
        filteredData = [...evacuationData];
        renderTable();
        updateStats();
        console.log('避難所データ読み込み完了:', evacuationData.length, '件');
    }} catch (error) {{
        console.error('データ読み込みエラー:', error);
        document.getElementById('statsText').textContent = 'データの読み込みに失敗しました';
    }}
}}
"""
        
        data_js_path = self.build_dir / "assets" / "data.js"
        with open(data_js_path, 'w', encoding='utf-8') as f:
            f.write(js_content)
            
        print(f"データファイル生成完了: {data_js_path}")
        
    def update_html_for_build(self):
        """ビルド用にHTMLを更新"""
        html_source = self.output_dir / "index.html"
        html_target = self.build_dir / "index.html"
        
        with open(html_source, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        # data.jsを追加
        html_content = html_content.replace(
            '<script src="assets/app.js"></script>',
            '    <script src="assets/data.js"></script>\n    <script src="assets/app.js"></script>'
        )
        
        # 統計情報を更新
        current_date = "2025-09-04"
        html_content = html_content.replace(
            '<span id="lastUpdated">2025-09-04</span>',
            f'<span id="lastUpdated">{current_date}</span>'
        )
        
        with open(html_target, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        print(f"HTMLファイル更新完了: {html_target}")
        
    def generate_readme(self, evacuation_data):
        """README.mdを生成"""
        current_date = "2025-09-04"
        total_municipalities = len(evacuation_data)
        total_shelters = sum(row['designated_shelters'] for row in evacuation_data)
        total_emergency = sum(row['emergency_evacuation_sites'] for row in evacuation_data)
        total_tsunami = sum(row['tsunami_evacuation_buildings'] for row in evacuation_data)
        total_facilities = sum(row['total_facilities'] for row in evacuation_data)
        
        readme_content = f"""# 🏝️ 沖縄本島 防災計画比較システム

沖縄本島に所在する市町村の地域防災計画から避難所・防災施設情報を抽出・比較するWebシステムです。

## 📊 データ統計

- **対象市町村**: {total_municipalities} 市町村
- **指定避難所**: {total_shelters} 箇所
- **緊急避難場所**: {total_emergency} 箇所  
- **津波避難ビル**: {total_tsunami} 棟
- **総施設数**: {total_facilities} 箇所

## 🚀 機能

### 📋 比較表示
- 市町村別の避難所数を一覧表示
- ソート機能（各項目でクリック）
- 検索機能（市町村名）
- 災害種別フィルタ（津波・洪水・地震・土砂災害）

### 📊 グラフ表示
- 棒グラフによる比較可視化
- 比較項目の切り替え
- レスポンシブデザイン

### 📱 詳細情報
- 各市町村の詳細データ表示
- 主要避難所の具体的情報
- 対応災害種別の表示

## 🛠️ 技術仕様

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **グラフライブラリ**: Chart.js
- **データ形式**: CSV → JSON
- **レスポンシブ**: モバイル対応

## 📁 ファイル構成

```
build/
├── index.html          # メインページ
├── assets/
│   ├── style.css       # スタイルシート  
│   ├── app.js          # メイン機能
│   └── data.js         # 避難所データ
└── README.md           # このファイル
```

## 🎯 使用方法

1. `index.html` をブラウザで開く
2. 表形式またはグラフ形式で表示を切り替え
3. 検索・フィルタで絞り込み
4. 市町村名をクリックして詳細を表示

## ⚠️ 注意事項

- データは各市町村の公式地域防災計画から抽出
- 数値は最新の防災計画に基づく（2025年度版）
- 実際の避難時は最新の情報を確認してください

## 📅 最終更新

{current_date}

---

## 🔗 関連リンク

- [沖縄県公式サイト](https://www.pref.okinawa.jp/)
- [内閣府防災情報](https://www.bousai.go.jp/)

## 📝 ライセンス

このシステムは防災・減災を目的とした公共利用を想定しています。
商用利用時は事前にご相談ください。
"""

        readme_path = self.build_dir / "README.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
            
        print(f"README生成完了: {readme_path}")
        
    def build_site(self):
        """サイト全体をビルド"""
        print("防災計画比較サイトのビルドを開始")
        
        # ビルドディレクトリの準備
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
        self.build_dir.mkdir(parents=True)
        (self.build_dir / "assets").mkdir()
        
        # ソースファイルをコピー
        shutil.copy2(self.output_dir / "assets" / "style.css", self.build_dir / "assets")
        shutil.copy2(self.output_dir / "assets" / "app.js", self.build_dir / "assets")
        
        # データを読み込み
        evacuation_data = self.load_evacuation_data()
        
        # データJSファイルを生成
        self.generate_data_js(evacuation_data)
        
        # HTMLを更新
        self.update_html_for_build()
        
        # READMEを生成
        self.generate_readme(evacuation_data)
        
        print(f"ビルド完了: {self.build_dir}")
        print(f"ブラウザで開く: {self.build_dir / 'index.html'}")
        
        # 統計表示
        total_municipalities = len(evacuation_data)
        total_facilities = sum(row['total_facilities'] for row in evacuation_data)
        
        print(f"\nサイト統計:")
        print(f"   対象市町村: {total_municipalities}")
        print(f"   総避難施設: {total_facilities} 箇所")
        
    def run(self):
        """メイン実行"""
        self.build_site()

if __name__ == "__main__":
    builder = SiteBuilder()
    builder.run()