from dataclasses import dataclass
from typing import Optional, List, Dict
from enum import Enum
import json

class BusinessSize(Enum):
    STARTUP = "startup"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"

@dataclass
class SearchQuery:
    industry: str
    location: str
    additional_keywords: List[str]
    exclude_keywords: Optional[List[str]] = None

    def to_search_string(self) -> str:
        base = f"{self.industry} {self.location}"
        if self.additional_keywords:
            base += " " + " ".join(self.additional_keywords)
        return base

@dataclass
class CompanyInfo:
    company_name: str
    url: str
    location: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    business_size: Optional[BusinessSize] = None
    additional_emails: Optional[List[str]] = None
    social_media: Optional[Dict[str, str]] = None

    def to_dict(self) -> Dict:
        data = {
            'company_name': self.company_name,
            'url': self.url,
            'location': self.location,
            'contact_email': self.contact_email,
            'phone': self.phone,
            'description': self.description,
            'industry': self.industry,
            'business_size': self.business_size.value if self.business_size else None,
            'additional_emails': self.additional_emails or [],
            'social_media': self.social_media or {}
        }
        return data

@dataclass
class ScoredLead:
    company: CompanyInfo
    total_score: float
    scores: Dict[str, float]
    confidence: float

    def to_dict(self) -> Dict:
        return {
            **self.company.to_dict(),
            'total_score': self.total_score,
            'industry_match_score': self.scores.get('industry_match', 0),
            'business_size_score': self.scores.get('business_size', 0),
            'contact_info_score': self.scores.get('contact_info', 0),
            'location_match_score': self.scores.get('location_match', 0),
            'confidence': self.confidence
        }

@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    search_engine: str
    position: int