from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import logging

from db import execute, fetch_one, fetch_all
from models.mobile_assignment import Assignment, AssignmentCreate, AssignmentUpdate

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=Assignment)
async def create_assignment(assignment: AssignmentCreate):
    """Assign a line to a cost center"""
    # Get cost center name
    cost_center = fetch_one("SELECT * FROM cost_centers WHERE id = ?", (assignment.cost_center_id,))
    if not cost_center:
        raise HTTPException(status_code=404, detail="Cost center not found")
    
    a = Assignment(
        **assignment.model_dump(),
        cost_center_name=cost_center['name']
    )

    existing_assignment = fetch_one(
        "SELECT * FROM assignments WHERE document_id = ? AND line_type = ? AND line_index = ?",
        (a.document_id, a.line_type, a.line_index),
    )

    if existing_assignment:
        execute(
            "UPDATE assignments SET line_identifier = ?, cost_center_id = ?, cost_center_name = ?, monto_bs = ? WHERE id = ?",
            (
                a.line_identifier,
                a.cost_center_id,
                a.cost_center_name,
                a.monto_bs,
                existing_assignment["id"],
            ),
        )
        updated_assignment = fetch_one("SELECT * FROM assignments WHERE id = ?", (existing_assignment["id"],))
        if isinstance(updated_assignment.get('created_at'), str):
            updated_assignment['created_at'] = datetime.fromisoformat(updated_assignment['created_at'])
        return updated_assignment

    execute(
        "INSERT INTO assignments (id, document_id, line_type, line_index, line_identifier, cost_center_id, cost_center_name, monto_bs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            a.id,
            a.document_id,
            a.line_type,
            a.line_index,
            a.line_identifier,
            a.cost_center_id,
            a.cost_center_name,
            a.monto_bs,
            a.created_at.isoformat(),
        ),
    )

    return a

@router.get("/", response_model=List[Assignment])
async def get_assignments(document_id: str = None):
    """Get all assignments, optionally filtered by document_id"""
    if document_id:
        assignments = fetch_all("SELECT * FROM assignments WHERE document_id = ?", (document_id,))
    else:
        assignments = fetch_all("SELECT * FROM assignments", ())
    
    for a in assignments:
        if isinstance(a.get('created_at'), str):
            a['created_at'] = datetime.fromisoformat(a['created_at'])
    
    return assignments

@router.get("/{assignment_id}", response_model=Assignment)
async def get_assignment(assignment_id: str):
    """Get specific assignment"""
    a = fetch_one("SELECT * FROM assignments WHERE id = ?", (assignment_id,))
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if isinstance(a.get('created_at'), str):
        a['created_at'] = datetime.fromisoformat(a['created_at'])
    
    return a

@router.put("/{assignment_id}", response_model=Assignment)
async def update_assignment(assignment_id: str, update_data: AssignmentUpdate):
    """Update assignment"""
    a = fetch_one("SELECT * FROM assignments WHERE id = ?", (assignment_id,))
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # If cost_center_id is being updated, get new cost center name
    if 'cost_center_id' in update_dict:
        cost_center = fetch_one("SELECT * FROM cost_centers WHERE id = ?", (update_dict['cost_center_id'],))
        if not cost_center:
            raise HTTPException(status_code=404, detail="Cost center not found")
        update_dict['cost_center_name'] = cost_center['name']
    
    if update_dict:
        set_clause = ", ".join([f"{key} = ?" for key in update_dict.keys()])
        execute(
            f"UPDATE assignments SET {set_clause} WHERE id = ?",
            tuple(update_dict.values()) + (assignment_id,),
        )
    
    updated_a = fetch_one("SELECT * FROM assignments WHERE id = ?", (assignment_id,))
    if isinstance(updated_a.get('created_at'), str):
        updated_a['created_at'] = datetime.fromisoformat(updated_a['created_at'])
    
    return updated_a

@router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: str):
    """Delete an assignment"""
    a = fetch_one("SELECT * FROM assignments WHERE id = ?", (assignment_id,))
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    execute("DELETE FROM assignments WHERE id = ?", (assignment_id,))
    
    return {"status": "success", "message": "Assignment deleted"}
