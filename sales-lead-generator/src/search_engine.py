import asyncio
import aiohttp
import time
from typing import List, Optional
import logging

try:
    from googleapiclient.discovery import build
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False

try:
    from serpapi import GoogleSearch
    SERPAPI_AVAILABLE = True
except ImportError:
    SERPAPI_AVAILABLE = False

from config.config import config
from models import SearchQuery, SearchResult

logger = logging.getLogger(__name__)

class SearchEngine:
    def __init__(self):
        self.config = config.search
        self.google_service = None
        if GOOGLE_API_AVAILABLE and self.config.google_api_key and self.config.google_cse_id:
            self.google_service = build("customsearch", "v1", developerKey=self.config.google_api_key)

    async def search(self, query: SearchQuery) -> List[SearchResult]:
        """
        メインの検索関数。Google Custom Search APIとSerpAPIの両方を試行
        """
        results = []
        search_string = query.to_search_string()

        # Google Custom Search APIを優先
        if self.google_service:
            try:
                google_results = await self._search_google_custom(search_string)
                results.extend(google_results)
                logger.info(f"Google Custom Search returned {len(google_results)} results")
            except Exception as e:
                logger.warning(f"Google Custom Search failed: {e}")

        # Google Custom Searchが失敗した場合、またはSerpAPIキーが設定されている場合
        if SERPAPI_AVAILABLE and ((not results and self.config.serpapi_key) or self.config.serpapi_key):
            try:
                serp_results = await self._search_serpapi(search_string)
                results.extend(serp_results)
                logger.info(f"SerpAPI returned {len(serp_results)} results")
            except Exception as e:
                logger.warning(f"SerpAPI failed: {e}")

        # 検索間隔の制御
        await asyncio.sleep(self.config.search_delay)

        return results[:self.config.max_results_per_query]

    async def _search_google_custom(self, search_string: str) -> List[SearchResult]:
        """
        Google Custom Search APIを使用した検索
        """
        if not self.google_service:
            raise ValueError("Google Custom Search API not configured")

        # 同期的なAPIを非同期で実行
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self.google_service.cse().list(
                q=search_string,
                cx=self.config.google_cse_id,
                num=min(10, self.config.max_results_per_query)
            ).execute()
        )

        search_results = []
        if 'items' in result:
            for i, item in enumerate(result['items']):
                search_results.append(SearchResult(
                    title=item.get('title', ''),
                    url=item.get('link', ''),
                    snippet=item.get('snippet', ''),
                    search_engine='google_custom',
                    position=i + 1
                ))

        return search_results

    async def _search_serpapi(self, search_string: str) -> List[SearchResult]:
        """
        SerpAPIを使用した検索
        """
        if not SERPAPI_AVAILABLE:
            raise ValueError("SerpAPI not available")

        if not self.config.serpapi_key:
            raise ValueError("SerpAPI key not configured")

        search = GoogleSearch({
            "q": search_string,
            "api_key": self.config.serpapi_key,
            "num": min(10, self.config.max_results_per_query)
        })

        # 同期的なAPIを非同期で実行
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, search.get_dict)

        search_results = []
        if 'organic_results' in result:
            for i, item in enumerate(result['organic_results']):
                search_results.append(SearchResult(
                    title=item.get('title', ''),
                    url=item.get('link', ''),
                    snippet=item.get('snippet', ''),
                    search_engine='serpapi',
                    position=i + 1
                ))

        return search_results

class QueryBuilder:
    """
    効果的な検索クエリを構築するヘルパークラス
    """

    @staticmethod
    def build_industry_queries(industry: str, location: str) -> List[SearchQuery]:
        """
        業種に特化した検索クエリを生成
        """
        base_keywords = [
            "会社", "企業", "法人", "株式会社", "有限会社",
            "company", "corporation", "business"
        ]

        specific_keywords = {
            "IT": ["システム開発", "ソフトウェア", "WEB制作", "アプリ開発"],
            "製造業": ["製造", "工場", "メーカー", "生産"],
            "小売": ["販売", "店舗", "ショップ", "小売"],
            "飲食": ["レストラン", "カフェ", "居酒屋", "飲食店"],
            "建設": ["建設", "工事", "建築", "リフォーム"],
            "医療": ["病院", "クリニック", "医療", "歯科"],
            "教育": ["学校", "塾", "教育", "研修"]
        }

        queries = []
        industry_keywords = specific_keywords.get(industry, [industry])

        for keyword in industry_keywords:
            queries.append(SearchQuery(
                industry=keyword,
                location=location,
                additional_keywords=base_keywords[:2]
            ))

        return queries