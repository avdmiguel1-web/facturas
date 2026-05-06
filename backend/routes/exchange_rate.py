from fastapi import APIRouter, HTTPException
import logging
from models.exchange_rate import ExchangeRateUpdate, ExchangeRateResponse
from services.exchange_rate import get_exchange_rate_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/exchange-rate", response_model=ExchangeRateResponse, tags=["exchange-rate"])
async def get_exchange_rate():
    """
    Obtiene la tasa de cambio actual USD/VEF del BCV.
    
    Retorna:
    - rate: Tasa numérica (ej: 490.04)
    - formatted_rate: Tasa formateada con 2 decimales
    - last_update: Fecha y hora de la última actualización
    """
    service = get_exchange_rate_service()
    rate_info = service.get_rate_info()
    
    return ExchangeRateResponse(
        rate=rate_info["rate"],
        formatted_rate=rate_info["formatted_rate"],
        last_update=rate_info["last_update"],
        rate_date=rate_info.get("rate_date"),
        message="Tasa de cambio actual"
    )


@router.post("/exchange-rate", response_model=ExchangeRateResponse, tags=["exchange-rate"])
async def update_exchange_rate(update: ExchangeRateUpdate):
    """
    Actualiza la tasa de cambio manualmente.
    
    Parámetros:
    - rate: Nueva tasa (ej: 490.04)
    
    Retorna la tasa actualizada.
    """
    service = get_exchange_rate_service()
    
    if update.rate <= 0:
        raise HTTPException(status_code=400, detail="La tasa debe ser un valor mayor a 0")
    
    success = service.set_rate(update.rate)
    
    if not success:
        raise HTTPException(status_code=400, detail="Error al actualizar la tasa")
    
    rate_info = service.get_rate_info()
    
    return ExchangeRateResponse(
        rate=rate_info["rate"],
        formatted_rate=rate_info["formatted_rate"],
        last_update=rate_info["last_update"],
        rate_date=rate_info.get("rate_date"),
        message=f"Tasa actualizada a {rate_info['formatted_rate']}"
    )


@router.post("/exchange-rate/sync", response_model=ExchangeRateResponse, tags=["exchange-rate"])
async def sync_exchange_rate():
    """
    Sincroniza la tasa de cambio con el BCV automáticamente.
    Intenta obtener la tasa desde múltiples fuentes.
    
    Retorna la tasa obtenida o usa la tasa por defecto si falla.
    """
    service = get_exchange_rate_service()
    
    try:
        rate = await service.fetch_rate_from_bcv()
        if rate is None:
            logger.warning("No se obtuvo tasa del BCV, usando tasa por defecto")
    except Exception as e:
        logger.error(f"Error sincronizando tasa: {e}")
    
    rate_info = service.get_rate_info()
    
    return ExchangeRateResponse(
        rate=rate_info["rate"],
        formatted_rate=rate_info["formatted_rate"],
        last_update=rate_info["last_update"],
        rate_date=rate_info.get("rate_date"),
        message="Tasa sincronizada con BCV"
    )


@router.get("/exchange-rate/convert", tags=["exchange-rate"])
async def convert_currency(
    amount: float,
    from_currency: str = "USD",
    to_currency: str = "VEF"
):
    """
    Convierte entre USD y VEF usando la tasa actual.
    
    Parámetros:
    - amount: Monto a convertir
    - from_currency: Moneda origen (USD o VEF, default: USD)
    - to_currency: Moneda destino (USD o VEF, default: VEF)
    
    Retorna:
    - original_amount: Monto original
    - from_currency: Moneda origen
    - converted_amount: Monto convertido
    - to_currency: Moneda destino
    - exchange_rate: Tasa usada
    """
    service = get_exchange_rate_service()
    
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    
    if from_currency == to_currency:
        converted = amount
    elif from_currency == "USD" and to_currency == "VEF":
        converted = service.convert_usd_to_vef(amount)
    elif from_currency == "VEF" and to_currency == "USD":
        converted = service.convert_vef_to_usd(amount)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Conversión no soportada: {from_currency} a {to_currency}. Solo se soporta USD <-> VEF"
        )
    
    return {
        "original_amount": amount,
        "from_currency": from_currency,
        "converted_amount": converted,
        "to_currency": to_currency,
        "exchange_rate": service.get_current_rate(),
        "exchange_rate_formatted": f"{service.get_current_rate():.2f}"
    }
