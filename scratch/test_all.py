import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from agents.website_agent.main import app

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("   AMYPO INSTITUTE OF TECHNOLOGY - PS7 & SCAMON INTEGRATION SUITE   ")
    print("=" * 70)

    # 1. System Status Endpoint
    print("\n[TEST 1] Testing GET /api/college/system-status ...")
    res = client.get("/api/college/system-status")
    assert res.status_code == 200, f"Status code: {res.status_code}"
    status_data = res.json()
    print(f"  * System Ready : {status_data.get('system_ready')}")
    print(f"  * Ollama Status: {status_data['ollama']['status']} (LLM: {status_data['ollama']['llm_model']})")
    print(f"  * ChromaDB     : {status_data['chromadb']['status']} ({status_data['chromadb']['total_chunks_indexed']} chunks)")
    print(f"  * ScamON Layer : {status_data['scamon_security_layer']['status']}")
    print("  [PASS] System Status endpoint verified.")

    # 2. Documents Listing Endpoint
    print("\n[TEST 2] Testing GET /api/college/documents ...")
    res = client.get("/api/college/documents")
    assert res.status_code == 200
    docs = res.json().get("documents", [])
    print(f"  * Retrieved {len(docs)} documents:")
    for d in docs[:4]:
        print(f"    - {d['filename']}: {d['title']} ({d['word_count']} words)")
    assert len(docs) == 12, f"Expected 12 documents, got {len(docs)}"
    print("  [PASS] Documents listing endpoint verified (all 12 docs present).")

    # 3. Structured Database Endpoint
    print("\n[TEST 3] Testing GET /api/college/database ...")
    res = client.get("/api/college/database")
    assert res.status_code == 200
    db = res.json()
    print(f"  * Institution: {db['college']['name']}")
    print(f"  * Departments: {len(db['departments'])} departments ({', '.join(d['code'] for d in db['departments'])})")
    print("  [PASS] Structured mock database endpoint verified.")

    # 4. Academic Query: CSE Semester Fee
    print("\n[TEST 4] Testing POST /api/college/query (Academic: CSE fee) ...")
    res = client.post("/api/college/query", json={"query": "What is the CSE semester fee?"})
    assert res.status_code == 200
    q_data = res.json()
    print(f"  * Intent Classified: {q_data['intent']}")
    print(f"  * Sources Retrieved: {len(q_data['sources'])} chunks")
    for s in q_data['sources'][:2]:
        print(f"    - {s['source']} (relevance: {s['relevance_pct']}%)")
    print(f"  * Generated Answer : {q_data['answer']}")
    assert q_data['intent'] == "NORMAL_COLLEGE_QUERY"
    assert "85,000" in q_data['answer'] or "85000" in q_data['answer']
    print("  [PASS] Academic query answered factually from local knowledge.")

    # 5. Academic Query: Minimum Attendance
    print("\n[TEST 5] Testing POST /api/college/query (Academic: Attendance) ...")
    res = client.post("/api/college/query", json={"query": "What is the minimum attendance percentage required?"})
    assert res.status_code == 200
    q_data = res.json()
    print(f"  * Intent Classified: {q_data['intent']}")
    print(f"  * Generated Answer : {q_data['answer']}")
    assert "75" in q_data['answer']
    print("  [PASS] Attendance query answered factually (75% minimum).")

    # 6. Security Query: Suspicious Internship Fee Demand
    print("\n[TEST 6] Testing POST /api/college/query (Security: Internship Fee) ...")
    sec_q = "I received an internship email asking for ₹3,000 registration fee. Is it genuine?"
    res = client.post("/api/college/query", json={"query": sec_q})
    assert res.status_code == 200
    sec_data = res.json()
    print(f"  * Intent Classified: {sec_data['intent']}")
    print(f"  * ScamON Used      : {sec_data['scamon_used']}")
    print(f"  * Final Assessment : {sec_data['security_fusion']['final_assessment']}")
    print(f"  * Threat Level     : {sec_data['security_fusion']['threat_level']}")
    print(f"  * Detected Markers : {sec_data['security_fusion']['indicators']}")
    assert sec_data['intent'] == "SECURITY_QUERY"
    assert sec_data['scamon_used'] is True
    print("  [PASS] Security query routed to dual-layer policy + ScamON verification.")

    # 7. Anti-Hallucination Guardrail: Out of Domain
    print("\n[TEST 7] Testing POST /api/college/query (Guardrail: Astronaut Course) ...")
    res = client.post("/api/college/query", json={"query": "Does Amypo offer astronaut flight training courses?"})
    assert res.status_code == 200
    guard_data = res.json()
    print(f"  * Guardrail Answer: {guard_data['answer']}")
    assert any(w in guard_data['answer'].lower() for w in ["could not find", "not find", "does not offer", "no information", "not found"])
    print("  [PASS] Strict anti-hallucination guardrail verified.")

    # 8. Dedicated Security Verify Endpoint
    print("\n[TEST 8] Testing POST /api/college/security-verify ...")
    res = client.post("/api/college/security-verify", json={
        "content": "Pay ₹1,500 registration deposit at http://tcs-amypo-careers.xyz to attend campus placement interview.",
        "url": "http://tcs-amypo-careers.xyz"
    })
    assert res.status_code == 200
    verify_data = res.json()
    print(f"  * Final Assessment: {verify_data['fusion']['final_assessment']}")
    print(f"  * Threat Level    : {verify_data['fusion']['threat_level']}")
    print("  [PASS] Dedicated security verification tool verified.")

    # 9. Query History Endpoint
    print("\n[TEST 9] Testing GET /api/college/history ...")
    res = client.get("/api/college/history")
    assert res.status_code == 200
    hist = res.json()
    print(f"  * Recorded Queries in History: {hist['count']}")
    assert hist['count'] > 0
    print("  [PASS] Query history persistence verified.")

    # 10. ScamON Existing Health Check
    print("\n[TEST 10] Verifying existing ScamON Root Health Check ...")
    res = client.get("/")
    assert res.status_code == 200
    root_data = res.json()
    print(f"  * ScamON Service: {root_data.get('service')}")
    assert "ScamShield" in root_data.get('service') or "ScamON" in root_data.get('service')
    print("  [PASS] Existing ScamON functionality completely intact and responsive.")

    print("\n" + "=" * 70)
    print("   ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY! (100% GREEN)   ")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
