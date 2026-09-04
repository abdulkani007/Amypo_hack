import sys
from pathlib import Path
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from college_reception.rag_service import query_knowledge, generate_rag_answer
from college_reception.router_service import classify_query_intent
from college_reception.fusion_service import fuse_policy_and_security
from college_reception.scamon_adapter import query_scamon_security_layer

print("--- TEST 1: Normal Academic Query ---")
q1 = "What is the CSE semester fee?"
intent1 = classify_query_intent(q1)
print(f"Query: '{q1}' -> Intent: {intent1['intent']}")
chunks1 = query_knowledge(q1, top_k=3)
print(f"Retrieved {len(chunks1)} chunks:")
for c in chunks1:
    print(f"  * {c['source']} (relevance: {c['relevance_pct']}%)")
ans1 = generate_rag_answer(q1, chunks1)
print("\nGenerated Answer:")
print(ans1["answer"])

print("\n--- TEST 2: Security Query ---")
q2 = "I received an internship email asking for ₹3,000 registration fee. Is it genuine?"
intent2 = classify_query_intent(q2)
print(f"Query: '{q2}' -> Intent: {intent2['intent']}")
chunks2 = query_knowledge(q2, top_k=2)
scamon_res = query_scamon_security_layer(q2)
fusion = fuse_policy_and_security(q2, chunks2, scamon_res)
print("\nFusion Final Assessment:")
print(fusion["final_assessment"])
print("\nFormatted Answer Preview:")
print(fusion["formatted_answer"][:400] + "...")

print("\n--- TEST 3: Out-of-domain Anti-Hallucination Guardrail ---")
q3 = "What is the astronaut training fee at Amypo?"
chunks3 = query_knowledge(q3, top_k=2)
ans3 = generate_rag_answer(q3, chunks3)
print("\nGuardrail Answer:")
print(ans3["answer"])
