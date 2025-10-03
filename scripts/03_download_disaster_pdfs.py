#!/usr/bin/env python3
"""
発見した防災計画ページからPDF/HTMLを収集するスクリプト
"""

import csv
import requests
import os
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import time
from pathlib import Path
import hashlib

class DisasterPlanDownloader:
    def __init__(self, urls_csv="data/registry/disaster_plan_urls.csv"):
        self.urls_csv = urls_csv
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        self.download_results = []
        
        # ダウンロード先ディレクトリ
        self.pdf_dir = Path("data/raw_pdfs")
        self.html_dir = Path("data/raw_html")
        self.pdf_dir.mkdir(exist_ok=True)
        self.html_dir.mkdir(exist_ok=True)
        
    def load_disaster_urls(self):
        """防災計画URLリストを読み込み"""
        urls = []
        with open(self.urls_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['disaster_plan_url'] and row['disaster_plan_url'] != 'None':
                    urls.append(row)
        return urls
        
    def download_disaster_content(self, url_info):
        """防災計画コンテンツをダウンロード"""
        municipality_name = url_info['municipality_name']
        municipality_id = url_info['municipality_id']
        disaster_url = url_info['disaster_plan_url']
        
        print(f"\n📥 {municipality_name} の防災計画をダウンロード中...")
        print(f"    URL: {disaster_url}")
        
        try:
            response = self.session.get(disaster_url, timeout=15)
            response.raise_for_status()
            
            # コンテンツタイプを判定
            content_type = response.headers.get('content-type', '').lower()
            
            if 'pdf' in content_type:
                # PDFファイルの場合
                return self.save_pdf(response, municipality_id, municipality_name, disaster_url)
                
            elif 'html' in content_type or 'text' in content_type:
                # HTMLページの場合、PDF リンクを探す
                return self.process_html_page(response, municipality_id, municipality_name, disaster_url)
                
            else:
                print(f"  ❓ 不明なコンテンツタイプ: {content_type}")
                return {
                    'municipality_id': municipality_id,
                    'municipality_name': municipality_name,
                    'source_url': disaster_url,
                    'status': 'unknown_content_type',
                    'file_path': None,
                    'file_hash': None,
                    'content_type': content_type
                }
                
        except Exception as e:
            print(f"  ❌ ダウンロードエラー: {str(e)}")
            return {
                'municipality_id': municipality_id,
                'municipality_name': municipality_name,
                'source_url': disaster_url,
                'status': 'download_error',
                'file_path': None,
                'file_hash': None,
                'error_message': str(e)
            }
            
    def save_pdf(self, response, municipality_id, municipality_name, source_url):
        """PDFファイルを保存"""
        filename = f"{municipality_id}_disaster_plan.pdf"
        file_path = self.pdf_dir / filename
        
        with open(file_path, 'wb') as f:
            f.write(response.content)
            
        # ハッシュ計算
        file_hash = hashlib.sha256(response.content).hexdigest()
        
        print(f"  ✅ PDF保存完了: {file_path}")
        
        return {
            'municipality_id': municipality_id,
            'municipality_name': municipality_name,
            'source_url': source_url,
            'status': 'pdf_downloaded',
            'file_path': str(file_path),
            'file_hash': file_hash,
            'content_type': 'application/pdf',
            'file_size': len(response.content)
        }
        
    def process_html_page(self, response, municipality_id, municipality_name, source_url):
        """HTMLページを処理してPDFリンクを探す"""
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # PDF リンクを探す
        pdf_links = []
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            text = link.get_text(strip=True)
            
            if href.lower().endswith('.pdf') or 'pdf' in text.lower():
                full_url = urljoin(source_url, href)
                if any(keyword in text for keyword in ['防災計画', '避難', '災害']):
                    pdf_links.append({
                        'url': full_url,
                        'text': text
                    })
                    
        if pdf_links:
            print(f"  📋 {len(pdf_links)} 件のPDFリンクを発見")
            # 最初のPDFリンクをダウンロード
            pdf_link = pdf_links[0]
            try:
                pdf_response = self.session.get(pdf_link['url'], timeout=15)
                pdf_response.raise_for_status()
                return self.save_pdf(pdf_response, municipality_id, municipality_name, pdf_link['url'])
            except Exception as e:
                print(f"  ❌ PDFダウンロードエラー: {str(e)}")
        
        # PDFが見つからない場合はHTMLを保存
        filename = f"{municipality_id}_disaster_page.html"
        file_path = self.html_dir / filename
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(response.text)
            
        # ハッシュ計算
        file_hash = hashlib.sha256(response.content).hexdigest()
        
        print(f"  📝 HTML保存完了: {file_path}")
        
        return {
            'municipality_id': municipality_id,
            'municipality_name': municipality_name,
            'source_url': source_url,
            'status': 'html_saved',
            'file_path': str(file_path),
            'file_hash': file_hash,
            'content_type': 'text/html',
            'file_size': len(response.content),
            'pdf_links_found': len(pdf_links)
        }
        
    def save_download_results(self):
        """ダウンロード結果を保存"""
        output_file = "data/registry/disaster_plan_downloads.csv"
        
        if self.download_results:
            fieldnames = list(self.download_results[0].keys())
            
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(self.download_results)
                
        print(f"\n💾 ダウンロード結果を保存: {output_file}")
        
        # 統計表示
        total = len(self.download_results)
        pdf_count = sum(1 for r in self.download_results if r['status'] == 'pdf_downloaded')
        html_count = sum(1 for r in self.download_results if r['status'] == 'html_saved')
        
        print(f"総件数: {total}")
        print(f"PDF取得: {pdf_count} 件")
        print(f"HTML保存: {html_count} 件")
        
    def run(self):
        """メイン実行"""
        print("🚀 防災計画コンテンツダウンロードを開始")
        
        disaster_urls = self.load_disaster_urls()
        print(f"対象URL数: {len(disaster_urls)}")
        
        for url_info in disaster_urls:
            result = self.download_disaster_content(url_info)
            self.download_results.append(result)
            
            # レート制限
            time.sleep(2)
            
        self.save_download_results()
        print("✅ ダウンロード完了")

if __name__ == "__main__":
    downloader = DisasterPlanDownloader()
    downloader.run()