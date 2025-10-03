#!/usr/bin/env python3
"""
防災計画PDF/HTMLから避難所情報を抽出するスクリプト
"""

import csv
import json
import re
import os
from pathlib import Path
import pdfplumber
from bs4 import BeautifulSoup

class EvacuationDataExtractor:
    def __init__(self):
        self.pdf_dir = Path("data/raw_pdfs")
        self.html_dir = Path("data/raw_html")
        self.extraction_results = []
        
        # 避難所関連キーワード
        self.shelter_keywords = [
            '指定避難所', '避難所', '緊急避難場所', '津波避難ビル', 
            '一時避難場所', '広域避難場所', '避難場所'
        ]
        
        # 災害種別キーワード
        self.hazard_keywords = {
            '津波': ['津波'],
            '洪水': ['洪水', '河川氾濫', '内水氾濫'],
            '土砂災害': ['土砂災害', '土石流', '地すべり', '急傾斜地崩壊'],
            '地震': ['地震', '震災'],
            '高潮': ['高潮'],
            '火災': ['火災', '大火']
        }
        
    def extract_from_pdf(self, pdf_path, municipality_info):
        """PDFから避難所情報を抽出"""
        municipality_name = municipality_info['municipality_name']
        municipality_id = municipality_info['municipality_id']
        
        print(f"📄 {municipality_name} のPDFを解析中: {pdf_path}")
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                full_text = ""
                tables = []
                
                for page in pdf.pages:
                    # テキスト抽出
                    page_text = page.extract_text()
                    if page_text:
                        full_text += page_text + "\n"
                    
                    # テーブル抽出
                    page_tables = page.extract_tables()
                    if page_tables:
                        tables.extend(page_tables)
                
                return self.analyze_extracted_content(
                    full_text, tables, municipality_id, municipality_name, 'pdf', str(pdf_path)
                )
                
        except Exception as e:
            print(f"  ❌ PDF解析エラー: {str(e)}")
            return {
                'municipality_id': municipality_id,
                'municipality_name': municipality_name,
                'source_file': str(pdf_path),
                'extraction_status': 'pdf_error',
                'error_message': str(e)
            }
            
    def extract_from_html(self, html_path, municipality_info):
        """HTMLから避難所情報を抽出"""
        municipality_name = municipality_info['municipality_name']
        municipality_id = municipality_info['municipality_id']
        
        print(f"🌐 {municipality_name} のHTMLを解析中: {html_path}")
        
        try:
            with open(html_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            soup = BeautifulSoup(content, 'html.parser')
            
            # テキスト抽出
            full_text = soup.get_text()
            
            # テーブル抽出
            tables = []
            for table in soup.find_all('table'):
                table_data = []
                for row in table.find_all('tr'):
                    row_data = [cell.get_text(strip=True) for cell in row.find_all(['td', 'th'])]
                    if row_data:
                        table_data.append(row_data)
                if table_data:
                    tables.append(table_data)
                    
            return self.analyze_extracted_content(
                full_text, tables, municipality_id, municipality_name, 'html', str(html_path)
            )
            
        except Exception as e:
            print(f"  ❌ HTML解析エラー: {str(e)}")
            return {
                'municipality_id': municipality_id,
                'municipality_name': municipality_name,
                'source_file': str(html_path),
                'extraction_status': 'html_error',
                'error_message': str(e)
            }
            
    def analyze_extracted_content(self, text, tables, municipality_id, municipality_name, source_type, source_file):
        """抽出したコンテンツから避難所情報を分析"""
        result = {
            'municipality_id': municipality_id,
            'municipality_name': municipality_name,
            'source_file': source_file,
            'source_type': source_type,
            'extraction_status': 'analyzed'
        }
        
        # 避難所数をカウント
        shelter_counts = self.count_shelters_in_text(text, tables)
        result.update(shelter_counts)
        
        # 対応災害種別を抽出
        hazard_types = self.extract_hazard_types(text)
        result['supported_hazards'] = ','.join(hazard_types)
        
        # 具体的な避難所リストを抽出（可能な場合）
        shelter_list = self.extract_shelter_list(text, tables)
        result['shelter_details'] = json.dumps(shelter_list, ensure_ascii=False) if shelter_list else None
        
        print(f"  ✅ 解析完了: 指定避難所{shelter_counts.get('designated_shelters', 0)}箇所")
        
        return result
        
    def count_shelters_in_text(self, text, tables):
        """テキストと表から避難所数をカウント"""
        counts = {
            'designated_shelters': 0,
            'emergency_evacuation_sites': 0,
            'tsunami_evacuation_buildings': 0,
            'total_facilities': 0
        }
        
        # テキストから数値を抽出
        patterns = [
            (r'指定避難所[：:]?\s*(\d+)[箇か所]', 'designated_shelters'),
            (r'緊急避難場所[：:]?\s*(\d+)[箇か所]', 'emergency_evacuation_sites'),
            (r'津波避難ビル[：:]?\s*(\d+)[棟箇か所]', 'tsunami_evacuation_buildings'),
        ]
        
        for pattern, key in patterns:
            matches = re.findall(pattern, text)
            if matches:
                counts[key] = max(int(match) for match in matches)
                
        # 表から避難所をカウント
        table_counts = self.count_shelters_in_tables(tables)
        for key, value in table_counts.items():
            if value > counts[key]:
                counts[key] = value
                
        # 総数を計算
        counts['total_facilities'] = sum([
            counts['designated_shelters'],
            counts['emergency_evacuation_sites'],
            counts['tsunami_evacuation_buildings']
        ])
        
        return counts
        
    def count_shelters_in_tables(self, tables):
        """表から避難所をカウント"""
        counts = {
            'designated_shelters': 0,
            'emergency_evacuation_sites': 0,
            'tsunami_evacuation_buildings': 0
        }
        
        for table in tables:
            if not table:
                continue
                
            # ヘッダー行から避難所関連テーブルを判定
            header = ' '.join(table[0]) if table else ''
            
            if any(keyword in header for keyword in self.shelter_keywords):
                # 避難所リストの表として扱う
                shelter_rows = [row for row in table[1:] if row and any(cell.strip() for cell in row)]
                
                if '指定避難所' in header:
                    counts['designated_shelters'] = max(counts['designated_shelters'], len(shelter_rows))
                elif '緊急避難' in header:
                    counts['emergency_evacuation_sites'] = max(counts['emergency_evacuation_sites'], len(shelter_rows))
                elif '津波' in header:
                    counts['tsunami_evacuation_buildings'] = max(counts['tsunami_evacuation_buildings'], len(shelter_rows))
                    
        return counts
        
    def extract_hazard_types(self, text):
        """対応災害種別を抽出"""
        found_hazards = []
        
        for hazard_type, keywords in self.hazard_keywords.items():
            if any(keyword in text for keyword in keywords):
                found_hazards.append(hazard_type)
                
        return found_hazards
        
    def extract_shelter_list(self, text, tables):
        """具体的な避難所リストを抽出（簡易版）"""
        shelters = []
        
        # 表から避難所情報を抽出
        for table in tables:
            if not table or len(table) < 2:
                continue
                
            header = table[0]
            
            # 避難所リストテーブルを判定
            if any(keyword in ' '.join(header) for keyword in self.shelter_keywords):
                for row in table[1:]:
                    if row and len(row) >= 1 and row[0].strip():
                        shelter_info = {
                            'name': row[0].strip(),
                            'address': row[1].strip() if len(row) > 1 else '',
                            'capacity': row[2].strip() if len(row) > 2 else '',
                            'notes': row[3].strip() if len(row) > 3 else ''
                        }
                        shelters.append(shelter_info)
                        
        return shelters[:10]  # 最大10件まで
        
    def load_download_results(self):
        """ダウンロード結果を読み込み"""
        downloads_csv = "data/registry/disaster_plan_downloads.csv"
        
        if not os.path.exists(downloads_csv):
            print(f"❌ ダウンロード結果ファイルが見つかりません: {downloads_csv}")
            return []
            
        downloads = []
        with open(downloads_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            downloads = list(reader)
            
        return downloads
        
    def save_extraction_results(self):
        """抽出結果を保存"""
        output_file = "data/normalized/okinawa_evacuation_data.csv"
        
        if self.extraction_results:
            fieldnames = list(self.extraction_results[0].keys())
            
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(self.extraction_results)
                
        print(f"\n💾 抽出結果を保存: {output_file}")
        
        # 統計表示
        total = len(self.extraction_results)
        success_count = sum(1 for r in self.extraction_results if r.get('extraction_status') == 'analyzed')
        
        print(f"総件数: {total}")
        print(f"解析成功: {success_count} 件")
        
        if success_count > 0:
            total_shelters = sum(r.get('designated_shelters', 0) for r in self.extraction_results)
            print(f"発見した指定避難所総数: {total_shelters} 箇所")
            
    def run(self):
        """メイン実行"""
        print("🚀 避難所データ抽出を開始")
        
        downloads = self.load_download_results()
        print(f"対象ファイル数: {len(downloads)}")
        
        for download in downloads:
            municipality_info = {
                'municipality_id': download['municipality_id'],
                'municipality_name': download['municipality_name']
            }
            
            file_path = download.get('file_path')
            if not file_path or not os.path.exists(file_path):
                print(f"⚠️  ファイルが見つかりません: {file_path}")
                continue
                
            if download['status'] == 'pdf_downloaded':
                result = self.extract_from_pdf(file_path, municipality_info)
            elif download['status'] == 'html_saved':
                result = self.extract_from_html(file_path, municipality_info)
            else:
                continue
                
            self.extraction_results.append(result)
            
        self.save_extraction_results()
        print("✅ 抽出完了")

if __name__ == "__main__":
    extractor = EvacuationDataExtractor()
    extractor.run()