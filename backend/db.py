import json
import sqlite3
import uuid
from datetime import datetime, timezone
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

CREATE_CATEGORIES_TABLE = """
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
);
"""

CREATE_SUBCATEGORIES_TABLE = """
CREATE TABLE IF NOT EXISTS subcategories (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
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

CREATE_EXCHANGE_RATES_TABLE = """
CREATE TABLE IF NOT EXISTS exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rate REAL NOT NULL,
    source TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    rate_date TEXT NOT NULL,
    note TEXT
);
"""

DEFAULT_CATEGORIES = {
    "SERVICIOS": [
        "Luz",
        "Agua",
        "Internet",
        "Mantenimiento",
        "Telefonia",
    ],
    "CONSUMOS": [
        "Materiales",
        "Repuestos",
        "Equipos",
        "Compras generales",
    ],
}


def ensure_default_categories():
    existing_categories = fetch_all("SELECT id, name FROM categories")
    existing_names = {category["name"] for category in existing_categories}
    category_ids = {category["name"]: category["id"] for category in existing_categories}

    for category_name, subcategory_names in DEFAULT_CATEGORIES.items():
        if category_name not in existing_names:
            category_id = str(uuid.uuid4())
            execute(
                "INSERT INTO categories (id, name, description, created_at) VALUES (?, ?, ?, ?)",
                (category_id, category_name, None, datetime.now(timezone.utc).isoformat()),
            )
            category_ids[category_name] = category_id
        else:
            category_id = category_ids[category_name]

        existing_subcategories = fetch_all(
            "SELECT name FROM subcategories WHERE category_id = ?",
            (category_id,),
        )
        existing_subcategory_names = {sub["name"] for sub in existing_subcategories}

        for subcategory_name in subcategory_names:
            if subcategory_name not in existing_subcategory_names:
                execute(
                    "INSERT INTO subcategories (id, category_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)",
                    (
                        str(uuid.uuid4()),
                        category_id,
                        subcategory_name,
                        None,
                        datetime.now(timezone.utc).isoformat(),
                    ),
                )

with _LOCK:
    _CONN.executescript("\n".join([
        CREATE_DOCUMENTS_TABLE,
        CREATE_COST_CENTERS_TABLE,
        CREATE_CATEGORIES_TABLE,
        CREATE_SUBCATEGORIES_TABLE,
        CREATE_MOBILE_ASSIGNMENTS_TABLE,
        CREATE_EXCHANGE_RATES_TABLE,
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


def get_latest_exchange_rate(rate_date: str = None):
    if rate_date:
        return fetch_one(
            "SELECT rate, source, fetched_at, rate_date, note FROM exchange_rates WHERE rate_date = ? ORDER BY fetched_at DESC LIMIT 1",
            (rate_date,),
        )

    return fetch_one(
        "SELECT rate, source, fetched_at, rate_date, note FROM exchange_rates ORDER BY fetched_at DESC LIMIT 1",
        (),
    )


def insert_exchange_rate(rate: float, source: str, rate_date: str, note: str = None):
    execute(
        "INSERT INTO exchange_rates (rate, source, fetched_at, rate_date, note) VALUES (?, ?, ?, ?, ?)",
        (rate, source, datetime.now(timezone.utc).isoformat(), rate_date, note),
    )

ensure_default_categories()


def adapt_json(value):
    if value is None:
        return None
    return json.dumps(value)


def parse_json(value):
    if value is None:
        return None
    return json.loads(value)
