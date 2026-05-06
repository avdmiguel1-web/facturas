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
from routes.mobile_assignments import router as mobile_assignments_router
from routes.export_data import router as export_router

# Include routers
api_router.include_router(documents_router, prefix="/documents", tags=["documents"])
api_router.include_router(cost_centers_router, prefix="/cost-centers", tags=["cost-centers"])
api_router.include_router(mobile_assignments_router, prefix="/mobile-assignments", tags=["mobile-assignments"])
api_router.include_router(export_router, prefix="/export", tags=["export"])

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
