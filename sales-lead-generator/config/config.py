import os
from dataclasses import dataclass
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

@dataclass
class SearchConfig:
    google_api_key: Optional[str] = os.getenv('GOOGLE_API_KEY')
    google_cse_id: Optional[str] = os.getenv('GOOGLE_CSE_ID')
    serpapi_key: Optional[str] = os.getenv('SERPAPI_KEY')
    max_results_per_query: int = 20
    search_delay: float = 1.0

@dataclass
class ScrapingConfig:
    request_timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 2.0
    user_agent: str = "SalesLeadGenerator/1.0 (Research Tool)"
    respect_robots_txt: bool = True
    max_concurrent_requests: int = 5

@dataclass
class ClaudeConfig:
    api_key: str = os.getenv('ANTHROPIC_API_KEY', '')
    model: str = 'claude-3-sonnet-20240229'
    max_tokens: int = 4000
    temperature: float = 0.1

@dataclass
class ScoringConfig:
    industry_match_weight: float = 5.0
    business_size_weight: float = 3.0
    contact_info_weight: float = 2.0
    location_match_weight: float = 3.0
    max_score: float = 13.0

@dataclass
class OutputConfig:
    output_dir: str = 'output'
    csv_filename: str = 'sales_leads.csv'
    excel_filename: str = 'sales_leads.xlsx'
    sqlite_filename: str = 'sales_leads.db'

@dataclass
class CRMConfig:
    hubspot_api_key: Optional[str] = os.getenv('HUBSPOT_API_KEY')
    salesforce_client_id: Optional[str] = os.getenv('SALESFORCE_CLIENT_ID')
    salesforce_client_secret: Optional[str] = os.getenv('SALESFORCE_CLIENT_SECRET')
    salesforce_username: Optional[str] = os.getenv('SALESFORCE_USERNAME')
    salesforce_password: Optional[str] = os.getenv('SALESFORCE_PASSWORD')
    zoho_client_id: Optional[str] = os.getenv('ZOHO_CLIENT_ID')
    zoho_client_secret: Optional[str] = os.getenv('ZOHO_CLIENT_SECRET')

class Config:
    def __init__(self):
        self.search = SearchConfig()
        self.scraping = ScrapingConfig()
        self.claude = ClaudeConfig()
        self.scoring = ScoringConfig()
        self.output = OutputConfig()
        self.crm = CRMConfig()

config = Config()