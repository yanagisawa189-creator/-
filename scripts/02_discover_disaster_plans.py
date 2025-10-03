#!/usr/bin/env python3
"""
沖縄本島の市町村の地域防災計画を探索・収集するスクリプト
"""

import csv
import json
import time
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import re
import os
from pathlib import Path

class DisasterPlanDiscoverer:
    def __init__(self, municipalities_csv="data/registry/okinawa_municipalities.csv"):
        self.municipalities_csv = municipalities_csv
        self.municipalities = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # 防災計画関連キーワード
        self.keywords = [
            "地域防災計画", "防災計画", "災害対策", "避難所", "避難場所",
            "緊急避難", "指定避難所", "津波避難", "洪水", "土砂災害"
        ]
        
        self.results = []
        
    def load_municipalities(self):
        """市町村リストを読み込み"""
        with open(self.municipalities_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.municipalities = list(reader)
        print(f"読み込み完了: {len(self.municipalities)} 市町村")
        
    def search_disaster_plan_page(self, municipality):
        """各市町村の防災計画ページを探索"""
        base_url = municipality['official_site_url']
        municipality_name = municipality['municipality_name']
        
        print(f"\n🔍 {municipality_name} の防災計画を探索中...")
        
        try:
            # まずはトップページを取得
            response = self.session.get(base_url, timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 防災関連リンクを探す
            disaster_links = self.find_disaster_links(soup, base_url)
            
            if disaster_links:
                print(f"  ✅ {len(disaster_links)} 件の防災関連ページを発見")
                for link in disaster_links:
                    self.results.append({
                        'municipality_id': municipality['municipality_id'],
                        'municipality_name': municipality_name,
                        'official_site_url': base_url,
                        'disaster_plan_url': link['url'],
                        'link_text': link['text'],
                        'discovery_method': 'homepage_link'
                    })
            else:
                # サイト内検索を試行
                search_results = self.try_site_search(base_url, municipality_name)
                if search_results:
                    self.results.extend(search_results)
                else:
                    print(f"  ❌ 防災計画が見つかりませんでした")
                    self.results.append({
                        'municipality_id': municipality['municipality_id'],
                        'municipality_name': municipality_name,
                        'official_site_url': base_url,
                        'disaster_plan_url': None,
                        'link_text': None,
                        'discovery_method': 'not_found'
                    })
                    
        except Exception as e:
            print(f"  ❌ エラー: {str(e)}")
            self.results.append({
                'municipality_id': municipality['municipality_id'],
                'municipality_name': municipality_name,
                'official_site_url': base_url,
                'disaster_plan_url': None,
                'link_text': f"Error: {str(e)}",
                'discovery_method': 'error'
            })
        
        # レート制限
        time.sleep(2)
        
    def find_disaster_links(self, soup, base_url):
        """防災関連リンクを抽出"""
        disaster_links = []
        
        # すべてのリンクをチェック
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            text = link.get_text(strip=True)
            
            # 防災関連キーワードを含むリンクを探す
            for keyword in self.keywords:
                if keyword in text or keyword in href:
                    full_url = urljoin(base_url, href)
                    disaster_links.append({
                        'url': full_url,
                        'text': text,
                        'keyword_matched': keyword
                    })
                    break
                    
        return disaster_links
        
    def try_site_search(self, base_url, municipality_name):
        """一般的な防災計画URLパターンを試行"""
        common_paths = [
            '/bosai/', '/disaster/', '/bousai/', '/防災/',
            '/kikikanri/', '/anzen/', '/saigai/',
            '/kurashi/bosai/', '/kurashi/anzen/'
        ]
        
        results = []
        for path in common_paths:
            try:
                test_url = base_url.rstrip('/') + path
                response = self.session.head(test_url, timeout=5)
                if response.status_code == 200:
                    print(f"  ✅ 推測URL発見: {test_url}")
                    results.append({
                        'municipality_id': None,
                        'municipality_name': municipality_name,
                        'official_site_url': base_url,
                        'disaster_plan_url': test_url,
                        'link_text': f"推測パス: {path}",
                        'discovery_method': 'path_guessing'
                    })
            except:
                continue
                
        return results
        
    def save_results(self):
        """結果を保存"""
        output_file = "data/registry/disaster_plan_urls.csv"
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['municipality_id', 'municipality_name', 'official_site_url', 
                         'disaster_plan_url', 'link_text', 'discovery_method']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.results)
            
        print(f"\n💾 結果を保存: {output_file}")
        print(f"総件数: {len(self.results)} 件")
        
        # 統計を表示
        found_count = sum(1 for r in self.results if r['disaster_plan_url'] is not None)
        print(f"発見成功: {found_count} 件 ({found_count/len(self.results)*100:.1f}%)")
        
    def run(self):
        """メイン実行"""
        print("🚀 沖縄本島市町村 防災計画探索を開始")
        
        self.load_municipalities()
        
        for municipality in self.municipalities:
            self.search_disaster_plan_page(municipality)
            
        self.save_results()
        print("✅ 探索完了")

if __name__ == "__main__":
    discoverer = DisasterPlanDiscoverer()
    discoverer.run()