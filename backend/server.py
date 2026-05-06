from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import shutil
import asyncio
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

EXPORT_DIR = Path("exports")
EXPORT_DIR.mkdir(exist_ok=True)

# Import routes from separate modules
from routes.documents import router as documents_router
from routes.cost_centers import router as cost_centers_router
from routes.categories import router as categories_router
from routes.assignments import router as mobile_assignments_router
from routes.export_data import router as export_router
from routes.exchange_rate import router as exchange_rate_router

# Include routers
api_router.include_router(documents_router, prefix="/documents", tags=["documents"])
api_router.include_router(cost_centers_router, prefix="/cost-centers", tags=["cost-centers"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(mobile_assignments_router, prefix="/mobile-assignments", tags=["mobile-assignments"])
api_router.include_router(export_router, prefix="/export", tags=["export"])
api_router.include_router(exchange_rate_router)

@api_router.get("/")
async def root():
    return {"message": "Intelligent Data Extraction API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

@api_router.get("/download-source")
async def download_source_code():
    """Download complete application source code"""
    file_path = Path(__file__).resolve().parent / "exports" / "data-extraction-app.zip"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Source code file not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=str(file_path),
        filename="data-extraction-app.zip",
        media_type="application/zip"
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_sync_exchange_rate():
    """Sincroniza la tasa de cambio al iniciar la aplicación"""
    try:
        from services.exchange_rate import get_exchange_rate_service
        service = get_exchange_rate_service()
        rate = await service.fetch_rate_from_bcv()
        if rate:
            logger.info(f"Tasa de cambio sincronizada al inicio: {rate}")
        else:
            logger.warning(f"No se sincronizó la tasa del BCV. Usando tasa por defecto: {service.DEFAULT_RATE}")
    except Exception as e:
        logger.error(f"Error sincronizando tasa al inicio: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        client.close()
    except NameError:
        logger.warning("No se encontró cliente para cerrar en el evento shutdown.")
    except Exception as exc:
        logger.warning(f"Error al cerrar cliente en shutdown: {exc}")
