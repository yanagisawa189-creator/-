#!/usr/bin/env python3
"""
営業リスト自動生成エージェント - 実行例
"""

import asyncio
import os
import sys

# src ディレクトリをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from main import SalesLeadGenerator

async def run_example():
    """
    実行例のデモンストレーション
    """
    print("🚀 営業リスト自動生成エージェント - 実行例")
    print("=" * 50)

    # 設定確認
    from config.config import config

    if not config.claude.api_key:
        print("❌ エラー: ANTHROPIC_API_KEY が設定されていません")
        print("   .envファイルにAPIキーを設定してください")
        return

    if not config.search.google_api_key and not config.search.serpapi_key:
        print("❌ エラー: 検索APIキーが設定されていません")
        print("   GOOGLE_API_KEY または SERPAPI_KEY を.envファイルに設定してください")
        return

    # 実行例1: IT企業を東京都で検索
    print("\n📋 実行例1: IT企業（東京都）")
    print("-" * 30)

    generator = SalesLeadGenerator()

    try:
        result1 = await generator.generate_leads(
            industry="IT",
            location="東京都",
            additional_keywords=["システム開発", "WEB制作"],
            max_results=10,
            export_formats=["csv"],
            sync_to_crm=False
        )

        if result1["success"]:
            print(f"✅ 成功: {result1['leads_count']} 件のリードを生成")
            print(f"   高優先度: {result1['statistics'].get('high_priority_leads', 0)} 件")

            if result1.get('top_leads'):
                print("\n🎯 上位3件:")
                for i, lead in enumerate(result1['top_leads'][:3], 1):
                    print(f"   {i}. {lead['company_name']} (スコア: {lead['total_score']:.1f})")
        else:
            print(f"❌ エラー: {result1['error']}")

    except Exception as e:
        print(f"❌ 実行エラー: {e}")

    # 実行例2: 飲食業を大阪府で検索
    print("\n📋 実行例2: 飲食業（大阪府）")
    print("-" * 30)

    try:
        result2 = await generator.generate_leads(
            industry="飲食業",
            location="大阪府",
            additional_keywords=["レストラン", "カフェ"],
            max_results=5,
            export_formats=["csv"],
            sync_to_crm=False
        )

        if result2["success"]:
            print(f"✅ 成功: {result2['leads_count']} 件のリードを生成")
            print(f"   中優先度: {result2['statistics'].get('medium_priority_leads', 0)} 件")
        else:
            print(f"❌ エラー: {result2['error']}")

    except Exception as e:
        print(f"❌ 実行エラー: {e}")

    print("\n🎉 実行例完了!")
    print("詳細な使用方法は README.md を参照してください。")

if __name__ == "__main__":
    # 環境変数の確認
    if not os.path.exists('.env'):
        print("⚠️  警告: .envファイルが見つかりません")
        print("   .env.exampleをコピーして.envを作成し、APIキーを設定してください")
        print()

    asyncio.run(run_example())