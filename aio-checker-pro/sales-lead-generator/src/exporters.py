try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

import sqlite3
import csv
from typing import List, Dict, Optional
from datetime import datetime
import logging
import os

from config.config import config
from models import ScoredLead

logger = logging.getLogger(__name__)

class DataExporter:
    def __init__(self):
        self.config = config.output
        self.ensure_output_directory()

    def ensure_output_directory(self):
        """出力ディレクトリが存在することを確認"""
        if not os.path.exists(self.config.output_dir):
            os.makedirs(self.config.output_dir)

    async def export_all_formats(self, scored_leads: List[ScoredLead], search_info: Dict = None) -> Dict[str, str]:
        """
        全ての形式でエクスポート
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_results = {}

        # CSV形式でエクスポート
        csv_path = await self.export_to_csv(scored_leads, timestamp, search_info)
        if csv_path:
            export_results['csv'] = csv_path

        # Excel形式でエクスポート
        excel_path = await self.export_to_excel(scored_leads, timestamp, search_info)
        if excel_path:
            export_results['excel'] = excel_path

        # SQLite形式でエクスポート
        sqlite_path = await self.export_to_sqlite(scored_leads, timestamp, search_info)
        if sqlite_path:
            export_results['sqlite'] = sqlite_path

        return export_results

    async def export_to_csv(self, scored_leads: List[ScoredLead], timestamp: str = None, search_info: Dict = None) -> Optional[str]:
        """
        CSV形式でエクスポート
        """
        try:
            if not timestamp:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            filename = f"sales_leads_{timestamp}.csv"
            filepath = os.path.join(self.config.output_dir, filename)

            # データを辞書のリストに変換
            data = []
            for lead in scored_leads:
                row = lead.to_dict()
                # 日時情報を追加
                row['export_date'] = datetime.now().isoformat()
                if search_info:
                    row['search_industry'] = search_info.get('industry', '')
                    row['search_location'] = search_info.get('location', '')
                data.append(row)

            # CSVファイルに書き込み
            if data:
                if PANDAS_AVAILABLE:
                    df = pd.DataFrame(data)
                    df.to_csv(filepath, index=False, encoding='utf-8-sig')
                else:
                    # pandasが無い場合は標準CSVライブラリを使用
                    import csv
                    with open(filepath, 'w', newline='', encoding='utf-8-sig') as csvfile:
                        if data:
                            writer = csv.DictWriter(csvfile, fieldnames=data[0].keys())
                            writer.writeheader()
                            writer.writerows(data)

                logger.info(f"Exported {len(data)} leads to CSV: {filepath}")
                return filepath

        except Exception as e:
            logger.error(f"Error exporting to CSV: {e}")
            return None

    async def export_to_excel(self, scored_leads: List[ScoredLead], timestamp: str = None, search_info: Dict = None) -> Optional[str]:
        """
        Excel形式でエクスポート（複数シート）
        """
        if not PANDAS_AVAILABLE:
            logger.warning("Excel export requires pandas. Skipping Excel export.")
            return None

        try:
            if not timestamp:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            filename = f"sales_leads_{timestamp}.xlsx"
            filepath = os.path.join(self.config.output_dir, filename)

            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                # メインデータシート
                data = []
                for lead in scored_leads:
                    row = lead.to_dict()
                    row['export_date'] = datetime.now().isoformat()
                    if search_info:
                        row['search_industry'] = search_info.get('industry', '')
                        row['search_location'] = search_info.get('location', '')
                    data.append(row)

                if data:
                    df_main = pd.DataFrame(data)
                    df_main.to_excel(writer, sheet_name='Sales Leads', index=False)

                # 高優先度リードシート
                high_priority = [lead for lead in scored_leads if lead.total_score >= 8.0]
                if high_priority:
                    high_priority_data = [lead.to_dict() for lead in high_priority]
                    df_high = pd.DataFrame(high_priority_data)
                    df_high.to_excel(writer, sheet_name='High Priority', index=False)

                # 統計情報シート
                stats = self._generate_export_statistics(scored_leads, search_info)
                df_stats = pd.DataFrame(list(stats.items()), columns=['Metric', 'Value'])
                df_stats.to_excel(writer, sheet_name='Statistics', index=False)

            logger.info(f"Exported {len(data)} leads to Excel: {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Error exporting to Excel: {e}")
            return None

    async def export_to_sqlite(self, scored_leads: List[ScoredLead], timestamp: str = None, search_info: Dict = None) -> Optional[str]:
        """
        SQLite形式でエクスポート
        """
        try:
            if not timestamp:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            filename = f"sales_leads_{timestamp}.db"
            filepath = os.path.join(self.config.output_dir, filename)

            conn = sqlite3.connect(filepath)
            cursor = conn.cursor()

            # テーブル作成
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sales_leads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_name TEXT NOT NULL,
                    url TEXT,
                    location TEXT,
                    contact_email TEXT,
                    phone TEXT,
                    description TEXT,
                    industry TEXT,
                    business_size TEXT,
                    additional_emails TEXT,
                    social_media TEXT,
                    total_score REAL,
                    industry_match_score REAL,
                    business_size_score REAL,
                    contact_info_score REAL,
                    location_match_score REAL,
                    confidence REAL,
                    export_date TEXT,
                    search_industry TEXT,
                    search_location TEXT
                )
            ''')

            # データ挿入
            for lead in scored_leads:
                data = lead.to_dict()

                # JSON文字列に変換が必要なフィールド
                import json
                additional_emails_str = json.dumps(data.get('additional_emails', []))
                social_media_str = json.dumps(data.get('social_media', {}))

                cursor.execute('''
                    INSERT INTO sales_leads (
                        company_name, url, location, contact_email, phone,
                        description, industry, business_size, additional_emails,
                        social_media, total_score, industry_match_score,
                        business_size_score, contact_info_score, location_match_score,
                        confidence, export_date, search_industry, search_location
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    data.get('company_name', ''),
                    data.get('url', ''),
                    data.get('location', ''),
                    data.get('contact_email', ''),
                    data.get('phone', ''),
                    data.get('description', ''),
                    data.get('industry', ''),
                    data.get('business_size', ''),
                    additional_emails_str,
                    social_media_str,
                    data.get('total_score', 0),
                    data.get('industry_match_score', 0),
                    data.get('business_size_score', 0),
                    data.get('contact_info_score', 0),
                    data.get('location_match_score', 0),
                    data.get('confidence', 0),
                    datetime.now().isoformat(),
                    search_info.get('industry', '') if search_info else '',
                    search_info.get('location', '') if search_info else ''
                ))

            # 統計テーブル
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS export_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    export_date TEXT,
                    total_leads INTEGER,
                    high_priority_leads INTEGER,
                    medium_priority_leads INTEGER,
                    low_priority_leads INTEGER,
                    average_score REAL,
                    average_confidence REAL,
                    search_industry TEXT,
                    search_location TEXT
                )
            ''')

            # 統計データの挿入
            stats = self._generate_export_statistics(scored_leads, search_info)
            cursor.execute('''
                INSERT INTO export_stats (
                    export_date, total_leads, high_priority_leads,
                    medium_priority_leads, low_priority_leads,
                    average_score, average_confidence,
                    search_industry, search_location
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                datetime.now().isoformat(),
                stats.get('total_leads', 0),
                stats.get('high_priority_leads', 0),
                stats.get('medium_priority_leads', 0),
                stats.get('low_priority_leads', 0),
                stats.get('average_score', 0),
                stats.get('average_confidence', 0),
                search_info.get('industry', '') if search_info else '',
                search_info.get('location', '') if search_info else ''
            ))

            conn.commit()
            conn.close()

            logger.info(f"Exported {len(scored_leads)} leads to SQLite: {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Error exporting to SQLite: {e}")
            return None

    def _generate_export_statistics(self, scored_leads: List[ScoredLead], search_info: Dict = None) -> Dict:
        """
        エクスポート統計情報を生成
        """
        if not scored_leads:
            return {}

        scores = [lead.total_score for lead in scored_leads]
        confidences = [lead.confidence for lead in scored_leads]

        stats = {
            'export_date': datetime.now().isoformat(),
            'total_leads': len(scored_leads),
            'high_priority_leads': len([s for s in scores if s >= 8.0]),
            'medium_priority_leads': len([s for s in scores if 5.0 <= s < 8.0]),
            'low_priority_leads': len([s for s in scores if s < 5.0]),
            'average_score': sum(scores) / len(scores) if scores else 0,
            'max_score': max(scores) if scores else 0,
            'min_score': min(scores) if scores else 0,
            'average_confidence': sum(confidences) / len(confidences) if confidences else 0,
        }

        if search_info:
            stats.update({
                'search_industry': search_info.get('industry', ''),
                'search_location': search_info.get('location', ''),
                'search_keywords': ', '.join(search_info.get('additional_keywords', []))
            })

        return stats

class CSVTemplateGenerator:
    """
    CRM用のCSVテンプレート生成
    """

    @staticmethod
    def generate_hubspot_template(scored_leads: List[ScoredLead]):
        """
        HubSpot用のCSVテンプレートを生成
        """
        if not PANDAS_AVAILABLE:
            logger.warning("Template generation requires pandas")
            return None

        hubspot_data = []
        for lead in scored_leads:
            row = {
                'Company name': lead.company.company_name,
                'Company domain name': lead.company.url,
                'Phone number': lead.company.phone or '',
                'Address': lead.company.location or '',
                'City': '',  # location から抽出が必要
                'State/Region': '',  # location から抽出が必要
                'Industry': lead.company.industry or '',
                'Description': lead.company.description or '',
                'Lead Score': int(lead.total_score),
                'Lead Source': 'Sales Lead Generator',
            }
            hubspot_data.append(row)

        return pd.DataFrame(hubspot_data)

    @staticmethod
    def generate_salesforce_template(scored_leads: List[ScoredLead]):
        """
        Salesforce用のCSVテンプレートを生成
        """
        if not PANDAS_AVAILABLE:
            logger.warning("Template generation requires pandas")
            return None

        salesforce_data = []
        for lead in scored_leads:
            row = {
                'Company': lead.company.company_name,
                'Website': lead.company.url,
                'Phone': lead.company.phone or '',
                'Street': lead.company.location or '',
                'Industry': lead.company.industry or '',
                'Description': lead.company.description or '',
                'Rating': 'Hot' if lead.total_score >= 8.0 else 'Warm' if lead.total_score >= 5.0 else 'Cold',
                'Lead Source': 'Sales Lead Generator',
                'Status': 'New',
            }
            salesforce_data.append(row)

        return pd.DataFrame(salesforce_data)