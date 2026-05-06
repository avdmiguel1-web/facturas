from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import logging
from datetime import datetime

from db import fetch_one, fetch_all, parse_json
from services.excel_exporter import ExcelExporter

logger = logging.getLogger(__name__)
router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
EXPORT_DIR = BASE_DIR / "exports"
EXPORT_DIR.mkdir(exist_ok=True)

@router.get("/general/{document_id}")
async def export_general_data(document_id: str):
    """Export general billing data to Excel"""
    # Get document
    doc = fetch_one("SELECT * FROM documents WHERE id = ?", (document_id,))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc['extracted_data'] = parse_json(doc.get('extracted_data'))
    if not doc.get('extracted_data'):
        raise HTTPException(status_code=400, detail="No extracted data available")
    
    try:
        exporter = ExcelExporter()
        file_path = exporter.export_general_data(document_id, doc['extracted_data'])
        
        return FileResponse(
            path=file_path,
            filename=f"facturacion_general_{document_id}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        logger.error(f"Error exporting general data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting data: {str(e)}")

@router.get("/specialized/{document_id}")
async def export_specialized_data(document_id: str):
    """Export specialized analysis data to Excel"""
    # Get document
    doc = fetch_one("SELECT * FROM documents WHERE id = ?", (document_id,))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc['extracted_data'] = parse_json(doc.get('extracted_data'))
    if not doc.get('extracted_data'):
        raise HTTPException(status_code=400, detail="No extracted data available")
    
    # Get mobile assignments for this document
    assignments = fetch_all("SELECT * FROM mobile_assignments WHERE document_id = ?", (document_id,))
    
    try:
        exporter = ExcelExporter()
        file_path = exporter.export_specialized_data(document_id, doc['extracted_data'], assignments)
        
        return FileResponse(
            path=file_path,
            filename=f"analisis_especializado_{document_id}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        logger.error(f"Error exporting specialized data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting data: {str(e)}")
