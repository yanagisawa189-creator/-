#!/usr/bin/env python3
"""
デモ用テストスクリプト - 実際のAPIを使わずに動作確認
"""

import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from models import SearchQuery, SearchResult, CompanyInfo, BusinessSize, ScoredLead

def demo_complete_flow():
    """完全なフローのデモンストレーション（モックデータ使用）"""

    print("営業リスト自動生成エージェント - デモンストレーション")
    print("=" * 60)

    # ステップ1: 検索クエリの作成
    print("\n[ステップ1] 検索クエリ作成")
    query = SearchQuery(
        industry="IT",
        location="東京都",
        additional_keywords=["システム開発", "WEB制作"]
    )
    print(f"検索キーワード: {query.to_search_string()}")

    # ステップ2: 模擬検索結果の生成
    print("\n[ステップ2] 検索実行（模擬）")
    search_results = [
        SearchResult(
            title="株式会社テクノロジーA - システム開発・WEB制作",
            url="https://techno-a.co.jp",
            snippet="東京都新宿区に本社を構えるシステム開発会社。WEB制作からモバイルアプリまで幅広く対応。",
            search_engine="google_mock",
            position=1
        ),
        SearchResult(
            title="株式会社ウェブソリューションズB",
            url="https://web-solutions-b.com",
            snippet="東京都渋谷区のWEB制作専門会社。EC サイト構築に強み。",
            search_engine="google_mock",
            position=2
        ),
        SearchResult(
            title="ITコンサルタント合同会社C",
            url="https://it-consulting-c.jp",
            snippet="ITコンサルティングとシステム開発を手がける。大手企業との取引実績多数。",
            search_engine="google_mock",
            position=3
        )
    ]
    print(f"検索結果: {len(search_results)} 件取得")

    # ステップ3: 会社情報の抽出（模擬）
    print("\n[ステップ3] 企業情報抽出（模擬）")
    companies = [
        CompanyInfo(
            company_name="株式会社テクノロジーA",
            url="https://techno-a.co.jp",
            location="東京都新宿区西新宿1-1-1",
            contact_email="info@techno-a.co.jp",
            phone="03-1234-5678",
            description="システム開発・WEB制作・モバイルアプリ開発を手がける技術企業。創業15年、従業員50名。",
            industry="システム開発・IT",
            business_size=BusinessSize.MEDIUM,
            additional_emails=["contact@techno-a.co.jp", "sales@techno-a.co.jp"],
            social_media={"twitter": "@techno_a", "linkedin": "techno-a"}
        ),
        CompanyInfo(
            company_name="株式会社ウェブソリューションズB",
            url="https://web-solutions-b.com",
            location="東京都渋谷区渋谷2-2-2",
            contact_email="inquiry@web-solutions-b.com",
            phone="03-2345-6789",
            description="WEB制作・ECサイト構築専門会社。デザインから開発まで一貫対応。",
            industry="WEB制作・デザイン",
            business_size=BusinessSize.SMALL,
            additional_emails=["support@web-solutions-b.com"],
            social_media={"facebook": "websolutionsb"}
        ),
        CompanyInfo(
            company_name="ITコンサルタント合同会社C",
            url="https://it-consulting-c.jp",
            location="東京都港区赤坂3-3-3",
            contact_email="contact@it-consulting-c.jp",
            phone="03-3456-7890",
            description="ITコンサルティング・システム開発・DXソリューション提供。大企業向け案件中心。",
            industry="ITコンサルティング",
            business_size=BusinessSize.LARGE,
            additional_emails=["info@it-consulting-c.jp", "business@it-consulting-c.jp"],
            social_media={"linkedin": "it-consulting-c"}
        )
    ]
    print(f"企業情報抽出: {len(companies)} 社")

    # ステップ4: スコアリング
    print("\n[ステップ4] スコアリング・優先度付け")
    from scorer import LeadScorer, ScoreAnalyzer

    scorer = LeadScorer()
    scored_leads = scorer.score_leads(companies, query)

    print(f"スコアリング完了: {len(scored_leads)} 件")

    # 結果表示
    print("\n[結果] 営業リード一覧（スコア順）")
    print("-" * 60)

    for i, lead in enumerate(scored_leads):
        priority = "★★★ 高優先度" if lead.total_score >= 8.0 else "★★　 中優先度" if lead.total_score >= 5.0 else "★　　 低優先度"

        print(f"{i+1}. {lead.company.company_name}")
        print(f"   {priority} (総合スコア: {lead.total_score:.2f})")
        print(f"   業種: {lead.company.industry}")
        print(f"   所在地: {lead.company.location}")
        print(f"   連絡先: {lead.company.contact_email}")
        print(f"   電話: {lead.company.phone}")
        print(f"   詳細スコア:")
        print(f"     - 業種一致度: {lead.scores.get('industry_match', 0):.2f}/5.0")
        print(f"     - 事業規模: {lead.scores.get('business_size', 0):.2f}/3.0")
        print(f"     - 連絡先充実度: {lead.scores.get('contact_info', 0):.2f}/2.0")
        print(f"     - 所在地一致度: {lead.scores.get('location_match', 0):.2f}/3.0")
        print(f"   信頼度: {lead.confidence:.2f}")
        print()

    # 統計情報
    print("[統計情報]")
    stats = ScoreAnalyzer.analyze_score_distribution(scored_leads)
    print(f"総リード数: {stats.get('total_leads', 0)}")
    print(f"高優先度リード: {stats.get('high_priority_leads', 0)} 件")
    print(f"中優先度リード: {stats.get('medium_priority_leads', 0)} 件")
    print(f"低優先度リード: {stats.get('low_priority_leads', 0)} 件")
    print(f"平均スコア: {stats.get('score_stats', {}).get('average', 0):.2f}")

    # 模擬出力
    print(f"\n[出力] ファイル出力（模擬）")
    print("✓ CSV出力: sales_leads_20240924_1430.csv")
    print("✓ Excel出力: sales_leads_20240924_1430.xlsx")
    print("✓ SQLite出力: sales_leads_20240924_1430.db")

    print(f"\n[連携] CRM連携（模擬）")
    print("✓ HubSpot: 3件の企業を作成")
    print("✓ Salesforce: 3件のリードを作成")

    print(f"\n{'-'*60}")
    print("デモンストレーション完了!")
    print("実際の使用には適切なAPIキーの設定が必要です。")

if __name__ == "__main__":
    demo_complete_flow()