from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
import logging

from db import execute, fetch_one, fetch_all
from models.category import (
    Category,
    CategoryCreate,
    CategoryUpdate,
    Subcategory,
    SubcategoryCreate,
    SubcategoryUpdate,
)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=Category)
async def create_category(category: CategoryCreate):
    new_category = Category(**category.model_dump())

    execute(
        "INSERT INTO categories (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        (
            new_category.id,
            new_category.name,
            new_category.description,
            new_category.created_at.isoformat(),
        ),
    )

    return new_category

@router.get("/", response_model=List[Category])
async def get_categories():
    categories = fetch_all("SELECT * FROM categories ORDER BY name ASC")
    subcategories = fetch_all("SELECT * FROM subcategories ORDER BY name ASC")

    for category in categories:
        if isinstance(category.get("created_at"), str):
            category["created_at"] = datetime.fromisoformat(category["created_at"])
        category["subcategories"] = [
            sub for sub in subcategories if sub["category_id"] == category["id"]
        ]
        for sub in category["subcategories"]:
            if isinstance(sub.get("created_at"), str):
                sub["created_at"] = datetime.fromisoformat(sub["created_at"])

    return categories

@router.get("/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = fetch_one("SELECT * FROM categories WHERE id = ?", (category_id,))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if isinstance(category.get("created_at"), str):
        category["created_at"] = datetime.fromisoformat(category["created_at"])

    subcategories = fetch_all(
        "SELECT * FROM subcategories WHERE category_id = ? ORDER BY name ASC",
        (category_id,),
    )
    for sub in subcategories:
        if isinstance(sub.get("created_at"), str):
            sub["created_at"] = datetime.fromisoformat(sub["created_at"])

    category["subcategories"] = subcategories
    return category

@router.put("/{category_id}", response_model=Category)
async def update_category(category_id: str, update_data: CategoryUpdate):
    category = fetch_one("SELECT * FROM categories WHERE id = ?", (category_id,))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        set_clause = ", ".join([f"{key} = ?" for key in update_dict.keys()])
        execute(
            f"UPDATE categories SET {set_clause} WHERE id = ?",
            tuple(update_dict.values()) + (category_id,),
        )

    return await get_category(category_id)

@router.delete("/{category_id}")
async def delete_category(category_id: str):
    category = fetch_one("SELECT * FROM categories WHERE id = ?", (category_id,))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    execute("DELETE FROM categories WHERE id = ?", (category_id,))
    return {"status": "success", "message": "Category deleted"}

@router.post("/{category_id}/subcategories", response_model=Subcategory)
async def create_subcategory(category_id: str, subcategory: SubcategoryCreate):
    category = fetch_one("SELECT * FROM categories WHERE id = ?", (category_id,))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    new_subcategory = Subcategory(category_id=category_id, **subcategory.model_dump())
    execute(
        "INSERT INTO subcategories (id, category_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)",
        (
            new_subcategory.id,
            new_subcategory.category_id,
            new_subcategory.name,
            new_subcategory.description,
            new_subcategory.created_at.isoformat(),
        ),
    )

    return new_subcategory

@router.get("/subcategories", response_model=List[Subcategory])
async def get_subcategories(category_id: Optional[str] = None):
    query = "SELECT * FROM subcategories"
    params = ()
    if category_id:
        query += " WHERE category_id = ?"
        params = (category_id,)
    query += " ORDER BY name ASC"

    subcategories = fetch_all(query, params)
    for sub in subcategories:
        if isinstance(sub.get("created_at"), str):
            sub["created_at"] = datetime.fromisoformat(sub["created_at"])

    return subcategories

@router.put("/subcategories/{subcategory_id}", response_model=Subcategory)
async def update_subcategory(subcategory_id: str, update_data: SubcategoryUpdate):
    subcategory = fetch_one("SELECT * FROM subcategories WHERE id = ?", (subcategory_id,))
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        if update_dict.get("category_id"):
            parent = fetch_one("SELECT * FROM categories WHERE id = ?", (update_dict["category_id"],))
            if not parent:
                raise HTTPException(status_code=404, detail="Category not found")

        set_clause = ", ".join([f"{key} = ?" for key in update_dict.keys()])
        execute(
            f"UPDATE subcategories SET {set_clause} WHERE id = ?",
            tuple(update_dict.values()) + (subcategory_id,),
        )

    updated = fetch_one("SELECT * FROM subcategories WHERE id = ?", (subcategory_id,))
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])

    return updated

@router.delete("/subcategories/{subcategory_id}")
async def delete_subcategory(subcategory_id: str):
    subcategory = fetch_one("SELECT * FROM subcategories WHERE id = ?", (subcategory_id,))
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    execute("DELETE FROM subcategories WHERE id = ?", (subcategory_id,))
    return {"status": "success", "message": "Subcategory deleted"}
