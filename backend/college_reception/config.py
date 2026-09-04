import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=False)

BASE_DIR = Path(__file__).resolve().parent

# Ollama local configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# ChromaDB persistence directory
CHROMA_PERSIST_DIR = os.getenv(
    "CHROMA_PERSIST_DIR", 
    str(BASE_DIR / "data" / "chroma")
)

# ScamON backend URL (optional security layer)
SCAMON_BASE_URL = os.getenv("SCAMON_BASE_URL", "http://localhost:8001").rstrip("/")

# Data directory paths
DOCUMENTS_DIR = BASE_DIR / "data" / "documents"
DATABASE_DIR = BASE_DIR / "data" / "database"
DATABASE_FILE = DATABASE_DIR / "college_data.json"
HISTORY_FILE = BASE_DIR / "data" / "query_history.json"

# Collection name for ChromaDB
COLLECTION_NAME = "amypo_college_knowledge"
