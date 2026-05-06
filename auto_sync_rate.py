"""
Script para sincronizar automáticamente la tasa de cambio del BCV.

Uso:
    python auto_sync_rate.py
    
Requiere: schedule (pip install schedule)
"""

import asyncio
import logging
from datetime import datetime
from pathlib import Path
import sys

# Agregar el directorio backend al path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from services.exchange_rate import get_exchange_rate_service

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("exchange_rate_sync.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


async def sync_rate_once():
    """Sincroniza la tasa una sola vez"""
    service = get_exchange_rate_service()
    logger.info("Iniciando sincronización de tasa de cambio...")
    
    try:
        rate = await service.fetch_rate_from_bcv()
        if rate:
            logger.info(f"✓ Tasa sincronizada exitosamente: {rate:.2f} VEF/USD")
            return True
        else:
            logger.warning(f"⚠ No se obtuvo tasa del BCV. Usando tasa por defecto: {service.get_current_rate():.2f}")
            return False
    except Exception as e:
        logger.error(f"✗ Error sincronizando tasa: {e}")
        return False


async def continuous_sync(interval_hours=24):
    """
    Sincroniza la tasa continuamente cada N horas.
    
    Args:
        interval_hours: Intervalo en horas entre sincronizaciones (default: 24)
    """
    import asyncio
    
    interval_seconds = interval_hours * 3600
    logger.info(f"Iniciando sincronización continua cada {interval_hours} horas")
    
    while True:
        await sync_rate_once()
        logger.info(f"Próxima sincronización en {interval_hours} horas")
        await asyncio.sleep(interval_seconds)


def sync_with_schedule():
    """Sincroniza usando la librería 'schedule'"""
    try:
        import schedule
        import time
    except ImportError:
        logger.error("La librería 'schedule' no está instalada. Instala con: pip install schedule")
        return
    
    service = get_exchange_rate_service()
    
    def job():
        asyncio.run(sync_rate_once())
    
    # Programar sincronización diaria a las 9:00 AM
    schedule.every().day.at("09:00").do(job)
    logger.info("Sincronización programada para las 09:00 AM diariamente")
    
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Sincroniza la tasa de cambio del BCV")
    parser.add_argument(
        "--mode",
        choices=["once", "continuous", "schedule"],
        default="once",
        help="Modo de sincronización (default: once)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=24,
        help="Intervalo en horas para modo continuous (default: 24)"
    )
    
    args = parser.parse_args()
    
    if args.mode == "once":
        logger.info("Modo: Sincronización única")
        asyncio.run(sync_rate_once())
    
    elif args.mode == "continuous":
        logger.info(f"Modo: Sincronización continua (cada {args.interval} horas)")
        try:
            asyncio.run(continuous_sync(args.interval))
        except KeyboardInterrupt:
            logger.info("Sincronización detenida por el usuario")
    
    elif args.mode == "schedule":
        logger.info("Modo: Sincronización programada con schedule")
        sync_with_schedule()
