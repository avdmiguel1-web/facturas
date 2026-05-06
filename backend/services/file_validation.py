import os
import re
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Dict, Optional

from PIL import Image, UnidentifiedImageError


class FileValidationError(ValueError):
    """Raised when an uploaded document is invalid or unsupported."""


MAX_FILE_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "150"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

SUPPORTED_FILE_TYPES: Dict[str, str] = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
    ".txt": "text/plain",
    ".csv": "text/csv",
}

SAFE_FILENAME_PATTERN = re.compile(r"[^A-Za-z0-9._() -]+")


def allowed_extensions_text() -> str:
    return ", ".join(sorted(SUPPORTED_FILE_TYPES.keys()))


def sanitize_filename(filename: str) -> str:
    clean_name = Path(filename or "").name.strip()
    if not clean_name:
        raise FileValidationError("El archivo no tiene un nombre valido.")

    clean_name = SAFE_FILENAME_PATTERN.sub("_", clean_name)
    return clean_name[:180]


def guess_mime_type(filename: str, declared_content_type: Optional[str] = None) -> str:
    extension = Path(filename).suffix.lower()
    supported_type = SUPPORTED_FILE_TYPES.get(extension)
    if not supported_type:
        raise FileValidationError(
            f"Formato no soportado para '{filename}'. Formatos permitidos: {allowed_extensions_text()}."
        )

    if declared_content_type and declared_content_type != "application/octet-stream":
        return declared_content_type

    return supported_type


def validate_upload_bytes(
    filename: str,
    file_bytes: bytes,
    declared_content_type: Optional[str] = None,
) -> Dict[str, object]:
    clean_name = sanitize_filename(filename)
    extension = Path(clean_name).suffix.lower()

    if extension not in SUPPORTED_FILE_TYPES:
        raise FileValidationError(
            f"Formato no soportado para '{clean_name}'. Formatos permitidos: {allowed_extensions_text()}."
        )

    if not file_bytes:
        raise FileValidationError(f"El archivo '{clean_name}' esta vacio.")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise FileValidationError(
            f"El archivo '{clean_name}' supera el limite de {MAX_FILE_SIZE_MB} MB."
        )

    _validate_file_signature(extension, file_bytes, clean_name)

    return {
        "filename": clean_name,
        "extension": extension,
        "file_size": len(file_bytes),
        "file_type": guess_mime_type(clean_name, declared_content_type),
    }


def validate_saved_file(file_path: str) -> Dict[str, object]:
    path = Path(file_path)
    if not path.exists() or not path.is_file():
        raise FileValidationError(f"El archivo '{path.name}' no existe o no puede leerse.")

    return validate_upload_bytes(path.name, path.read_bytes())


def _validate_file_signature(extension: str, file_bytes: bytes, filename: str) -> None:
    if extension == ".pdf":
        _validate_pdf(file_bytes, filename)
        return

    if extension in {".png", ".jpg", ".jpeg"}:
        _validate_image(file_bytes, filename)
        return

    if extension in {".docx", ".xlsx", ".xlsm"}:
        _validate_office_document(extension, file_bytes, filename)
        return

    if extension in {".txt", ".csv"}:
        _validate_text(file_bytes, filename)
        return

    raise FileValidationError(f"El archivo '{filename}' usa una extension no reconocida.")


def _validate_pdf(file_bytes: bytes, filename: str) -> None:
    if not file_bytes.lstrip().startswith(b"%PDF"):
        raise FileValidationError(f"El archivo '{filename}' no parece ser un PDF valido.")


def _validate_image(file_bytes: bytes, filename: str) -> None:
    try:
        with Image.open(BytesIO(file_bytes)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise FileValidationError(f"El archivo '{filename}' no es una imagen valida.") from exc


def _validate_office_document(extension: str, file_bytes: bytes, filename: str) -> None:
    if not zipfile.is_zipfile(BytesIO(file_bytes)):
        raise FileValidationError(
            f"El archivo '{filename}' no tiene una estructura valida de documento de Office."
        )

    expected_entries = {
        ".docx": "word/document.xml",
        ".xlsx": "xl/workbook.xml",
        ".xlsm": "xl/workbook.xml",
    }

    with zipfile.ZipFile(BytesIO(file_bytes)) as archive:
        archive_names = set(archive.namelist())
        if expected_entries[extension] not in archive_names:
            raise FileValidationError(
                f"El archivo '{filename}' no contiene la estructura esperada para {extension}."
            )


def _validate_text(file_bytes: bytes, filename: str) -> None:
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            decoded = file_bytes.decode(encoding)
            if decoded.strip():
                return
        except UnicodeDecodeError:
            continue

    raise FileValidationError(
        f"El archivo '{filename}' no pudo interpretarse como texto legible."
    )
