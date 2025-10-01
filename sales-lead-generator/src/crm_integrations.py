import asyncio
import aiohttp
import logging
from typing import List, Dict, Optional, Any
from urllib.parse import urljoin
import json

from config.config import config
from models import ScoredLead

logger = logging.getLogger(__name__)

class CRMIntegrationManager:
    def __init__(self):
        self.config = config.crm

    async def sync_to_all_crms(self, scored_leads: List[ScoredLead]) -> Dict[str, Dict]:
        """
        全てのCRMに同期
        """
        results = {}

        # HubSpot
        if self.config.hubspot_api_key:
            hubspot_result = await self._sync_to_hubspot(scored_leads)
            results['hubspot'] = hubspot_result

        # Salesforce
        if (self.config.salesforce_client_id and self.config.salesforce_client_secret):
            salesforce_result = await self._sync_to_salesforce(scored_leads)
            results['salesforce'] = salesforce_result

        # Zoho
        if (self.config.zoho_client_id and self.config.zoho_client_secret):
            zoho_result = await self._sync_to_zoho(scored_leads)
            results['zoho'] = zoho_result

        return results

    async def _sync_to_hubspot(self, scored_leads: List[ScoredLead]) -> Dict:
        """
        HubSpotにデータを同期
        """
        try:
            hubspot_client = HubSpotClient(self.config.hubspot_api_key)
            return await hubspot_client.create_companies(scored_leads)
        except Exception as e:
            logger.error(f"HubSpot sync error: {e}")
            return {"error": str(e), "success": False}

    async def _sync_to_salesforce(self, scored_leads: List[ScoredLead]) -> Dict:
        """
        Salesforceにデータを同期
        """
        try:
            salesforce_client = SalesforceClient(
                self.config.salesforce_client_id,
                self.config.salesforce_client_secret,
                self.config.salesforce_username,
                self.config.salesforce_password
            )
            await salesforce_client.authenticate()
            return await salesforce_client.create_leads(scored_leads)
        except Exception as e:
            logger.error(f"Salesforce sync error: {e}")
            return {"error": str(e), "success": False}

    async def _sync_to_zoho(self, scored_leads: List[ScoredLead]) -> Dict:
        """
        Zohoにデータを同期
        """
        try:
            zoho_client = ZohoCRMClient(
                self.config.zoho_client_id,
                self.config.zoho_client_secret
            )
            await zoho_client.authenticate()
            return await zoho_client.create_leads(scored_leads)
        except Exception as e:
            logger.error(f"Zoho sync error: {e}")
            return {"error": str(e), "success": False}

class HubSpotClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.hubapi.com"
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def create_companies(self, scored_leads: List[ScoredLead]) -> Dict:
        """
        HubSpotに企業を作成
        """
        if not self.session:
            self.session = aiohttp.ClientSession()

        created = 0
        updated = 0
        errors = []

        for lead in scored_leads:
            try:
                # 既存企業をチェック
                existing_company = await self._find_company_by_domain(lead.company.url)

                if existing_company:
                    # 更新
                    result = await self._update_company(existing_company['id'], lead)
                    if result:
                        updated += 1
                else:
                    # 新規作成
                    result = await self._create_company(lead)
                    if result:
                        created += 1

            except Exception as e:
                errors.append(f"Error with {lead.company.company_name}: {str(e)}")

        await self.session.close()

        return {
            "success": True,
            "created": created,
            "updated": updated,
            "errors": errors
        }

    async def _find_company_by_domain(self, url: str) -> Optional[Dict]:
        """
        ドメインで企業を検索
        """
        if not url:
            return None

        domain = self._extract_domain(url)
        if not domain:
            return None

        search_url = f"{self.base_url}/crm/v3/objects/companies/search"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        search_data = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": "domain",
                            "operator": "EQ",
                            "value": domain
                        }
                    ]
                }
            ]
        }

        try:
            async with self.session.post(search_url, headers=headers, json=search_data) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('results'):
                        return data['results'][0]
        except Exception as e:
            logger.error(f"HubSpot search error: {e}")

        return None

    async def _create_company(self, lead: ScoredLead) -> bool:
        """
        新規企業を作成
        """
        create_url = f"{self.base_url}/crm/v3/objects/companies"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        properties = self._convert_to_hubspot_properties(lead)
        company_data = {"properties": properties}

        try:
            async with self.session.post(create_url, headers=headers, json=company_data) as response:
                return response.status == 201
        except Exception as e:
            logger.error(f"HubSpot create error: {e}")
            return False

    async def _update_company(self, company_id: str, lead: ScoredLead) -> bool:
        """
        既存企業を更新
        """
        update_url = f"{self.base_url}/crm/v3/objects/companies/{company_id}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        properties = self._convert_to_hubspot_properties(lead)
        company_data = {"properties": properties}

        try:
            async with self.session.patch(update_url, headers=headers, json=company_data) as response:
                return response.status == 200
        except Exception as e:
            logger.error(f"HubSpot update error: {e}")
            return False

    def _convert_to_hubspot_properties(self, lead: ScoredLead) -> Dict[str, str]:
        """
        ScoredLeadをHubSpotのプロパティに変換
        """
        properties = {
            "name": lead.company.company_name,
            "domain": self._extract_domain(lead.company.url) or "",
            "phone": lead.company.phone or "",
            "address": lead.company.location or "",
            "industry": lead.company.industry or "",
            "description": lead.company.description or "",
            "lead_score": str(int(lead.total_score)),
            "lead_source": "Sales Lead Generator",
        }

        # カスタムフィールド
        properties["confidence_score"] = str(lead.confidence)
        properties["generation_date"] = str(datetime.now().isoformat())

        return properties

    def _extract_domain(self, url: str) -> Optional[str]:
        """URLからドメインを抽出"""
        import tldextract
        try:
            extracted = tldextract.extract(url)
            if extracted.domain and extracted.suffix:
                return f"{extracted.domain}.{extracted.suffix}"
        except:
            pass
        return None

