import asyncio
import re
from typing import List, Dict, Optional, Set
from urllib.parse import urlparse
import tldextract
import logging

from scraper import WebScraper
from models import CompanyInfo
from claude_extractor import ClaudeExtractor

logger = logging.getLogger(__name__)

class DataEnhancer:
    def __init__(self):
        self.claude_extractor = ClaudeExtractor()
        self.common_email_prefixes = [
            'info', 'contact', 'inquiry', 'support', 'sales', 'hello',
            'admin', 'office', 'general', 'mail', 'ask'
        ]

    async def enhance_companies(self, companies: List[CompanyInfo]) -> List[CompanyInfo]:
        """
        会社情報を一括で強化する
        """
        enhanced_companies = []

        for company in companies:
            try:
                # メールアドレスの推定・補完
                company = await self._enhance_email_addresses(company)

                # 追加ページのクロール
                company = await self._crawl_additional_pages(company)

                enhanced_companies.append(company)

            except Exception as e:
                logger.error(f"Error enhancing company {company.company_name}: {e}")
                enhanced_companies.append(company)  # 元の情報を保持

        return enhanced_companies

    async def _enhance_email_addresses(self, company: CompanyInfo) -> CompanyInfo:
        """
        ドメインから推定メールアドレスを生成
        """
        if not company.url:
            return company

        try:
            # ドメインを抽出
            domain = self._extract_domain(company.url)
            if not domain:
                return company

            # 既存のメールアドレスを収集
            existing_emails = set()
            if company.contact_email:
                existing_emails.add(company.contact_email.lower())
            if company.additional_emails:
                existing_emails.update([email.lower() for email in company.additional_emails])

            # 推定メールアドレスを生成
            generated_emails = self._generate_email_addresses(domain)

            # 重複を除いて既存のリストに追加
            new_emails = []
            for email in generated_emails:
                if email.lower() not in existing_emails:
                    new_emails.append(email)

            # メインの連絡先メールが未設定の場合、最も適切なものを選択
            if not company.contact_email and new_emails:
                company.contact_email = new_emails[0]
                new_emails = new_emails[1:]

            # 追加メールアドレスを更新
            if company.additional_emails:
                company.additional_emails.extend(new_emails)
            else:
                company.additional_emails = new_emails

            return company

        except Exception as e:
            logger.error(f"Error enhancing email for {company.company_name}: {e}")
            return company

    def _extract_domain(self, url: str) -> Optional[str]:
        """
        URLからドメインを抽出
        """
        try:
            extracted = tldextract.extract(url)
            if extracted.domain and extracted.suffix:
                return f"{extracted.domain}.{extracted.suffix}"
        except:
            pass
        return None

    def _generate_email_addresses(self, domain: str) -> List[str]:
        """
        ドメインから一般的なメールアドレスを生成
        """
        emails = []
        for prefix in self.common_email_prefixes:
            emails.append(f"{prefix}@{domain}")
        return emails

    async def _crawl_additional_pages(self, company: CompanyInfo) -> CompanyInfo:
        """
        会社の追加ページをクロールして情報を補完
        """
        if not company.url:
            return company

        try:
            # 追加でクロールするページのパスを生成
            additional_paths = self._generate_additional_paths()
            base_url = self._get_base_url(company.url)

            additional_urls = [f"{base_url.rstrip('/')}/{path}" for path in additional_paths]

            async with WebScraper() as scraper:
                # 追加ページをクロール
                additional_data = await self._crawl_specific_urls(scraper, additional_urls)

                if additional_data:
                    # Claudeで追加情報を統合
                    company = await self._integrate_additional_data(company, additional_data)

            return company

        except Exception as e:
            logger.error(f"Error crawling additional pages for {company.company_name}: {e}")
            return company

    def _generate_additional_paths(self) -> List[str]:
        """
        追加でクロールするページのパスを生成
        """
        return [
            'about', 'about-us', 'company', 'profile', 'overview',
            'contact', 'contact-us', 'inquiry', 'info',
            'recruit', 'careers', 'jobs', 'hiring',
            'service', 'services', 'business', 'products',
            'news', 'information', 'ir'
        ]

    def _get_base_url(self, url: str) -> str:
        """
        ベースURLを取得
        """
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"

    async def _crawl_specific_urls(self, scraper: WebScraper, urls: List[str]) -> str:
        """
        特定のURLリストをクロールして合成データを返す
        """
        try:
            # SearchResult オブジェクトを作成（WebScraperのインターフェースに合わせるため）
            from models import SearchResult
            search_results = [
                SearchResult(title="", url=url, snippet="", search_engine="direct", position=i+1)
                for i, url in enumerate(urls)
            ]

            scraped_data = await scraper.scrape_urls(search_results[:5])  # 最大5ページ

            # 全てのコンテンツを結合
            combined_content = ""
            for data in scraped_data:
                if data.get('content'):
                    combined_content += f"\n--- {data.get('url')} ---\n"
                    combined_content += data['content'][:500]  # 各ページ500文字まで

            return combined_content[:3000]  # 全体で3000文字まで

        except Exception as e:
            logger.error(f"Error crawling specific URLs: {e}")
            return ""

    async def _integrate_additional_data(self, company: CompanyInfo, additional_data: str) -> CompanyInfo:
        """
        追加データを既存の会社情報に統合
        """
        if not additional_data.strip():
            return company

        try:
            enhanced_company = await self.claude_extractor.enhance_company_info(company, additional_data)
            return enhanced_company
        except Exception as e:
            logger.error(f"Error integrating additional data: {e}")
            return company

class DomainAnalyzer:
    """
    ドメイン分析を行うヘルパークラス
    """

    @staticmethod
    def analyze_domain_reputation(domain: str) -> Dict[str, any]:
        """
        ドメインの信頼性を分析
        """
        analysis = {
            'is_corporate': False,
            'domain_age_score': 0.5,  # 推定値（実際の実装では外部APIを使用）
            'tld_reputation': 0.5
        }

        # 企業ドメインの特徴を判定
        corporate_indicators = [
            'co.jp', 'corp', 'inc', 'ltd', 'llc', 'company'
        ]

        domain_lower = domain.lower()
        if any(indicator in domain_lower for indicator in corporate_indicators):
            analysis['is_corporate'] = True

        # TLD（トップレベルドメイン）の評価
        high_reputation_tlds = ['.com', '.co.jp', '.jp', '.org', '.net']
        extracted = tldextract.extract(domain)
        full_tld = f".{extracted.suffix}"

        if full_tld in high_reputation_tlds:
            analysis['tld_reputation'] = 0.8
        elif full_tld == '.co.jp':
            analysis['tld_reputation'] = 1.0

        return analysis

    @staticmethod
    def extract_company_name_from_domain(domain: str) -> str:
        """
        ドメインから会社名を推定
        """
        extracted = tldextract.extract(domain)
        company_name = extracted.domain

        # 一般的な接頭辞・接尾辞を除去
        prefixes_to_remove = ['www', 'web', 'site']
        suffixes_to_remove = ['corp', 'inc', 'co', 'ltd', 'llc']

        for prefix in prefixes_to_remove:
            if company_name.startswith(prefix):
                company_name = company_name[len(prefix):]

        for suffix in suffixes_to_remove:
            if company_name.endswith(suffix):
                company_name = company_name[:-len(suffix)]

        return company_name.strip('-_').title()