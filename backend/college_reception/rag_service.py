import os
import re
import time
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

import requests
import chromadb
from chromadb.config import Settings

from .config import (
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    OLLAMA_EMBED_MODEL,
    CHROMA_PERSIST_DIR,
    DOCUMENTS_DIR,
    COLLECTION_NAME,
)

logger = logging.getLogger(__name__)

_chroma_client = None
_collection = None


def get_chroma_client():
    """Initializes or returns the persistent ChromaDB client."""
    global _chroma_client
    if _chroma_client is None:
        os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False, is_persistent=True),
        )
    return _chroma_client


def get_collection():
    """Retrieves or creates the vector collection in ChromaDB."""
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


def check_ollama_health() -> Dict[str, Any]:
    """Verifies that the local Ollama daemon is reachable and checks model availability."""
    try:
        res = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        if res.status_code == 200:
            models_data = res.json().get("models", [])
            model_names = [m.get("name", "") for m in models_data]
            has_llm = any(OLLAMA_MODEL in name for name in model_names)
            has_embed = any(OLLAMA_EMBED_MODEL in name for name in model_names)
            return {
                "online": True,
                "url": OLLAMA_BASE_URL,
                "models_found": model_names,
                "llm_ready": has_llm,
                "embed_ready": has_embed,
                "target_model": OLLAMA_MODEL,
                "target_embed_model": OLLAMA_EMBED_MODEL,
            }
        return {"online": False, "error": f"HTTP {res.status_code}"}
    except Exception as exc:
        return {"online": False, "error": str(exc)}


def get_embedding(text: str) -> List[float]:
    """Generates embedding vector for a given text using local Ollama nomic-embed-text."""
    payload = {"model": OLLAMA_EMBED_MODEL, "prompt": text}
    
    # Try /api/embeddings first
    try:
        res = requests.post(f"{OLLAMA_BASE_URL}/api/embeddings", json=payload, timeout=30)
        if res.status_code == 200:
            return res.json().get("embedding", [])
    except Exception as e:
        logger.warning(f"Failed /api/embeddings: {e}. Trying /api/embed fallback...")

    # Fallback to /api/embed (newer Ollama versions)
    try:
        res = requests.post(
            f"{OLLAMA_BASE_URL}/api/embed", 
            json={"model": OLLAMA_EMBED_MODEL, "input": text}, 
            timeout=30
        )
        if res.status_code == 200:
            embeddings = res.json().get("embeddings", [])
            if embeddings:
                return embeddings[0]
    except Exception as e:
        logger.error(f"Ollama embedding request failed completely: {e}")
        raise RuntimeError(f"Could not connect to Ollama embedding service: {str(e)}")

    raise RuntimeError("Failed to generate embedding from Ollama.")


