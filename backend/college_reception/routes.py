import json
import time
import re
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query

from .config import (
    DOCUMENTS_DIR,
    DATABASE_FILE,
    OLLAMA_MODEL,
    OLLAMA_EMBED_MODEL,
    COLLECTION_NAME,
    SCAMON_BASE_URL
)
from .rag_service import (
    query_knowledge,
    generate_rag_answer,
    index_documents,
    check_ollama_health,
    get_collection
)
from .router_service import classify_query_intent
from .scamon_adapter import is_scamon_available, query_scamon_security_layer
from .fusion_service import fuse_policy_and_security
from .history_service import add_history_entry, get_history, clear_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/college", tags=["Amypo College Reception AI"])


# Pydantic Request & Response Schemas
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Student or visitor question")
    top_k: int = Field(default=4, ge=1, le=10, description="Number of knowledge chunks to retrieve")


class SecurityVerifyRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Email text, SMS, offer message, or URL to verify")
    url: Optional[str] = Field(None, description="Optional embedded link to scan")
    sender: Optional[str] = Field(None, description="Optional sender phone or email")


@router.post("/query")
@router.post("/chat")
async def handle_college_query(req: QueryRequest):
    """
    Core Question-Answering endpoint for Amypo College Reception.
    Triages between Normal Academic Queries (Local RAG + Ollama)
    and Security Queries (Local Policy + ScamON + Response Fusion).
    """
    start_time = time.time()
    raw_query = req.query.strip()
    logs: List[str] = [f"QUERY_RECEIVED: \"{raw_query[:50]}...\"" if len(raw_query) > 50 else f"QUERY_RECEIVED: \"{raw_query}\""]

    # 1. Intent Classification
    intent_data = classify_query_intent(raw_query)
    intent = intent_data["intent"]
    confidence = intent_data["confidence"]
    logs.append(f"CLASSIFYING_INTENT: {intent} (Confidence: {int(confidence*100)}%)")

    # 2. Branch: Security Query vs Normal Query
    if intent == "SECURITY_QUERY":
        logs.append("ROUTE: SECURITY_VERIFICATION_LAYER")
        logs.append("RETRIEVING_COLLEGE_POLICY_CONTEXT (ChromaDB)")
        
        # Retrieve relevant college policy (internship, fees, placement)
        retrieved_chunks = query_knowledge(raw_query, top_k=3)
        sources = [c["source"] for c in retrieved_chunks]
        logs.append(f"COLLEGE_POLICY_RETRIEVED ({len(retrieved_chunks)} chunks)")

        # Call ScamON Security Adapter
        logs.append("CALLING_SCAMON_SECURITY_ADAPTER")
        scamon_res = query_scamon_security_layer(
            text=raw_query,
            url=intent_data["entities"]["urls"][0] if intent_data["entities"]["urls"] else None,
            sender=intent_data["entities"]["emails"][0] if intent_data["entities"]["emails"] else None
        )
        if scamon_res.get("available"):
            logs.append(f"SCAMON_ANALYSIS_COMPLETE: Risk Score {scamon_res.get('risk_score')}/100, Threat {scamon_res.get('threat_level')}")
        else:
            logs.append("SCAMON_OFFLINE: Fallback to local institutional policy")

        # Fuse Policy and Security Findings
        logs.append("FUSING_LOCAL_POLICY_WITH_SECURITY_FINDINGS")
        fusion = fuse_policy_and_security(raw_query, retrieved_chunks, scamon_res)
        answer = fusion["formatted_answer"]
        logs.append("RESPONSE_READY (Dual-layer response fusion complete)")

        latency_ms = int((time.time() - start_time) * 1000)

        # Store in local history
        add_history_entry(
            question=raw_query,
            detected_intent=intent,
            answer=answer,
            source_documents=sources,
            scamon_used=True,
            security_result=fusion,
            latency_ms=latency_ms
        )

        return {
            "query": raw_query,
            "intent": intent,
            "confidence": confidence,
            "answer": answer,
            "sources": retrieved_chunks,
            "scamon_used": True,
            "security_fusion": fusion,
            "logs": logs,
            "processing_time_ms": latency_ms,
            "model": OLLAMA_MODEL,
            "status": "success"
        }

    else:
        # Normal Academic Query -> Local RAG + ChromaDB + Ollama
        logs.append("ROUTE: LOCAL_RAG_PIPELINE")
        logs.append(f"EMBEDDING_QUERY via {OLLAMA_EMBED_MODEL}")
        
        retrieved_chunks = query_knowledge(raw_query, top_k=req.top_k)
        sources = [c["source"] for c in retrieved_chunks]
        logs.append(f"SEARCHING_CHROMADB: Retrieved {len(retrieved_chunks)} relevant knowledge chunks")

        logs.append(f"OLLAMA_GENERATION ({OLLAMA_MODEL} with grounded context)")
        rag_res = generate_rag_answer(raw_query, retrieved_chunks)
        answer = rag_res["answer"]
        logs.append(f"RESPONSE_READY ({rag_res.get('latency_ms', 0)}ms)")

        latency_ms = int((time.time() - start_time) * 1000)

        # Average relevance percentage
        avg_relevance = 0
        if retrieved_chunks:
            avg_relevance = sum(c.get("relevance_pct", 0) for c in retrieved_chunks) // len(retrieved_chunks)

        # Store in local history
        add_history_entry(
            question=raw_query,
            detected_intent=intent,
            answer=answer,
            source_documents=sources,
            scamon_used=False,
            security_result=None,
            latency_ms=latency_ms
        )

        return {
            "query": raw_query,
            "intent": intent,
            "confidence": confidence,
            "answer": answer,
            "sources": retrieved_chunks,
            "average_relevance": avg_relevance,
            "scamon_used": False,
            "logs": logs,
            "processing_time_ms": latency_ms,
            "model": OLLAMA_MODEL,
            "status": "success"
        }


