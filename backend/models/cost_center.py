from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class CostCenter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CostCenterCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CostCenterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
