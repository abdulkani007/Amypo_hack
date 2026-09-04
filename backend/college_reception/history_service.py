import json
import time
import uuid
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import HISTORY_FILE

logger = logging.getLogger(__name__)


def _load_history() -> List[Dict[str, Any]]:
    """Loads query history from the local JSON file."""
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading query history: {e}")
        return []


def _save_history(history: List[Dict[str, Any]]) -> None:
    """Saves query history to the local JSON file."""
    try:
        HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error saving query history: {e}")


def add_history_entry(
    question: str,
    detected_intent: str,
    answer: str,
    source_documents: List[str],
    scamon_used: bool = False,
    security_result: Optional[Dict[str, Any]] = None,
    latency_ms: int = 0
) -> Dict[str, Any]:
    """Appends a new query entry into the local history store."""
    history = _load_history()

    entry = {
        "id": f"AIT-QRY-{uuid.uuid4().hex[:8].upper()}",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "question": question,
        "detected_intent": detected_intent,
        "answer": answer,
        "source_documents": source_documents,
        "scamon_used": scamon_used,
        "security_result": security_result or {},
        "latency_ms": latency_ms
    }

    # Prepend newest first
    history.insert(0, entry)
    # Keep last 100 entries to prevent unbounded growth
    if len(history) > 100:
        history = history[:100]

    _save_history(history)
    return entry


def get_history(limit: int = 50, intent_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves previous query interactions, optionally filtered by intent."""
    history = _load_history()
    if intent_filter and intent_filter != "ALL":
        history = [h for h in history if h.get("detected_intent") == intent_filter]
    return history[:limit]


def clear_history() -> bool:
    """Clears all query history records."""
    try:
        _save_history([])
        return True
    except Exception:
        return False
