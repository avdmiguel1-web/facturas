import logging
import requests
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

from db import get_latest_exchange_rate, insert_exchange_rate

load_dotenv()
logger = logging.getLogger(__name__)


class ExchangeRateService:
    """Servicio para obtener y gestionar la tasa de cambio USD/VEF del BCV"""

    # Tasa por defecto (490.04)
    DEFAULT_RATE = 490.04
    
    # URLs de fuentes de datos del BCV
    EXCHANGE_RATE_SOURCES = [
        "https://ve.dolartoday.com/api",
        "https://api.bcv.org.ve/api/last",
    ]

    def __init__(self):
        self._current_rate: Optional[float] = None
        self._last_update: Optional[datetime] = None
        self._rate_date: Optional[str] = None
        # Iniciar con la tasa por defecto
        self._current_rate = self.DEFAULT_RATE
        self._last_update = datetime.now(timezone.utc)
        self._rate_date = datetime.now(timezone.utc).date().isoformat()
        self._load_persisted_rate()

    def _load_persisted_rate(self) -> None:
        today = datetime.now(timezone.utc).date().isoformat()
        row = get_latest_exchange_rate(today)

        if row:
            self._current_rate = float(row["rate"])
            self._last_update = datetime.fromisoformat(row["fetched_at"])
            self._rate_date = row["rate_date"]
            logger.info(f"Cargando tasa persistida para hoy ({today}): {self._current_rate}")
            return

        row = get_latest_exchange_rate()
        if row:
            self._current_rate = float(row["rate"])
            self._last_update = datetime.fromisoformat(row["fetched_at"])
            self._rate_date = row["rate_date"]
            logger.warning(
                f"No hay tasa persistida para hoy ({today}). Usando la última tasa guardada: {self._current_rate} (fecha {self._rate_date})"
            )

    def get_current_rate(self) -> float:
        """Obtiene la tasa de cambio actual (USD a VEF)"""
        return self._current_rate or self.DEFAULT_RATE

    def get_rate_info(self) -> Dict[str, Any]:
        """Obtiene información completa sobre la tasa actual"""
        return {
            "rate": self.get_current_rate(),
            "last_update": self._last_update.isoformat() if self._last_update else None,
            "rate_date": self._rate_date,
            "formatted_rate": f"{self.get_current_rate():.2f}",
        }

    async def fetch_rate_from_bcv(self) -> Optional[float]:
        """
        Intenta obtener la tasa de cambio del BCV desde múltiples fuentes.
        Retorna None si falla en todas las fuentes.
        """
        today = datetime.now(timezone.utc).date().isoformat()

        for source in self.EXCHANGE_RATE_SOURCES:
            try:
                rate = await self._fetch_from_source(source)
                if rate:
                    logger.info(f"Tasa obtenida exitosamente de {source}: {rate}")
                    self._current_rate = rate
                    self._last_update = datetime.now(timezone.utc)
                    self._rate_date = today
                    self._save_rate(rate, source=source, rate_date=today)
                    return rate
            except Exception as e:
                logger.warning(f"Error obteniendo tasa de {source}: {e}")
                continue

        logger.warning("No se pudo obtener la tasa de ninguna fuente. Usando tasa por defecto.")
        return None

    async def _fetch_from_source(self, source: str) -> Optional[float]:
        """Fetch de tasa desde una fuente específica"""
        loop = asyncio.get_event_loop()
        try:
            response = await loop.run_in_executor(None, lambda: requests.get(source, timeout=10))
            response.raise_for_status()
            
            data = response.json()
            
            # Parsear según la fuente
            if "dolartoday" in source:
                usd_vef = data.get("USD", {})
                if isinstance(usd_vef, dict):
                    rate = usd_vef.get("vef")
                    if rate:
                        return float(rate)
            
            elif "bcv.org.ve" in source:
                # Formato esperado del BCV
                rate = data.get("last", {}).get("promedio")
                if rate:
                    return float(rate)
            
            return None
        except Exception as e:
            logger.warning(f"Error al parsear respuesta de {source}: {e}")
            return None

    def convert_usd_to_vef(self, amount_usd: float) -> float:
        """Convierte USD a VEF usando la tasa actual"""
        if amount_usd is None:
            return None
        return round(amount_usd * self.get_current_rate(), 2)

    def convert_vef_to_usd(self, amount_vef: float) -> float:
        """Convierte VEF a USD usando la tasa actual"""
        if amount_vef is None:
            return None
        rate = self.get_current_rate()
        if rate == 0:
            return None
        return round(amount_vef / rate, 2)

    def _save_rate(self, rate: float, source: str, rate_date: str, note: str = None) -> None:
        try:
            insert_exchange_rate(rate, source, rate_date, note)
        except Exception as e:
            logger.warning(f"No se pudo persistir la tasa de cambio: {e}")

    def set_rate(self, rate: float) -> bool:
        """Establece la tasa de cambio manualmente"""
        if rate <= 0:
            logger.error("La tasa debe ser mayor a 0")
            return False
        
        self._current_rate = float(rate)
        self._last_update = datetime.now(timezone.utc)
        self._rate_date = datetime.now(timezone.utc).date().isoformat()
        self._save_rate(rate, source="manual", rate_date=self._rate_date, note="manual update")
        logger.info(f"Tasa actualizada a: {self._current_rate}")
        return True


# Instancia global del servicio
_exchange_rate_service: Optional[ExchangeRateService] = None


def get_exchange_rate_service() -> ExchangeRateService:
    """Obtiene la instancia singleton del servicio de tasa de cambio"""
    global _exchange_rate_service
    if _exchange_rate_service is None:
        _exchange_rate_service = ExchangeRateService()
    return _exchange_rate_service
