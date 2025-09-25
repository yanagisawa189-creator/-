import re
from typing import List, Dict, Optional
import logging
from difflib import SequenceMatcher

from config.config import config
from models import CompanyInfo, ScoredLead, BusinessSize, SearchQuery
from data_enhancer import DomainAnalyzer

logger = logging.getLogger(__name__)

class LeadScorer:
    def __init__(self):
        self.config = config.scoring
        self.domain_analyzer = DomainAnalyzer()

    def score_leads(self, companies: List[CompanyInfo], search_query: SearchQuery) -> List[ScoredLead]:
        """
        会社リストをスコアリングして優先順位付き営業リードを作成
        """
        scored_leads = []

        for company in companies:
            try:
                scores = self._calculate_scores(company, search_query)
                total_score = self._calculate_total_score(scores)
                confidence = self._calculate_confidence(company, scores)

                scored_lead = ScoredLead(
                    company=company,
                    total_score=total_score,
                    scores=scores,
                    confidence=confidence
                )

                scored_leads.append(scored_lead)

            except Exception as e:
                logger.error(f"Error scoring company {company.company_name}: {e}")

        # スコアの高い順にソート
        scored_leads.sort(key=lambda x: x.total_score, reverse=True)

        return scored_leads

    def _calculate_scores(self, company: CompanyInfo, search_query: SearchQuery) -> Dict[str, float]:
        """
        各項目のスコアを計算
        """
        scores = {
            'industry_match': self._score_industry_match(company, search_query),
            'business_size': self._score_business_size(company),
            'contact_info': self._score_contact_info(company),
            'location_match': self._score_location_match(company, search_query),
            'domain_reputation': self._score_domain_reputation(company)
        }

        return scores

    def _score_industry_match(self, company: CompanyInfo, search_query: SearchQuery) -> float:
        """
        業種一致度のスコア (0-5)
        """
        if not company.industry or not search_query.industry:
            return 0.0

        # 完全一致
        if search_query.industry.lower() in company.industry.lower():
            return 5.0

        # 類似度計算
        similarity = SequenceMatcher(None, search_query.industry.lower(), company.industry.lower()).ratio()

        # キーワードマッチング
        keyword_matches = 0
        search_keywords = search_query.industry.lower().split()
        company_industry_lower = company.industry.lower()

        for keyword in search_keywords:
            if keyword in company_industry_lower:
                keyword_matches += 1

        keyword_score = (keyword_matches / len(search_keywords)) * 3.0 if search_keywords else 0.0

        # 業種固有のキーワードマッチング
        industry_keywords = self._get_industry_keywords(search_query.industry)
        industry_keyword_matches = 0

        for keyword in industry_keywords:
            if keyword.lower() in company_industry_lower:
                industry_keyword_matches += 1

        industry_keyword_score = (industry_keyword_matches / len(industry_keywords)) * 2.0 if industry_keywords else 0.0

        total_score = max(similarity * 5.0, keyword_score, industry_keyword_score)
        return min(total_score, 5.0)

    def _score_business_size(self, company: CompanyInfo) -> float:
        """
        事業規模のスコア (0-3)
        """
        if not company.business_size:
            return 1.0  # デフォルトスコア

        # 事業規模別の重み付け
        size_scores = {
            BusinessSize.STARTUP: 1.5,
            BusinessSize.SMALL: 2.5,
            BusinessSize.MEDIUM: 3.0,
            BusinessSize.LARGE: 2.8,
            BusinessSize.ENTERPRISE: 2.0  # 企業規模が大きすぎる場合は少し低めに
        }

        return size_scores.get(company.business_size, 1.0)

    def _score_contact_info(self, company: CompanyInfo) -> float:
        """
        連絡先情報の充実度スコア (0-2)
        """
        score = 0.0

        # メインの連絡先メールアドレス
        if company.contact_email:
            if self._is_direct_contact_email(company.contact_email):
                score += 1.0  # 直接連絡できるメール
            else:
                score += 0.5  # 一般的なメール

        # 電話番号
        if company.phone:
            score += 0.5

        # 追加のメールアドレス
        if company.additional_emails:
            score += min(len(company.additional_emails) * 0.1, 0.3)

        # SNS情報
        if company.social_media:
            active_social = [v for v in company.social_media.values() if v]
            score += min(len(active_social) * 0.1, 0.2)

        return min(score, 2.0)

    def _score_location_match(self, company: CompanyInfo, search_query: SearchQuery) -> float:
        """
        所在地一致度のスコア (0-3)
        """
        if not company.location or not search_query.location:
            return 0.0

        company_location = company.location.lower()
        search_location = search_query.location.lower()

        # 完全一致
        if search_location in company_location:
            return 3.0

        # 都道府県レベルの一致
        prefectures = [
            '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
            '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
            '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜',
            '静岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫',
            '奈良', '和歌山', '鳥取', '島根', '岡山', '広島', '山口',
            '徳島', '香川', '愛媛', '高知', '福岡', '佐賀', '長崎',
            '熊本', '大分', '宮崎', '鹿児島', '沖縄'
        ]

        for prefecture in prefectures:
            if prefecture in search_location and prefecture in company_location:
                return 2.0

        # 類似度計算
        similarity = SequenceMatcher(None, search_location, company_location).ratio()
        return similarity * 3.0

    def _score_domain_reputation(self, company: CompanyInfo) -> float:
        """
        ドメイン信頼性スコア (0-1)
        """
        if not company.url:
            return 0.0

        try:
            domain = self._extract_domain_from_url(company.url)
            if not domain:
                return 0.0

            domain_analysis = self.domain_analyzer.analyze_domain_reputation(domain)

            score = 0.0
            if domain_analysis['is_corporate']:
                score += 0.4
            score += domain_analysis['tld_reputation'] * 0.4
            score += domain_analysis['domain_age_score'] * 0.2

            return min(score, 1.0)

        except Exception as e:
            logger.error(f"Error scoring domain reputation: {e}")
            return 0.0

    def _calculate_total_score(self, scores: Dict[str, float]) -> float:
        """
        総合スコアを計算
        """
        total = 0.0
        total += scores.get('industry_match', 0) * (self.config.industry_match_weight / 5.0)
        total += scores.get('business_size', 0) * (self.config.business_size_weight / 3.0)
        total += scores.get('contact_info', 0) * (self.config.contact_info_weight / 2.0)
        total += scores.get('location_match', 0) * (self.config.location_match_weight / 3.0)
        total += scores.get('domain_reputation', 0) * 1.0

        return min(total, self.config.max_score)

    def _calculate_confidence(self, company: CompanyInfo, scores: Dict[str, float]) -> float:
        """
        信頼度を計算 (0-1)
        """
        confidence_factors = []

        # 基本情報の充実度
        basic_info_score = 0.0
        if company.company_name:
            basic_info_score += 0.3
        if company.industry:
            basic_info_score += 0.2
        if company.location:
            basic_info_score += 0.2
        if company.description:
            basic_info_score += 0.3

        confidence_factors.append(basic_info_score)

        # 連絡先情報の品質
        contact_confidence = scores.get('contact_info', 0) / 2.0
        confidence_factors.append(contact_confidence)

        # ドメインの信頼性
        domain_confidence = scores.get('domain_reputation', 0)
        confidence_factors.append(domain_confidence)

        # 平均を計算
        if confidence_factors:
            return sum(confidence_factors) / len(confidence_factors)
        else:
            return 0.0

    def _get_industry_keywords(self, industry: str) -> List[str]:
        """
        業種に関連するキーワードを取得
        """
        industry_keywords = {
            'IT': ['システム', 'ソフトウェア', 'アプリ', 'WEB', 'プログラム', '開発', 'エンジニア'],
            '製造業': ['製造', '工場', 'メーカー', '生産', '製品', '部品'],
            '小売': ['販売', '店舗', 'ショップ', '小売', 'EC', '通販'],
            '飲食': ['レストラン', 'カフェ', '居酒屋', '飲食', '料理', 'フード'],
            '建設': ['建設', '工事', '建築', 'リフォーム', '施工', '設計'],
            '医療': ['病院', 'クリニック', '医療', '歯科', '治療', 'ヘルスケア'],
            '教育': ['学校', '塾', '教育', '研修', '学習', 'スクール'],
            '金融': ['銀行', '保険', '投資', 'ファイナンス', 'クレジット'],
            '不動産': ['不動産', '物件', '賃貸', '売買', 'マンション', '土地']
        }

        return industry_keywords.get(industry, [industry])

    def _is_direct_contact_email(self, email: str) -> bool:
        """
        直接連絡可能なメールアドレスかどうかを判定
        """
        direct_prefixes = ['info', 'contact', 'inquiry', 'support', 'sales']
        email_lower = email.lower()

        return any(prefix in email_lower for prefix in direct_prefixes)

    def _extract_domain_from_url(self, url: str) -> Optional[str]:
        """
        URLからドメインを抽出
        """
        import tldextract
        try:
            extracted = tldextract.extract(url)
            if extracted.domain and extracted.suffix:
                return f"{extracted.domain}.{extracted.suffix}"
        except:
            pass
        return None

class ScoreAnalyzer:
    """
    スコア分析とレポート生成
    """

    @staticmethod
    def analyze_score_distribution(scored_leads: List[ScoredLead]) -> Dict[str, any]:
        """
        スコア分布を分析
        """
        if not scored_leads:
            return {}

        scores = [lead.total_score for lead in scored_leads]
        confidences = [lead.confidence for lead in scored_leads]

        analysis = {
            'total_leads': len(scored_leads),
            'score_stats': {
                'min': min(scores),
                'max': max(scores),
                'average': sum(scores) / len(scores),
                'median': sorted(scores)[len(scores) // 2]
            },
            'confidence_stats': {
                'min': min(confidences),
                'max': max(confidences),
                'average': sum(confidences) / len(confidences)
            },
            'high_priority_leads': len([s for s in scores if s >= 8.0]),
            'medium_priority_leads': len([s for s in scores if 5.0 <= s < 8.0]),
            'low_priority_leads': len([s for s in scores if s < 5.0])
        }

        return analysis

    @staticmethod
    def get_top_leads(scored_leads: List[ScoredLead], limit: int = 10) -> List[ScoredLead]:
        """
        上位のリードを取得
        """
        return scored_leads[:limit]