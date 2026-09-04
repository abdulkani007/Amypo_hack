import sys
import os
import time
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from college_reception.rag_service import index_documents, check_ollama_health
from college_reception.config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_EMBED_MODEL, COLLECTION_NAME


def run_seed():
    print("=" * 65)
    print("  AMYPO INSTITUTE OF TECHNOLOGY - LOCAL KNOWLEDGE BASE SEEDER  ")
    print("=" * 65)
    print(f"Ollama Base URL : {OLLAMA_BASE_URL}")
    print(f"Embedding Model : {OLLAMA_EMBED_MODEL}")
    print(f"Target LLM      : {OLLAMA_MODEL}")
    print(f"ChromaDB Target : {COLLECTION_NAME}")
    print("-" * 65)

    # 1. Check Ollama
    print("\n[1/3] Checking Ollama service connectivity...")
    health = check_ollama_health()
    if not health.get("online"):
        print(f"[ERROR] Ollama is not responding at {OLLAMA_BASE_URL}.")
        print("Please ensure Ollama is running (`ollama serve`) and try again.")
        sys.exit(1)
    
    print(f"[OK] Ollama is ONLINE at {OLLAMA_BASE_URL}")
    if not health.get("embed_ready"):
        print(f"[WARN] Embedding model '{OLLAMA_EMBED_MODEL}' was not found in `ollama list`.")
        print(f"Run: ollama pull {OLLAMA_EMBED_MODEL}")
    else:
        print(f"[OK] Embedding model '{OLLAMA_EMBED_MODEL}' is ready.")

    # 2. Index Documents
    print("\n[2/3] Indexing mock institutional documents into ChromaDB...")
    start_time = time.time()
    try:
        res = index_documents(force=True)
        duration = round(time.time() - start_time, 2)
        print(f"[OK] Successfully indexed {res.get('documents_count')} documents into {res.get('chunks_count')} vector chunks!")
        print(f"[INFO] Duration: {duration} seconds")
    except Exception as e:
        print(f"[ERROR] Indexing failed: {e}")
        sys.exit(1)

    # 3. Complete
    print("\n[3/3] Knowledge Base Seeding Complete!")
    print("=" * 65)
    print("Amypo Institute of Technology Digital Reception is ready for queries.")
    print("=" * 65)


if __name__ == "__main__":
    run_seed()
