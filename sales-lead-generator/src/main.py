#!/usr/bin/env python3
"""
営業リスト自動生成エージェント - メインエントリーポイント
"""

import asyncio
import argparse
import logging
import sys
from typing import Dict, List
from datetime import datetime

from config.config import config
from models import SearchQuery
from search_engine import SearchEngine, QueryBuilder
from scraper import WebScraper
from claude_extractor import ClaudeExtractor
from data_enhancer import DataEnhancer
from scorer import LeadScorer, ScoreAnalyzer
from exporters import DataExporter, CSVTemplateGenerator
from crm_integrations import CRMIntegrationManager
from history_manager import HistoryManager

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sales_lead_generator.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class SalesLeadGenerator:
    def __init__(self):
        self.search_engine = SearchEngine()
        self.claude_extractor = ClaudeExtractor()
        self.data_enhancer = DataEnhancer()
        self.scorer = LeadScorer()
        self.exporter = DataExporter()
        self.crm_manager = CRMIntegrationManager()
        self.history_manager = HistoryManager()

    async def generate_leads(
        self,
        industry: str,
        location: str,
        additional_keywords: List[str] = None,
        max_results: int = None,
        export_formats: List[str] = None,
        sync_to_crm: bool = False,
        wordpress_only: bool = False,
        exclude_history: bool = True
    ) -> Dict:
        """
        営業リードを生成するメイン処理
        """
        logger.info(f"Starting lead generation for industry: {industry}, location: {location}")

        try:
            # ステップ1: 検索クエリの構築
            search_queries = self._build_search_queries(industry, location, additional_keywords)
            logger.info(f"Generated {len(search_queries)} search queries")

            # ステップ2: 検索実行
            all_search_results = []
            for query in search_queries:
                search_results = await self.search_engine.search(query)
                all_search_results.extend(search_results)
                logger.info(f"Query '{query.to_search_string()}' returned {len(search_results)} results")

            if not all_search_results:
                logger.warning("No search results found")
                return {"error": "No search results found", "success": False}

            # 重複を除去
            unique_results = self._deduplicate_search_results(all_search_results)
            logger.info(f"After deduplication: {len(unique_results)} unique results")

            # 結果数を制限
            if max_results and len(unique_results) > max_results:
                unique_results = unique_results[:max_results]
                logger.info(f"Limited to {max_results} results")

            # ステップ3: ウェブスクレイピング
            logger.info("Starting web scraping...")
            async with WebScraper() as scraper:
                scraped_data = await scraper.scrape_urls(unique_results)

            logger.info(f"Successfully scraped {len(scraped_data)} pages")

            # WordPressフィルタリング（指定時のみ）
            if wordpress_only:
                wordpress_data = [data for data in scraped_data if data.get('is_wordpress', False)]
                logger.info(f"WordPress filtering: {len(wordpress_data)} WordPress sites found out of {len(scraped_data)} total")
                scraped_data = wordpress_data

            if not scraped_data:
                error_msg = "No WordPress sites found" if wordpress_only else "No data could be scraped"
                logger.warning(error_msg)
                return {"error": error_msg, "success": False}

            # ステップ4: Claude による情報抽出
            logger.info("Starting Claude extraction...")
            companies = await self.claude_extractor.extract_company_info_batch(scraped_data)
            logger.info(f"Extracted information for {len(companies)} companies")

            if not companies:
                logger.warning("No company information extracted")
                return {"error": "No company information extracted", "success": False}

            # ステップ5: 履歴との重複チェック（オプション）
            if exclude_history:
                logger.info("Checking against history...")
                original_count = len(companies)
                companies = self.history_manager.filter_new_companies(companies)
                filtered_count = original_count - len(companies)
                logger.info(f"Filtered out {filtered_count} duplicate companies from history")

                if not companies:
                    logger.warning("All companies were duplicates from history")
                    return {"error": "すべての企業が履歴に存在します。新しい企業が見つかりませんでした。", "success": False}

            # ステップ6: データ拡張
            logger.info("Enhancing company data...")
            enhanced_companies = await self.data_enhancer.enhance_companies(companies)
            logger.info(f"Enhanced {len(enhanced_companies)} companies")

            # ステップ7: スコアリング
            logger.info("Scoring leads...")
            search_query = search_queries[0]  # 最初のクエリを代表として使用
            scored_leads = self.scorer.score_leads(enhanced_companies, search_query)
            logger.info(f"Scored {len(scored_leads)} leads")

            # ステップ8: 履歴に追加
            search_query_str = f"{industry} {location}"
            if additional_keywords:
                search_query_str += " " + " ".join(additional_keywords)
            added_count = self.history_manager.add_companies(enhanced_companies, search_query_str)
            logger.info(f"Added {added_count} new companies to history")

            # 統計情報生成
            stats = ScoreAnalyzer.analyze_score_distribution(scored_leads)
            logger.info(f"Statistics: {stats}")

            # ステップ9: エクスポート
            search_info = {
                "industry": industry,
                "location": location,
                "additional_keywords": additional_keywords or []
            }

            export_results = {}
            if not export_formats:
                export_formats = ['csv', 'excel']

            if 'csv' in export_formats or 'all' in export_formats:
                csv_path = await self.exporter.export_to_csv(scored_leads, search_info=search_info)
                if csv_path:
                    export_results['csv'] = csv_path

            if 'excel' in export_formats or 'all' in export_formats:
                excel_path = await self.exporter.export_to_excel(scored_leads, search_info=search_info)
                if excel_path:
                    export_results['excel'] = excel_path

            if 'sqlite' in export_formats or 'all' in export_formats:
                sqlite_path = await self.exporter.export_to_sqlite(scored_leads, search_info=search_info)
                if sqlite_path:
                    export_results['sqlite'] = sqlite_path

            logger.info(f"Exported to: {list(export_results.keys())}")

            # ステップ10: CRM連携（オプション）
            crm_results = {}
            if sync_to_crm:
                logger.info("Syncing to CRM systems...")
                crm_results = await self.crm_manager.sync_to_all_crms(scored_leads)
                logger.info(f"CRM sync results: {crm_results}")

            # 結果の集約
            result = {
                "success": True,
                "timestamp": datetime.now().isoformat(),
                "search_info": search_info,
                "statistics": stats,
                "leads_count": len(scored_leads),
                "top_leads": [lead.to_dict() for lead in ScoreAnalyzer.get_top_leads(scored_leads, 10)],
                "export_results": export_results,
                "crm_results": crm_results
            }

            logger.info("Lead generation completed successfully")
            return result

        except Exception as e:
            logger.error(f"Error in lead generation: {e}", exc_info=True)
            return {"error": str(e), "success": False}

    def _build_search_queries(self, industry: str, location: str, additional_keywords: List[str] = None) -> List[SearchQuery]:
        """
        検索クエリを構築
        """
        queries = []

        # 基本クエリ
        base_query = SearchQuery(
            industry=industry,
            location=location,
            additional_keywords=additional_keywords or []
        )
        queries.append(base_query)

        # 業種特化クエリ
        industry_queries = QueryBuilder.build_industry_queries(industry, location)
        queries.extend(industry_queries[:3])  # 最大3つの追加クエリ

        return queries

    def _deduplicate_search_results(self, search_results):
        """
        検索結果の重複を除去
        """
        seen_urls = set()
        unique_results = []

        for result in search_results:
            if result.url not in seen_urls:
                seen_urls.add(result.url)
                unique_results.append(result)

        return unique_results

