import asyncio
import json
import logging
from typing import List, Dict, Optional
from anthropic import AsyncAnthropic

from config.config import config
from models import CompanyInfo, BusinessSize

logger = logging.getLogger(__name__)

class ClaudeExtractor:
    def __init__(self):
        self.client = AsyncAnthropic(api_key=config.claude.api_key)
        self.extraction_schema = {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "会社名（正式名称）"},
                "industry": {"type": "string", "description": "業種・事業内容"},
                "location": {"type": "string", "description": "所在地・住所"},
                "description": {"type": "string", "description": "会社概要・事業説明"},
                "business_size": {
                    "type": "string",
                    "enum": ["startup", "small", "medium", "large", "enterprise"],
                    "description": "事業規模の推定"
                },
                "contact_email": {"type": "string", "description": "主要な問い合わせメールアドレス"},
                "phone": {"type": "string", "description": "電話番号"},
                "additional_emails": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "その他のメールアドレス"
                },
                "social_media": {
                    "type": "object",
                    "properties": {
                        "twitter": {"type": "string"},
                        "facebook": {"type": "string"},
                        "linkedin": {"type": "string"},
                        "instagram": {"type": "string"}
                    },
                    "description": "SNSアカウント"
                },
                "confidence_score": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1,
                    "description": "抽出データの信頼度（0-1）"
                }
            },
            "required": ["company_name", "confidence_score"]
        }

    async def extract_company_info_batch(self, scraped_data: List[Dict[str, str]]) -> List[CompanyInfo]:
        """
        複数のスクレイピングデータから会社情報を一括抽出
        """
        semaphore = asyncio.Semaphore(5)  # Claude APIの同時リクエスト数制限
        tasks = []

        for data in scraped_data:
            task = self._extract_single_company(semaphore, data)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        company_infos = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error extracting company info from {scraped_data[i].get('url', 'unknown')}: {result}")
                continue
            if result:
                company_infos.append(result)

        return company_infos

    async def _extract_single_company(self, semaphore: asyncio.Semaphore, data: Dict[str, str]) -> Optional[CompanyInfo]:
        """
        単一のスクレイピングデータから会社情報を抽出
        """
        async with semaphore:
            try:
                # プロンプトを構築
                prompt = self._build_extraction_prompt(data)

                # Claude APIを呼び出し
                message = await self.client.messages.create(
                    model=config.claude.model,
                    max_tokens=config.claude.max_tokens,
                    temperature=config.claude.temperature,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )

                # レスポンスをパース
                response_text = message.content[0].text
                extracted_data = self._parse_claude_response(response_text)

                if extracted_data and extracted_data.get('confidence_score', 0) > 0.3:
                    return self._create_company_info(data['url'], extracted_data)

            except Exception as e:
                logger.error(f"Claude extraction error for {data.get('url', 'unknown')}: {e}")
                return None

    def _build_extraction_prompt(self, data: Dict[str, str]) -> str:
        """
        Claude用の抽出プロンプトを構築
        """
        content = data.get('content', '')[:3000]  # コンテンツを制限
        title = data.get('title', '')
        description = data.get('description', '')

        prompt = f"""
以下のウェブサイトの情報から、会社の詳細情報を抽出してください。

【ウェブサイト情報】
URL: {data.get('url', '')}
タイトル: {title}
説明: {description}

【コンテンツ】
{content}

【指示】
以下のJSONスキーマに従って、会社情報を抽出してください：

{json.dumps(self.extraction_schema, indent=2, ensure_ascii=False)}

【抽出ルール】
1. 会社名は正式名称を抽出してください
2. 業種は具体的に記述してください
3. 所在地は都道府県から番地まで可能な限り詳細に
4. 事業規模は以下を参考に推定してください：
   - startup: スタートアップ・創業間もない企業
   - small: 従業員数1-50名程度
   - medium: 従業員数51-300名程度
   - large: 従業員数301-1000名程度
   - enterprise: 従業員数1000名以上
5. メールアドレスは info@, contact@, inquiry@ などを優先してください
6. confidence_score は抽出できた情報の信頼度を0-1で評価してください
7. 情報が不明な場合は null を設定してください

レスポンスは有効なJSONのみを返してください。
"""
        return prompt

    def _parse_claude_response(self, response_text: str) -> Optional[Dict]:
        """
        Claudeのレスポンスをパースしてデータを抽出
        """
        try:
            # JSONの開始と終了を見つける
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx == -1 or end_idx == 0:
                logger.error("No JSON found in Claude response")
                return None

            json_str = response_text[start_idx:end_idx]
            return json.loads(json_str)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude JSON response: {e}")
            logger.debug(f"Response text: {response_text}")
            return None

    def _create_company_info(self, url: str, extracted_data: Dict) -> CompanyInfo:
        """
        抽出データからCompanyInfoオブジェクトを作成
        """
        business_size = None
        if extracted_data.get('business_size'):
            try:
                business_size = BusinessSize(extracted_data['business_size'])
            except ValueError:
                pass

        return CompanyInfo(
            company_name=extracted_data.get('company_name', ''),
            url=url,
            location=extracted_data.get('location'),
            contact_email=extracted_data.get('contact_email'),
            phone=extracted_data.get('phone'),
            description=extracted_data.get('description'),
            industry=extracted_data.get('industry'),
            business_size=business_size,
            additional_emails=extracted_data.get('additional_emails', []),
            social_media=extracted_data.get('social_media', {})
        )

    async def enhance_company_info(self, company: CompanyInfo, additional_data: str) -> CompanyInfo:
        """
        追加データを使用して会社情報を強化
        """
        try:
            prompt = f"""
既存の会社情報を以下の追加データで強化してください：

【既存情報】
{json.dumps(company.to_dict(), indent=2, ensure_ascii=False)}

【追加データ】
{additional_data[:2000]}

【指示】
追加データを分析して、既存の情報を補完・更新してください。
以下のJSONスキーマに従って、強化された情報を返してください：

{json.dumps(self.extraction_schema, indent=2, ensure_ascii=False)}

既存の情報を上書きするのではなく、不足している情報を補完してください。
レスポンスは有効なJSONのみを返してください。
"""

            message = await self.client.messages.create(
                model=config.claude.model,
                max_tokens=config.claude.max_tokens,
                temperature=config.claude.temperature,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = message.content[0].text
            enhanced_data = self._parse_claude_response(response_text)

            if enhanced_data:
                return self._create_company_info(company.url, enhanced_data)

        except Exception as e:
            logger.error(f"Error enhancing company info: {e}")

        return company