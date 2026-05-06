from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    file_path: str
    file_type: str
    file_size: int
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processing_status: str = "pending"  # pending, processing, completed, failed
    module_type: Optional[str] = None  # general, specialized
    extracted_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class DocumentCreate(BaseModel):
    filename: str
    file_type: str
    file_size: int

class DocumentUpdate(BaseModel):
    processing_status: Optional[str] = None
    module_type: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class ExtractedDataGeneral(BaseModel):
    """Modelo para datos del Módulo A - Facturación General"""
    proveedor: Optional[str] = None
    rif: Optional[str] = None
    fecha: Optional[str] = None
    periodo: Optional[str] = None
    subtotal: Optional[float] = None
    iva: Optional[float] = None
    monto_total: Optional[float] = None
    moneda: Optional[str] = None
    tipo: Optional[str] = None  # Consumo o Servicio

class VentasTerceros(BaseModel):
    descripcion: Optional[str] = None
    cantidad: Optional[float] = None
    monto_bs: Optional[float] = None

class TelefoniaMovil(BaseModel):
    numero_movil: Optional[str] = None
    descripcion: Optional[str] = None
    monto_bs: Optional[float] = None

class RentasServicios(BaseModel):
    descripcion: Optional[str] = None
    fecha_desde: Optional[str] = None
    fecha_hasta: Optional[str] = None
    monto_bs: Optional[float] = None

class ResumenConsumo(BaseModel):
    descripcion: Optional[str] = None
    unidades_consumidas: Optional[float] = None
    monto_bs: Optional[float] = None

class ExtractedDataSpecialized(BaseModel):
    """Modelo para datos del Módulo B - Análisis Especializado"""
    ventas_terceros: Optional[List[VentasTerceros]] = None
    telefonia_movil: Optional[List[TelefoniaMovil]] = None
    rentas_servicios: Optional[List[RentasServicios]] = None
    resumen_consumo: Optional[List[ResumenConsumo]] = None
