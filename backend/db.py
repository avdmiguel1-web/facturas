import json
import sqlite3
from pathlib import Path
from threading import Lock

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "database.sqlite3"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

_LOCK = Lock()
_CONN = sqlite3.connect(DB_PATH, check_same_thread=False)
_CONN.row_factory = sqlite3.Row
_CONN.execute("PRAGMA foreign_keys = ON")

CREATE_DOCUMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    upload_date TEXT NOT NULL,
    processing_status TEXT NOT NULL,
    module_type TEXT,
    extracted_data TEXT,
    error_message TEXT
);
"""

CREATE_COST_CENTERS_TABLE = """
CREATE TABLE IF NOT EXISTS cost_centers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
);
"""

CREATE_MOBILE_ASSIGNMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS mobile_assignments (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    numero_movil TEXT NOT NULL,
    cost_center_id TEXT NOT NULL,
    cost_center_name TEXT NOT NULL,
    monto_bs REAL NOT NULL,
    created_at TEXT NOT NULL
);
"""

with _LOCK:
    _CONN.executescript("\n".join([
        CREATE_DOCUMENTS_TABLE,
        CREATE_COST_CENTERS_TABLE,
        CREATE_MOBILE_ASSIGNMENTS_TABLE,
    ]))
    _CONN.commit()


def row_to_dict(row):
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def fetch_all(query: str, params: tuple = ()): 
    with _LOCK:
        cursor = _CONN.execute(query, params)
        rows = cursor.fetchall()
        return [row_to_dict(row) for row in rows]


def fetch_one(query: str, params: tuple = ()): 
    with _LOCK:
        cursor = _CONN.execute(query, params)
        row = cursor.fetchone()
        return row_to_dict(row)


def execute(query: str, params: tuple = ()): 
    with _LOCK:
        cursor = _CONN.execute(query, params)
        _CONN.commit()
        return cursor


def adapt_json(value):
    if value is None:
        return None
    return json.dumps(value)


def parse_json(value):
    if value is None:
        return None
    return json.loads(value)
