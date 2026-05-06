from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import logging

from db import execute, fetch_one, fetch_all
from models.cost_center import CostCenter, CostCenterCreate, CostCenterUpdate

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=CostCenter)
async def create_cost_center(cost_center: CostCenterCreate):
    """Create a new cost center"""
    cc = CostCenter(**cost_center.model_dump())
    
    execute(
        "INSERT INTO cost_centers (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        (
            cc.id,
            cc.name,
            cc.description,
            cc.created_at.isoformat(),
        ),
    )
    
    return cc

@router.get("/", response_model=List[CostCenter])
async def get_cost_centers():
    """Get all cost centers"""
    cost_centers = fetch_all("SELECT * FROM cost_centers ORDER BY created_at DESC")
    
    for cc in cost_centers:
        if isinstance(cc.get('created_at'), str):
            cc['created_at'] = datetime.fromisoformat(cc['created_at'])
    
    return cost_centers

@router.get("/{cost_center_id}", response_model=CostCenter)
async def get_cost_center(cost_center_id: str):
    """Get specific cost center"""
    cc = fetch_one("SELECT * FROM cost_centers WHERE id = ?", (cost_center_id,))
    if not cc:
        raise HTTPException(status_code=404, detail="Cost center not found")
    
    if isinstance(cc.get('created_at'), str):
        cc['created_at'] = datetime.fromisoformat(cc['created_at'])
    
    return cc

@router.put("/{cost_center_id}", response_model=CostCenter)
async def update_cost_center(cost_center_id: str, update_data: CostCenterUpdate):
    """Update cost center"""
    cc = fetch_one("SELECT * FROM cost_centers WHERE id = ?", (cost_center_id,))
    if not cc:
        raise HTTPException(status_code=404, detail="Cost center not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        set_clause = ", ".join([f"{key} = ?" for key in update_dict.keys()])
        execute(
            f"UPDATE cost_centers SET {set_clause} WHERE id = ?",
            tuple(update_dict.values()) + (cost_center_id,),
        )
    
    updated_cc = fetch_one("SELECT * FROM cost_centers WHERE id = ?", (cost_center_id,))
    if isinstance(updated_cc.get('created_at'), str):
        updated_cc['created_at'] = datetime.fromisoformat(updated_cc['created_at'])
    
    return updated_cc

@router.delete("/{cost_center_id}")
async def delete_cost_center(cost_center_id: str):
    """Delete cost center"""
    cc = fetch_one("SELECT * FROM cost_centers WHERE id = ?", (cost_center_id,))
    if not cc:
        raise HTTPException(status_code=404, detail="Cost center not found")
    
    execute("DELETE FROM cost_centers WHERE id = ?", (cost_center_id,))
    
    return {"status": "success", "message": "Cost center deleted"}
