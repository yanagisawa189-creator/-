from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class PropertyBase(SQLModel):
    address: str
    price: int
    area_sqm: float
    built_year: int
    layout: str
    station: str
    walk_min: int
    pr: str

class Property(PropertyBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(BaseModel):
    id: int
    created_at: datetime

class MediaCopyBase(SQLModel):
    property_id: int = Field(foreign_key="property.id")
    media_type: str  # suumo, homes, instagram, flyer
    content: str

class MediaCopy(MediaCopyBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)

class AssetBase(SQLModel):
    property_id: int = Field(foreign_key="property.id")
    filename: str
    path: str
    media_type: str  # original, suumo, homes, instagram, flyer

class Asset(AssetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)