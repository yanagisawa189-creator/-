#!/usr/bin/env python3
"""
履歴管理モジュール - 過去に生成した企業を記録・管理
"""

import sqlite3
import json
from typing import List, Dict, Optional, Set
from datetime import datetime
from pathlib import Path
import logging

from models import CompanyInfo, ScoredLead

logger = logging.getLogger(__name__)

class HistoryManager:
    """生成履歴を管理するクラス"""

    def __init__(self, db_path: str = None):
        if db_path is None:
            # デフォルトパスはdataディレクトリ内
            db_path = Path(__file__).parent.parent / "data" / "history.db"

        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        """データベースを初期化"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS company_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_name TEXT NOT NULL,
                    url TEXT NOT NULL UNIQUE,
                    domain TEXT NOT NULL,
                    location TEXT,
                    industry TEXT,
                    contact_email TEXT,
                    phone TEXT,
                    search_query TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_domain ON company_history(domain)
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_created_at ON company_history(created_at)
            """)

            conn.commit()

    def add_companies(self, companies: List[CompanyInfo], search_query: str = "") -> int:
        """
        企業リストを履歴に追加

        Returns:
            追加された件数
        """
        added_count = 0

        with sqlite3.connect(self.db_path) as conn:
            for company in companies:
                try:
                    domain = self._extract_domain(company.url)

                    metadata = {
                        'description': company.description,
                        'business_size': company.business_size.value if company.business_size else None,
                        'additional_emails': company.additional_emails or [],
                        'social_media': company.social_media or {}
                    }

                    conn.execute("""
                        INSERT OR IGNORE INTO company_history
                        (company_name, url, domain, location, industry, contact_email, phone, search_query, metadata)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        company.company_name,
                        company.url,
                        domain,
                        company.location,
                        company.industry,
                        company.contact_email,
                        company.phone,
                        search_query,
                        json.dumps(metadata, ensure_ascii=False)
                    ))

                    if conn.total_changes > 0:
                        added_count += 1

                except Exception as e:
                    logger.error(f"Error adding company {company.company_name} to history: {e}")

            conn.commit()

        logger.info(f"Added {added_count} companies to history")
        return added_count

    def get_existing_urls(self) -> Set[str]:
        """
        既存のURL一覧を取得

        Returns:
            URLのセット
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT url FROM company_history")
            return {row[0] for row in cursor.fetchall()}

    def get_existing_domains(self) -> Set[str]:
        """
        既存のドメイン一覧を取得

        Returns:
            ドメインのセット
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT DISTINCT domain FROM company_history")
            return {row[0] for row in cursor.fetchall()}

    def filter_new_companies(self, companies: List[CompanyInfo]) -> List[CompanyInfo]:
        """
        既存履歴と照合して新しい企業のみをフィルタリング

        Args:
            companies: フィルタリング対象の企業リスト

        Returns:
            履歴にない新しい企業のリスト
        """
        existing_urls = self.get_existing_urls()
        existing_domains = self.get_existing_domains()

        new_companies = []
        duplicate_count = 0

        for company in companies:
            # URL完全一致チェック
            if company.url in existing_urls:
                duplicate_count += 1
                logger.debug(f"Duplicate URL skipped: {company.url}")
                continue

            # ドメインチェック（同じ会社の別ページを除外）
            domain = self._extract_domain(company.url)
            if domain in existing_domains:
                duplicate_count += 1
                logger.debug(f"Duplicate domain skipped: {domain}")
                continue

            new_companies.append(company)

        logger.info(f"Filtered: {len(new_companies)} new companies, {duplicate_count} duplicates removed")
        return new_companies

    def get_history(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """
        履歴を取得

        Args:
            limit: 取得件数
            offset: オフセット

        Returns:
            履歴データのリスト
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM company_history
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))

            history = []
            for row in cursor.fetchall():
                item = dict(row)
                if item['metadata']:
                    item['metadata'] = json.loads(item['metadata'])
                history.append(item)

            return history

    def get_history_count(self) -> int:
        """履歴の総件数を取得"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM company_history")
            return cursor.fetchone()[0]

    def delete_by_url(self, url: str) -> bool:
        """
        URLで履歴を削除

        Returns:
            削除成功時True
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("DELETE FROM company_history WHERE url = ?", (url,))
            conn.commit()
            return cursor.rowcount > 0

    def delete_by_domain(self, domain: str) -> int:
        """
        ドメインで履歴を削除

        Returns:
            削除件数
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("DELETE FROM company_history WHERE domain = ?", (domain,))
            conn.commit()
            return cursor.rowcount

    def clear_all(self) -> int:
        """
        全履歴を削除

        Returns:
            削除件数
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("DELETE FROM company_history")
            conn.commit()
            return cursor.rowcount

    def search_history(self, query: str) -> List[Dict]:
        """
        履歴を検索

        Args:
            query: 検索キーワード

        Returns:
            マッチした履歴のリスト
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM company_history
                WHERE company_name LIKE ?
                   OR url LIKE ?
                   OR industry LIKE ?
                   OR location LIKE ?
                ORDER BY created_at DESC
            """, (f"%{query}%", f"%{query}%", f"%{query}%", f"%{query}%"))

            results = []
            for row in cursor.fetchall():
                item = dict(row)
                if item['metadata']:
                    item['metadata'] = json.loads(item['metadata'])
                results.append(item)

            return results

    @staticmethod
    def _extract_domain(url: str) -> str:
        """URLからドメインを抽出"""
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        # www. を除去
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain

    def get_statistics(self) -> Dict:
        """
        履歴の統計情報を取得

        Returns:
            統計情報の辞書
        """
        with sqlite3.connect(self.db_path) as conn:
            # 総件数
            total_count = conn.execute("SELECT COUNT(*) FROM company_history").fetchone()[0]

            # 業種別件数 Top 10
            industry_stats = conn.execute("""
                SELECT industry, COUNT(*) as count
                FROM company_history
                WHERE industry IS NOT NULL AND industry != ''
                GROUP BY industry
                ORDER BY count DESC
                LIMIT 10
            """).fetchall()

            # 地域別件数 Top 10
            location_stats = conn.execute("""
                SELECT location, COUNT(*) as count
                FROM company_history
                WHERE location IS NOT NULL AND location != ''
                GROUP BY location
                ORDER BY count DESC
                LIMIT 10
            """).fetchall()

            # 最近の追加日
            last_added = conn.execute("""
                SELECT created_at FROM company_history
                ORDER BY created_at DESC LIMIT 1
            """).fetchone()

            return {
                'total_count': total_count,
                'top_industries': [{'industry': i[0], 'count': i[1]} for i in industry_stats],
                'top_locations': [{'location': l[0], 'count': l[1]} for l in location_stats],
                'last_added': last_added[0] if last_added else None
            }