class SalesforceClient:
    def __init__(self, client_id: str, client_secret: str, username: str, password: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.username = username
        self.password = password
        self.access_token = None
        self.instance_url = None
        self.session = None

    async def authenticate(self):
        """
        Salesforceで認証
        """
        self.session = aiohttp.ClientSession()

        auth_url = "https://login.salesforce.com/services/oauth2/token"
        auth_data = {
            "grant_type": "password",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "username": self.username,
            "password": self.password
        }

        try:
            async with self.session.post(auth_url, data=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.access_token = data["access_token"]
                    self.instance_url = data["instance_url"]
                    return True
                else:
                    logger.error(f"Salesforce auth failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Salesforce auth error: {e}")
            return False

    async def create_leads(self, scored_leads: List[ScoredLead]) -> Dict:
        """
        Salesforceにリードを作成
        """
        created = 0
        errors = []

        for lead in scored_leads:
            try:
                # 重複チェック
                existing = await self._find_lead_by_company(lead.company.company_name)
                if existing:
                    continue  # 既存の場合はスキップ

                # 新規作成
                result = await self._create_lead(lead)
                if result:
                    created += 1

            except Exception as e:
                errors.append(f"Error with {lead.company.company_name}: {str(e)}")

        await self.session.close()

        return {
            "success": True,
            "created": created,
            "errors": errors
        }

    async def _find_lead_by_company(self, company_name: str) -> Optional[Dict]:
        """企業名でリードを検索"""
        if not self.access_token:
            return None

        query = f"SELECT Id FROM Lead WHERE Company = '{company_name}' LIMIT 1"
        query_url = f"{self.instance_url}/services/data/v54.0/query/?q={query}"

        headers = {"Authorization": f"Bearer {self.access_token}"}

        try:
            async with self.session.get(query_url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('records'):
                        return data['records'][0]
        except Exception as e:
            logger.error(f"Salesforce search error: {e}")

        return None

    async def _create_lead(self, lead: ScoredLead) -> bool:
        """リードを作成"""
        create_url = f"{self.instance_url}/services/data/v54.0/sobjects/Lead/"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        lead_data = self._convert_to_salesforce_lead(lead)

        try:
            async with self.session.post(create_url, headers=headers, json=lead_data) as response:
                return response.status == 201
        except Exception as e:
            logger.error(f"Salesforce create error: {e}")
            return False

    def _convert_to_salesforce_lead(self, lead: ScoredLead) -> Dict[str, Any]:
        """ScoredLeadをSalesforceのリードに変換"""
        return {
            "LastName": lead.company.company_name,  # 必須フィールド
            "Company": lead.company.company_name,
            "Website": lead.company.url,
            "Phone": lead.company.phone,
            "Industry": lead.company.industry,
            "Description": lead.company.description,
            "Status": "New",
            "Rating": "Hot" if lead.total_score >= 8.0 else "Warm" if lead.total_score >= 5.0 else "Cold",
            "LeadSource": "Sales Lead Generator"
        }

class ZohoCRMClient:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.session = None

    async def authenticate(self):
        """Zoho CRMで認証 (要実装)"""
        # OAuth2フローの実装が必要
        # 簡略化のため、アクセストークンが既に設定されていることを想定
        self.session = aiohttp.ClientSession()
        return True

    async def create_leads(self, scored_leads: List[ScoredLead]) -> Dict:
        """Zoho CRMにリードを作成"""
        # 実装は他のCRMと同様のパターン
        return {"success": True, "created": 0, "errors": ["Not implemented"]}

from datetime import datetime