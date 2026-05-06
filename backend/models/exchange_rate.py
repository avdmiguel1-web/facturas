from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExchangeRate(BaseModel):
    """Modelo para la tasa de cambio"""
    rate: float  # Tasa USD a VEF
    last_update: datetime
    source: Optional[str] = "manual"  # manual o bcv


class ExchangeRateUpdate(BaseModel):
    """Modelo para actualizar la tasa de cambio"""
    rate: float


class ExchangeRateResponse(BaseModel):
    """Modelo de respuesta con información de la tasa"""
    rate: float
    formatted_rate: str
    last_update: Optional[str]
    rate_date: Optional[str] = None
    message: str
