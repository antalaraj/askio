import io
import logging
from typing import Dict, Any
from pypdf import PdfReader

logger = logging.getLogger(__name__)

MAX_FILE_BYTES = 5 * 1024 * 1024  # 5MB
MAX_EXTRACTED_CHARS = 15000
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".csv", ".json"}

def extract_document_text(filename: str, file_bytes: bytes) -> Dict[str, Any]:
    """
    Extract readable text from uploaded PDF or plain-text documents.
    """
    if not filename:
        return {"error": "Filename is missing."}

    if len(file_bytes) > MAX_FILE_BYTES:
        return {"error": "File exceeds the maximum allowed size of 5 MB."}

    lower_name = filename.lower()
    ext = "." + lower_name.rsplit(".", 1)[-1] if "." in lower_name else ""
    if ext not in ALLOWED_EXTENSIONS:
        return {
            "error": f"Unsupported file type '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }

    try:
        if ext == ".pdf":
            reader = PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)
            pages_text = []
            for idx, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                if txt.strip():
                    pages_text.append(f"[Page {idx + 1}]\n{txt.strip()}")
            full_text = "\n\n".join(pages_text)
        else:
            page_count = 1
            full_text = file_bytes.decode("utf-8", errors="replace").strip()

        if not full_text:
            return {"error": "No readable text could be extracted from this document."}

        truncated = len(full_text) > MAX_EXTRACTED_CHARS
        extracted = full_text[:MAX_EXTRACTED_CHARS]

        return {
            "filename": filename,
            "text": extracted,
            "char_count": len(extracted),
            "page_count": page_count,
            "truncated": truncated
        }
    except Exception as e:
        logger.error("Document extraction error for '%s': %s", filename, str(e))
        return {"error": f"Failed to parse document: {str(e)}"}
