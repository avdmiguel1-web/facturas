from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List
from pathlib import Path
import shutil
from datetime import datetime, timezone
import logging

from db import execute, fetch_one, fetch_all, adapt_json, parse_json
from models.document import Document
from services.document_processor import DocumentProcessor

logger = logging.getLogger(__name__)
router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload", response_model=List[Document])
async def upload_documents(files: List[UploadFile] = File(...)):
    """Upload multiple documents for processing"""
    uploaded_docs = []
    
    for file in files:
        try:
            # Generate unique filename
            file_id = str(datetime.now(timezone.utc).timestamp()).replace('.', '')
            file_extension = Path(file.filename).suffix
            unique_filename = f"{file_id}_{file.filename}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Get file size
            file_size = os.path.getsize(file_path)
            
            # Create document record
            doc = Document(
                filename=file.filename,
                file_path=str(file_path),
                file_type=file.content_type or "application/octet-stream",
                file_size=file_size,
                processing_status="pending"
            )
            
            execute(
                "INSERT INTO documents (id, filename, file_path, file_type, file_size, upload_date, processing_status, module_type, extracted_data, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    doc.id,
                    doc.filename,
                    doc.file_path,
                    doc.file_type,
                    doc.file_size,
                    doc.upload_date.isoformat(),
                    doc.processing_status,
                    doc.module_type,
                    adapt_json(doc.extracted_data),
                    doc.error_message,
                ),
            )
            
            uploaded_docs.append(doc)
            
        except Exception as e:
            logger.error(f"Error uploading file {file.filename}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
    
    return uploaded_docs

@router.post("/{document_id}/process")
async def process_document(document_id: str, module_type: str = Form(...)):
    """Process a document with AI (Gemini)"""
    # Get document from database
    doc_dict = fetch_one("SELECT * FROM documents WHERE id = ?", (document_id,))
    if not doc_dict:
        raise HTTPException(status_code=404, detail="Document not found")
    
    execute(
        "UPDATE documents SET processing_status = ?, module_type = ? WHERE id = ?",
        ("processing", module_type, document_id),
    )
    
    try:
        # Process document with Gemini
        processor = DocumentProcessor()
        extracted_data = await processor.process_document(
            file_path=doc_dict['file_path'],
            module_type=module_type
        )
        
        # Update document with extracted data
        execute(
            "UPDATE documents SET processing_status = ?, extracted_data = ?, error_message = ? WHERE id = ?",
            ("completed", adapt_json(extracted_data), None, document_id),
        )
        
        return {"status": "success", "data": extracted_data}
        
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        execute(
            "UPDATE documents SET processing_status = ?, error_message = ? WHERE id = ?",
            ("failed", str(e), document_id),
        )
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.get("/", response_model=List[Document])
async def get_documents():
    """Get all documents (history)"""
    docs = fetch_all("SELECT * FROM documents ORDER BY upload_date DESC")
    
    for doc in docs:
        if isinstance(doc.get('upload_date'), str):
            doc['upload_date'] = datetime.fromisoformat(doc['upload_date'])
        doc['extracted_data'] = parse_json(doc.get('extracted_data'))
    
    return docs

@router.get("/{document_id}", response_model=Document)
async def get_document(document_id: str):
    """Get specific document by ID"""
    doc = fetch_one("SELECT * FROM documents WHERE id = ?", (document_id,))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if isinstance(doc.get('upload_date'), str):
        doc['upload_date'] = datetime.fromisoformat(doc['upload_date'])
    doc['extracted_data'] = parse_json(doc.get('extracted_data'))
    
    return doc

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    doc = fetch_one("SELECT * FROM documents WHERE id = ?", (document_id,))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    try:
        file_path = Path(doc['file_path'])
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
    
    execute("DELETE FROM documents WHERE id = ?", (document_id,))
    
    return {"status": "success", "message": "Document deleted"}