@router.post("/security-verify")
async def verify_security_content(req: SecurityVerifyRequest):
    """
    Dedicated security verification tool for inspecting suspicious offers,
    recruitment communications, payment demands, or unknown URLs.
    """
    start_time = time.time()
    content = req.content.strip()

    # 1. Retrieve related college guidelines (internship/fee/placement warnings)
    policy_chunks = query_knowledge(f"fraud warning scam policy {content[:100]}", top_k=3)

    # 2. Call ScamON layer
    scamon_res = query_scamon_security_layer(
        text=content,
        url=req.url,
        sender=req.sender
    )

    # 3. Fuse findings
    fusion = fuse_policy_and_security(content, policy_chunks, scamon_res)
    latency_ms = int((time.time() - start_time) * 1000)

    # 4. Save to history
    add_history_entry(
        question=f"[Security Verify] {content[:60]}...",
        detected_intent="SECURITY_VERIFICATION",
        answer=fusion["formatted_answer"],
        source_documents=[c["source"] for c in policy_chunks],
        scamon_used=True,
        security_result=fusion,
        latency_ms=latency_ms
    )

    return {
        "status": "success",
        "content_preview": content[:120],
        "fusion": fusion,
        "processing_time_ms": latency_ms
    }


@router.get("/documents")
async def list_documents():
    """Returns metadata for all mock institutional knowledge documents."""
    docs = []
    for p in sorted(DOCUMENTS_DIR.glob("*.md")):
        with open(p, "r", encoding="utf-8") as f:
            text = f.read()
        
        # First header as title
        title_match = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else p.stem.replace("_", " ").title()

        docs.append({
            "filename": p.name,
            "title": title,
            "category": p.stem.replace("_", " ").title(),
            "size_bytes": p.stat().st_size,
            "word_count": len(text.split()),
            "last_modified": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(p.stat().st_mtime))
        })
    return {"documents": docs, "total_count": len(docs)}


@router.get("/documents/{filename}")
async def get_document_content(filename: str):
    """Retrieves full markdown text of a specific knowledge document."""
    doc_path = DOCUMENTS_DIR / filename
    if not doc_path.exists() or not doc_path.is_file():
        raise HTTPException(status_code=404, detail="Document not found")
    
    with open(doc_path, "r", encoding="utf-8") as f:
        content = f.read()

    return {
        "filename": filename,
        "content": content
    }


@router.get("/database")
async def get_mock_database():
    """Returns the structured mock institutional JSON database."""
    if not DATABASE_FILE.exists():
        raise HTTPException(status_code=404, detail="Database file not found")
    
    with open(DATABASE_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data


@router.get("/system-status")
async def get_system_status():
    """
    Live system diagnostics check for:
    - Local Ollama status & models
    - Local ChromaDB vector database
    - Mock Institutional Knowledge documents
    - ScamON Security Layer adapter
    """
    ollama_stat = check_ollama_health()
    scamon_online = is_scamon_available()

    chroma_ready = False
    chunks_indexed = 0
    try:
        col = get_collection()
        chunks_indexed = col.count()
        chroma_ready = True
    except Exception:
        pass

    docs_count = len(list(DOCUMENTS_DIR.glob("*.md")))
    db_ready = DATABASE_FILE.exists()

    return {
        "institution": "Amypo Institute of Technology",
        "system_ready": (ollama_stat.get("online", False) and chroma_ready and db_ready),
        "ollama": {
            "status": "ONLINE" if ollama_stat.get("online") else "OFFLINE",
            "url": ollama_stat.get("url"),
            "llm_model": OLLAMA_MODEL,
            "embed_model": OLLAMA_EMBED_MODEL,
            "llm_ready": ollama_stat.get("llm_ready", False),
            "embed_ready": ollama_stat.get("embed_ready", False),
            "available_models": ollama_stat.get("models_found", [])
        },
        "chromadb": {
            "status": "ONLINE" if chroma_ready else "ERROR",
            "collection_name": COLLECTION_NAME,
            "total_chunks_indexed": chunks_indexed
        },
        "knowledge_base": {
            "status": "READY" if docs_count > 0 else "EMPTY",
            "total_markdown_documents": docs_count,
            "database_json_present": db_ready
        },
        "scamon_security_layer": {
            "status": "ONLINE" if scamon_online else "OFFLINE (Graceful Fallback)",
            "base_url": SCAMON_BASE_URL,
            "optional_mode": True
        }
    }


@router.post("/index")
async def trigger_indexing(force: bool = Query(True, description="Force re-indexing")):
    """Triggers indexing of all mock documents into local ChromaDB with nomic-embed-text."""
    try:
        res = index_documents(force=force)
        return {"status": "success", "result": res}
    except Exception as exc:
        logger.error(f"Error during document indexing: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/history")
async def fetch_query_history(limit: int = 50, intent: str = "ALL"):
    """Fetches historical queries, answers, and sources."""
    items = get_history(limit=limit, intent_filter=intent)
    return {"history": items, "count": len(items)}


@router.delete("/history")
async def delete_query_history():
    """Clears query interaction history."""
    success = clear_history()
    return {"status": "success" if success else "error"}
