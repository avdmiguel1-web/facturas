from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Assignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    line_type: str  # 'telefonia_movil', 'ventas_terceros', 'rentas_servicios', 'resumen_consumo'
    line_index: int  # Index in the array
    line_identifier: Optional[str] = None  # numero_movil for mobiles, or description for others
    cost_center_id: str
    cost_center_name: str
    monto_bs: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssignmentCreate(BaseModel):
    document_id: str
    line_type: str
    line_index: int
    line_identifier: Optional[str] = None
    cost_center_id: str
    monto_bs: float

class AssignmentUpdate(BaseModel):
    cost_center_id: Optional[str] = None
    monto_bs: Optional[float] = None