async def main():
    """
    コマンドライン実行のメイン関数
    """
    parser = argparse.ArgumentParser(description="営業リスト自動生成エージェント")

    parser.add_argument("--industry", "-i", required=True, help="対象業種")
    parser.add_argument("--location", "-l", required=True, help="対象エリア")
    parser.add_argument("--keywords", "-k", nargs="*", help="追加キーワード")
    parser.add_argument("--max-results", "-m", type=int, default=50, help="最大結果数")
    parser.add_argument("--export", "-e", nargs="*", choices=["csv", "excel", "sqlite", "all"],
                      default=["csv", "excel"], help="エクスポート形式")
    parser.add_argument("--sync-crm", action="store_true", help="CRMに同期")
    parser.add_argument("--verbose", "-v", action="store_true", help="詳細ログ")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # 設定チェック
    required_configs = []
    if not config.claude.api_key:
        required_configs.append("ANTHROPIC_API_KEY")
    if not config.search.google_api_key and not config.search.serpapi_key:
        required_configs.append("GOOGLE_API_KEY or SERPAPI_KEY")

    if required_configs:
        logger.error(f"Required configuration missing: {', '.join(required_configs)}")
        print(f"エラー: 必要な設定が不足しています: {', '.join(required_configs)}")
        print("詳細は.env.exampleファイルを参照してください。")
        sys.exit(1)

    # 実行
    generator = SalesLeadGenerator()
    result = await generator.generate_leads(
        industry=args.industry,
        location=args.location,
        additional_keywords=args.keywords,
        max_results=args.max_results,
        export_formats=args.export,
        sync_to_crm=args.sync_crm
    )

    # 結果出力
    if result["success"]:
        print(f"\n✅ 営業リスト生成が完了しました！")
        print(f"   生成されたリード数: {result['leads_count']}")
        print(f"   高優先度リード: {result['statistics'].get('high_priority_leads', 0)}")
        print(f"   中優先度リード: {result['statistics'].get('medium_priority_leads', 0)}")
        print(f"   低優先度リード: {result['statistics'].get('low_priority_leads', 0)}")

        if result.get('export_results'):
            print(f"\n📁 エクスポートファイル:")
            for format_type, filepath in result['export_results'].items():
                print(f"   {format_type.upper()}: {filepath}")

        if result.get('crm_results'):
            print(f"\n🔄 CRM同期結果:")
            for crm_name, crm_result in result['crm_results'].items():
                if crm_result.get('success'):
                    print(f"   {crm_name}: {crm_result.get('created', 0)} 件作成")
                else:
                    print(f"   {crm_name}: エラー")

        print(f"\n🎯 上位5件のリード:")
        for i, lead in enumerate(result['top_leads'][:5], 1):
            print(f"   {i}. {lead['company_name']} (スコア: {lead['total_score']:.1f})")
    else:
        print(f"\n❌ エラーが発生しました: {result['error']}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())