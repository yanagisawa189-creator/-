#!/usr/bin/env python3
"""
簡単なテストファイル - 営業リスト自動生成エージェント
"""

import sys
import os
import asyncio

# src ディレクトリをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from models import SearchQuery, SearchResult, CompanyInfo, BusinessSize, ScoredLead

def test_models():
    """データモデルのテスト"""
    print("データモデルテスト開始...")

    # SearchQuery テスト
    query = SearchQuery(
        industry="IT",
        location="東京都",
        additional_keywords=["システム開発", "WEB制作"]
    )
    print(f"OK SearchQuery 作成: {query.to_search_string()}")

    # SearchResult テスト
    result = SearchResult(
        title="テスト会社",
        url="https://example.com",
        snippet="テスト用の会社情報",
        search_engine="test",
        position=1
    )
    print(f"OK SearchResult 作成: {result.title}")

    # CompanyInfo テスト
    company = CompanyInfo(
        company_name="株式会社テスト",
        url="https://test.com",
        location="東京都渋谷区",
        contact_email="info@test.com",
        business_size=BusinessSize.SMALL
    )
    print(f"OK CompanyInfo 作成: {company.company_name}")
    print(f"   辞書変換: {len(company.to_dict())} 項目")

    # ScoredLead テスト
    scores = {
        "industry_match": 4.0,
        "business_size": 2.0,
        "contact_info": 1.5,
        "location_match": 3.0
    }
    lead = ScoredLead(
        company=company,
        total_score=10.5,
        scores=scores,
        confidence=0.8
    )
    print(f"OK ScoredLead 作成: スコア {lead.total_score}, 信頼度 {lead.confidence}")

    print("OK 全てのモデルテスト完了!\n")

def test_config():
    """設定のテスト"""
    print("設定テスト開始...")

    try:
        from config.config import config
        print(f"OK 設定読み込み成功")
        print(f"   スクレイピング設定: timeout={config.scraping.request_timeout}s")
        print(f"   スコアリング設定: max_score={config.scoring.max_score}")
        print(f"   出力設定: output_dir={config.output.output_dir}")

        # APIキーの確認（値は表示しない）
        has_claude_key = bool(config.claude.api_key)
        has_google_key = bool(config.search.google_api_key)
        has_serp_key = bool(config.search.serpapi_key)

        print(f"   Claude APIキー: {'OK 設定済み' if has_claude_key else 'NG 未設定'}")
        print(f"   Google APIキー: {'OK 設定済み' if has_google_key else 'NG 未設定'}")
        print(f"   SerpAPIキー: {'OK 設定済み' if has_serp_key else 'NG 未設定'}")

    except Exception as e:
        print(f"NG 設定読み込みエラー: {e}")

    print("OK 設定テスト完了!\n")

def test_scorer():
    """スコアラーのテスト"""
    print("スコアラーテスト開始...")

    try:
        from scorer import LeadScorer, ScoreAnalyzer
        from models import SearchQuery

        scorer = LeadScorer()

        # テスト用会社データ
        companies = [
            CompanyInfo(
                company_name="IT株式会社A",
                url="https://it-a.com",
                location="東京都新宿区",
                contact_email="info@it-a.com",
                industry="システム開発・IT",
                business_size=BusinessSize.MEDIUM
            ),
            CompanyInfo(
                company_name="WEB制作B",
                url="https://web-b.com",
                location="東京都渋谷区",
                contact_email="contact@web-b.com",
                industry="WEB制作・デザイン",
                business_size=BusinessSize.SMALL
            )
        ]

        # スコアリング実行
        search_query = SearchQuery(
            industry="IT",
            location="東京都",
            additional_keywords=["システム開発"]
        )

        scored_leads = scorer.score_leads(companies, search_query)

        print(f"OK スコアリング完了: {len(scored_leads)} 件")

        for i, lead in enumerate(scored_leads):
            print(f"   {i+1}. {lead.company.company_name}")
            print(f"      総合スコア: {lead.total_score:.2f}")
            print(f"      信頼度: {lead.confidence:.2f}")

        # 統計分析
        stats = ScoreAnalyzer.analyze_score_distribution(scored_leads)
        print(f"   統計: 高優先度={stats.get('high_priority_leads', 0)}, "
              f"中優先度={stats.get('medium_priority_leads', 0)}, "
              f"低優先度={stats.get('low_priority_leads', 0)}")

    except Exception as e:
        print(f"NG スコアラーテストエラー: {e}")

    print("OK スコアラーテスト完了!\n")

async def test_basic_flow():
    """基本的なフロー（モック使用）のテスト"""
    print("基本フローテスト開始...")

    try:
        # モックデータを使った簡単なフロー
        search_results = [
            SearchResult("会社A", "https://a.com", "会社Aの説明", "test", 1),
            SearchResult("会社B", "https://b.com", "会社Bの説明", "test", 2)
        ]
        print(f"OK モック検索結果: {len(search_results)} 件")

        # 重複除去テスト
        from main import SalesLeadGenerator
        generator = SalesLeadGenerator()

        unique_results = generator._deduplicate_search_results(search_results + search_results[:1])
        print(f"OK 重複除去: {len(unique_results)} 件（元: {len(search_results) + 1}）")

        # クエリ構築テスト
        queries = generator._build_search_queries("IT", "東京都", ["システム"])
        print(f"OK クエリ構築: {len(queries)} 個のクエリ")

    except Exception as e:
        print(f"NG 基本フローテストエラー: {e}")

    print("OK 基本フローテスト完了!\n")

def main():
    """メインテスト実行"""
    print("営業リスト自動生成エージェント - 簡単テスト")
    print("=" * 60)

    # 基本テスト実行
    test_models()
    test_config()
    test_scorer()

    # 非同期テスト実行
    asyncio.run(test_basic_flow())

    print("全てのテスト完了!")
    print("注意: このテストは基本機能のみをテストします。")
    print("実際のAPI呼び出しはAPIキーが必要です。")

if __name__ == "__main__":
    main()