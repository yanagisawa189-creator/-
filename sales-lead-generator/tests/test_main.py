"""
営業リスト自動生成エージェントのテストファイル
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import SalesLeadGenerator
from models import SearchQuery, SearchResult, CompanyInfo, BusinessSize, ScoredLead

class TestSalesLeadGenerator:

    @pytest.fixture
    def generator(self):
        return SalesLeadGenerator()

    @pytest.fixture
    def sample_search_query(self):
        return SearchQuery(
            industry="IT",
            location="東京都",
            additional_keywords=["システム開発", "WEB制作"]
        )

    @pytest.fixture
    def sample_search_results(self):
        return [
            SearchResult(
                title="株式会社サンプルIT",
                url="https://example-it.com",
                snippet="システム開発を行う企業",
                search_engine="google_custom",
                position=1
            ),
            SearchResult(
                title="サンプルWEB制作",
                url="https://example-web.com",
                snippet="WEB制作専門会社",
                search_engine="google_custom",
                position=2
            )
        ]

    @pytest.fixture
    def sample_company(self):
        return CompanyInfo(
            company_name="株式会社サンプルIT",
            url="https://example-it.com",
            location="東京都渋谷区",
            contact_email="info@example-it.com",
            phone="03-1234-5678",
            description="システム開発とWEB制作を行う企業",
            industry="IT・システム開発",
            business_size=BusinessSize.MEDIUM,
            additional_emails=["contact@example-it.com"],
            social_media={"twitter": "@example_it"}
        )

    def test_build_search_queries(self, generator):
        """検索クエリ構築のテスト"""
        queries = generator._build_search_queries(
            industry="IT",
            location="東京都",
            additional_keywords=["システム開発"]
        )

        assert len(queries) >= 1
        assert queries[0].industry == "IT"
        assert queries[0].location == "東京都"
        assert "システム開発" in queries[0].additional_keywords

    def test_deduplicate_search_results(self, generator, sample_search_results):
        """検索結果重複除去のテスト"""
        # 重複を追加
        duplicated_results = sample_search_results + [sample_search_results[0]]

        unique_results = generator._deduplicate_search_results(duplicated_results)

        assert len(unique_results) == 2
        urls = [result.url for result in unique_results]
        assert len(set(urls)) == len(urls)  # 全てユニーク

    @pytest.mark.asyncio
    async def test_generate_leads_success_flow(self, generator):
        """成功フローの統合テスト（モック使用）"""

        # モックの設定
        with patch.object(generator.search_engine, 'search', new_callable=AsyncMock) as mock_search, \
             patch.object(generator.claude_extractor, 'extract_company_info_batch', new_callable=AsyncMock) as mock_extract, \
             patch.object(generator.data_enhancer, 'enhance_companies', new_callable=AsyncMock) as mock_enhance, \
             patch.object(generator.exporter, 'export_to_csv', new_callable=AsyncMock) as mock_export_csv, \
             patch.object(generator.exporter, 'export_to_excel', new_callable=AsyncMock) as mock_export_excel:

            # モックの戻り値設定
            mock_search.return_value = [
                SearchResult("Test Company", "https://test.com", "Test snippet", "google_custom", 1)
            ]

            sample_company = CompanyInfo(
                company_name="Test Company",
                url="https://test.com",
                industry="IT",
                business_size=BusinessSize.SMALL
            )

            mock_extract.return_value = [sample_company]
            mock_enhance.return_value = [sample_company]
            mock_export_csv.return_value = "test.csv"
            mock_export_excel.return_value = "test.xlsx"

            # WebScraper のモック
            with patch('main.WebScraper') as mock_scraper_class:
                mock_scraper = AsyncMock()
                mock_scraper.scrape_urls.return_value = [{"url": "https://test.com", "content": "test content"}]
                mock_scraper_class.return_value.__aenter__.return_value = mock_scraper

                # テスト実行
                result = await generator.generate_leads(
                    industry="IT",
                    location="東京都",
                    max_results=10,
                    export_formats=["csv", "excel"]
                )

                # 結果検証
                assert result["success"] is True
                assert result["leads_count"] == 1
                assert "statistics" in result
                assert "export_results" in result

    @pytest.mark.asyncio
    async def test_generate_leads_no_search_results(self, generator):
        """検索結果なしの場合のテスト"""

        with patch.object(generator.search_engine, 'search', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = []

            result = await generator.generate_leads(
                industry="存在しない業種",
                location="存在しない場所"
            )

            assert result["success"] is False
            assert "No search results found" in result["error"]

    def test_search_query_to_string(self, sample_search_query):
        """SearchQuery の文字列変換テスト"""
        query_string = sample_search_query.to_search_string()
        assert "IT" in query_string
        assert "東京都" in query_string
        assert "システム開発" in query_string

class TestModels:

    @pytest.fixture
    def sample_company(self):
        return CompanyInfo(
            company_name="株式会社サンプルIT",
            url="https://example-it.com",
            location="東京都渋谷区",
            contact_email="info@example-it.com",
            phone="03-1234-5678",
            description="システム開発とWEB制作を行う企業",
            industry="IT・システム開発",
            business_size=BusinessSize.MEDIUM,
            additional_emails=["contact@example-it.com"],
            social_media={"twitter": "@example_it"}
        )

    def test_company_info_to_dict(self, sample_company):
        """CompanyInfo の辞書変換テスト"""
        data = sample_company.to_dict()

        assert data["company_name"] == "株式会社サンプルIT"
        assert data["url"] == "https://example-it.com"
        assert data["business_size"] == "medium"
        assert isinstance(data["additional_emails"], list)
        assert isinstance(data["social_media"], dict)

    def test_scored_lead_to_dict(self, sample_company):
        """ScoredLead の辞書変換テスト"""
        scores = {
            "industry_match": 4.5,
            "business_size": 3.0,
            "contact_info": 2.0,
            "location_match": 2.5
        }

        scored_lead = ScoredLead(
            company=sample_company,
            total_score=12.0,
            scores=scores,
            confidence=0.85
        )

        data = scored_lead.to_dict()

        assert data["total_score"] == 12.0
        assert data["confidence"] == 0.85
        assert data["industry_match_score"] == 4.5
        assert data["company_name"] == sample_company.company_name

if __name__ == "__main__":
    pytest.main([__file__, "-v"])