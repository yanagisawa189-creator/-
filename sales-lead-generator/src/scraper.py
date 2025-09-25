import asyncio
import aiohttp
import time
from typing import List, Optional, Dict
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser
import logging
# from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

from config.config import config
from models import SearchResult

logger = logging.getLogger(__name__)

class WebScraper:
    def __init__(self):
        self.config = config.scraping
        self.session = None
        self.playwright = None
        self.browser = None

    async def __aenter__(self):
        # HTTP セッションの初期化
        connector = aiohttp.TCPConnector(limit=self.config.max_concurrent_requests)
        timeout = aiohttp.ClientTimeout(total=self.config.request_timeout)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': self.config.user_agent}
        )

        # Playwright の初期化（必要時のみ）- テスト用に無効化
        self.playwright = None
        self.browser = None

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def scrape_urls(self, search_results: List[SearchResult]) -> List[Dict[str, str]]:
        """
        検索結果のURLリストから情報を抽出
        """
        scraped_data = []
        semaphore = asyncio.Semaphore(self.config.max_concurrent_requests)

        tasks = []
        for result in search_results:
            task = self._scrape_single_url(semaphore, result.url)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error scraping {search_results[i].url}: {result}")
                continue
            if result:
                scraped_data.append(result)

        return scraped_data

    async def _scrape_single_url(self, semaphore: asyncio.Semaphore, url: str) -> Optional[Dict[str, str]]:
        """
        単一URLの情報を抽出
        """
        async with semaphore:
            # robots.txt チェック
            if self.config.respect_robots_txt and not await self._can_fetch(url):
                logger.info(f"Robots.txt disallows scraping: {url}")
                return None

            try:
                # まずHTTPリクエストで試行
                html_content = await self._fetch_with_http(url)

                # JavaScriptが必要な場合はPlaywrightを使用
                if self._needs_javascript(html_content):
                    html_content = await self._fetch_with_playwright(url)

                if html_content:
                    return await self._extract_content(url, html_content)

            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                return None

    async def _fetch_with_http(self, url: str) -> Optional[str]:
        """
        HTTPリクエストでコンテンツを取得
        """
        for attempt in range(self.config.max_retries):
            try:
                async with self.session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        return content
                    elif response.status == 429:  # Rate limited
                        wait_time = self.config.retry_delay * (2 ** attempt)
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.warning(f"HTTP {response.status} for {url}")
                        return None

            except Exception as e:
                if attempt < self.config.max_retries - 1:
                    wait_time = self.config.retry_delay * (2 ** attempt)
                    await asyncio.sleep(wait_time)
                else:
                    raise e

    async def _fetch_with_playwright(self, url: str) -> Optional[str]:
        """
        PlaywrightでJavaScriptコンテンツを取得（テスト用に無効化）
        """
        logger.info("Playwright is disabled for testing")
        return None

    def _needs_javascript(self, html_content: str) -> bool:
        """
        JavaScriptが必要かどうかを判定
        """
        if not html_content:
            return True

        # 簡単なヒューリスティック
        javascript_indicators = [
            'document.write',
            'window.onload',
            'React',
            'Vue',
            'Angular',
            'data-reactroot'
        ]

        content_lower = html_content.lower()
        return any(indicator.lower() in content_lower for indicator in javascript_indicators)

    async def _extract_content(self, url: str, html_content: str) -> Dict[str, str]:
        """
        HTMLコンテンツから構造化データを抽出
        """
        soup = BeautifulSoup(html_content, 'html.parser')

        # 基本情報の抽出
        data = {
            'url': url,
            'title': self._extract_title(soup),
            'description': self._extract_description(soup),
            'content': self._extract_main_content(soup),
        }

        # 連絡先情報の抽出
        contact_info = self._extract_contact_info(soup, html_content)
        data.update(contact_info)

        return data

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """ページタイトルの抽出"""
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text().strip()

        # h1タグを代替として使用
        h1_tag = soup.find('h1')
        if h1_tag:
            return h1_tag.get_text().strip()

        return ""

    def _extract_description(self, soup: BeautifulSoup) -> str:
        """ページ説明の抽出"""
        # meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            return meta_desc.get('content', '').strip()

        # 最初のpタグ
        first_p = soup.find('p')
        if first_p:
            return first_p.get_text().strip()[:200]

        return ""

    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """メインコンテンツの抽出"""
        # 不要なタグを除去
        for tag in soup(['script', 'style', 'nav', 'footer', 'aside']):
            tag.decompose()

        # メインコンテンツエリアを探す
        main_selectors = [
            'main', '[role="main"]', '.main', '#main',
            '.content', '#content', '.container', 'article'
        ]

        for selector in main_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()[:1000]

        # body全体から抽出
        body = soup.find('body')
        if body:
            return body.get_text().strip()[:1000]

        return soup.get_text().strip()[:1000]

    def _extract_contact_info(self, soup: BeautifulSoup, html_content: str) -> Dict[str, str]:
        """連絡先情報の抽出"""
        import re

        contact_info = {}
        text_content = soup.get_text()

        # メールアドレスの抽出
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text_content)
        if emails:
            # 最も適切なメールアドレスを選択
            priority_emails = [e for e in emails if any(prefix in e.lower()
                             for prefix in ['info', 'contact', 'inquiry', 'support'])]
            contact_info['email'] = priority_emails[0] if priority_emails else emails[0]

        # 電話番号の抽出
        phone_patterns = [
            r'\d{2,4}-\d{2,4}-\d{4}',  # 03-1234-5678
            r'\d{3}\.\d{3}\.\d{4}',    # 123.456.7890
            r'\(\d{3}\)\s*\d{3}-\d{4}',  # (123) 456-7890
        ]

        for pattern in phone_patterns:
            phones = re.findall(pattern, text_content)
            if phones:
                contact_info['phone'] = phones[0]
                break

        # 住所の抽出（日本の住所パターン）
        address_pattern = r'[都道府県市区町村郡]{1,3}[^\s]{5,20}'
        addresses = re.findall(address_pattern, text_content)
        if addresses:
            contact_info['address'] = addresses[0]

        return contact_info

    async def _can_fetch(self, url: str) -> bool:
        """
        robots.txtをチェックしてアクセス可能かどうか確認
        """
        try:
            parsed_url = urlparse(url)
            robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"

            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.read()

            return rp.can_fetch(self.config.user_agent, url)

        except Exception:
            # robots.txt の取得に失敗した場合は許可とみなす
            return True