def chunk_markdown_document(filepath: Path) -> List[Dict[str, Any]]:
    """
    Parses a Markdown file into meaningful semantic sections based on headers.
    Ensures optimal chunk size and preserves document hierarchy metadata.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    filename = filepath.name
    category = filename.replace(".md", "").replace("_", " ").title()

    chunks: List[Dict[str, Any]] = []
    
    # Split by markdown headers (# or ## or ###)
    sections = re.split(r'\n(?=#{1,3}\s+)', content)
    
    chunk_index = 0
    for sec in sections:
        sec = sec.strip()
        if not sec:
            continue

        # Extract title from first line
        lines = sec.split("\n", 1)
        header_line = lines[0].strip()
        section_title = re.sub(r'^#{1,3}\s+', '', header_line).strip()
        if not section_title:
            section_title = f"{category} - Section {chunk_index + 1}"

        body = sec

        # If the section is very long, split into smaller sub-chunks
        max_chunk_chars = 800
        overlap = 150
        
        if len(body) > max_chunk_chars:
            start = 0
            sub_index = 1
            while start < len(body):
                end = start + max_chunk_chars
                sub_body = body[start:end].strip()
                if sub_body:
                    chunks.append({
                        "id": f"{filename}-{chunk_index}-{sub_index}",
                        "text": sub_body,
                        "metadata": {
                            "document": filename,
                            "category": category,
                            "section": f"{section_title} (Part {sub_index})",
                            "source": f"{filename}#{section_title}"
                        }
                    })
                    sub_index += 1
                start += (max_chunk_chars - overlap)
        else:
            chunks.append({
                "id": f"{filename}-{chunk_index}",
                "text": body,
                "metadata": {
                    "document": filename,
                    "category": category,
                    "section": section_title,
                    "source": f"{filename}#{section_title}"
                }
            })
        chunk_index += 1

    return chunks


def index_documents(force: bool = False) -> Dict[str, Any]:
    """
    Indexes all Markdown documents into the local ChromaDB vector store.
    Generates embeddings using nomic-embed-text via Ollama.
    """
    collection = get_collection()
    existing_count = collection.count()

    if existing_count > 0 and not force:
        return {
            "status": "already_indexed",
            "chunks_count": existing_count,
            "message": f"ChromaDB already contains {existing_count} chunks. Pass force=True to re-index."
        }

    # Reset collection if forcing
    if force and existing_count > 0:
        client = get_chroma_client()
        client.delete_collection(COLLECTION_NAME)
        global _collection
        _collection = client.create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        collection = _collection

    doc_files = list(DOCUMENTS_DIR.glob("*.md"))
    if not doc_files:
        raise FileNotFoundError(f"No markdown documents found in {DOCUMENTS_DIR}")

    all_chunks = []
    for doc_path in doc_files:
        chunks = chunk_markdown_document(doc_path)
        all_chunks.extend(chunks)

    logger.info(f"Generated {len(all_chunks)} chunks across {len(doc_files)} documents. Generating embeddings...")

    # Embed and insert chunks in batches
    batch_size = 10
    total_chunks = len(all_chunks)
    
    ids = []
    documents = []
    metadatas = []
    embeddings = []

    for idx, chunk in enumerate(all_chunks):
        emb = get_embedding(chunk["text"])
        ids.append(chunk["id"])
        documents.append(chunk["text"])
        metadatas.append(chunk["metadata"])
        embeddings.append(emb)

        if len(ids) >= batch_size or idx == total_chunks - 1:
            collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings
            )
            ids, documents, metadatas, embeddings = [], [], [], []

    return {
        "status": "indexed",
        "documents_count": len(doc_files),
        "chunks_count": collection.count(),
        "collection_name": COLLECTION_NAME
    }


def query_knowledge(query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """
    Retrieves the most relevant knowledge chunks from ChromaDB for a given query.
    """
    collection = get_collection()
    if collection.count() == 0:
        # Try auto-indexing if empty
        try:
            index_documents(force=False)
        except Exception as e:
            logger.warning(f"Could not auto-index documents: {e}")
            return []

    query_emb = get_embedding(query)
    results = collection.query(
        query_embeddings=[query_emb],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    retrieved_items = []
    if results and "documents" in results and results["documents"]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
        distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)

        for doc, meta, dist in zip(docs, metas, distances):
            # Cosine distance ranges from 0 (identical) to 2.
            # Convert to a human-readable similarity percentage (0-100%).
            relevance_pct = max(0, min(100, int((1.0 - (dist / 2.0)) * 100)))
            retrieved_items.append({
                "text": doc,
                "document": meta.get("document", "unknown.md"),
                "category": meta.get("category", "General"),
                "section": meta.get("section", "General Information"),
                "source": meta.get("source", meta.get("document", "unknown.md")),
                "distance": float(dist),
                "relevance_pct": relevance_pct
            })

    return retrieved_items


def generate_rag_answer(query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calls local Ollama llama3.1:8b with the grounded context to generate a factual response.
    Applies strict guardrails against hallucination.
    """
    if not chunks:
        return {
            "answer": "I could not find that information in the college knowledge base.",
            "sources": [],
            "model": OLLAMA_MODEL,
            "grounded": False
        }

    # Format context
    context_blocks = []
    for idx, c in enumerate(chunks, 1):
        context_blocks.append(
            f"--- [Document {idx}: {c['source']}] ---\n{c['text']}"
        )
    context_text = "\n\n".join(context_blocks)

    system_prompt = (
        "You are the official Digital Reception AI for Amypo Institute of Technology, Chennai. "
        "Your task is to answer students, parents, and visitors accurately using ONLY the provided institutional context.\n\n"
        "STRICT OPERATIONAL RULES:\n"
        "1. Base your answer EXCLUSIVELY on the provided local college documents context.\n"
        "2. If the user's question cannot be answered using the provided context, you must answer clearly: "
        "'I could not find that information in the college knowledge base.'\n"
        "3. Do NOT make up or assume facts, fees, contacts, names, or policies not present in the context.\n"
        "4. Structure your answer cleanly with bullet points or clear paragraphs where appropriate.\n"
        "5. Maintain an enterprise, professional, helpful tone."
    )

    user_prompt = (
        f"OFFICIAL INSTITUTIONAL CONTEXT:\n{context_text}\n\n"
        f"USER QUESTION:\n{query}\n\n"
        "ANSWER BASED SOLELY ON THE ABOVE CONTEXT:"
    )

    start_time = time.time()
    try:
        res = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "system": system_prompt,
                "prompt": user_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "top_p": 0.9,
                }
            },
            timeout=45
        )
        latency_ms = int((time.time() - start_time) * 1000)

        if res.status_code == 200:
            answer_text = res.json().get("response", "").strip()
            return {
                "answer": answer_text,
                "latency_ms": latency_ms,
                "model": OLLAMA_MODEL,
                "grounded": True
            }
        else:
            return {
                "answer": f"Error generating answer from Ollama (HTTP {res.status_code}): {res.text}",
                "latency_ms": latency_ms,
                "model": OLLAMA_MODEL,
                "grounded": False
            }
    except requests.exceptions.Timeout:
        return {
            "answer": "Ollama generation timed out. The local model may still be loading or system is under high load.",
            "latency_ms": int((time.time() - start_time) * 1000),
            "model": OLLAMA_MODEL,
            "grounded": False
        }
    except Exception as exc:
        return {
            "answer": f"Local AI generation unavailable: {str(exc)}",
            "latency_ms": int((time.time() - start_time) * 1000),
            "model": OLLAMA_MODEL,
            "grounded": False
        }
