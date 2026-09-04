import sys
import os
sys.path.insert(0, os.path.abspath('backend'))
sys.stdout.reconfigure(encoding='utf-8')

from college_reception.router_service import classify_query_intent
from college_reception.scamon_adapter import is_scamon_available, query_scamon_security_layer
from college_reception.rag_service import query_knowledge
from college_reception.fusion_service import fuse_policy_and_security

test_query = "I received an internship email asking for ₹3,000. Is it genuine?"

# 1. Intent routing
intent_res = classify_query_intent(test_query)
print("Intent:", intent_res["intent"])

# 2. Scamon availability & analysis
print("ScamON Available:", is_scamon_available())
scamon_res = query_scamon_security_layer(test_query)
print("Threat Level:", scamon_res["threat_level"])
print("Risk Score:", scamon_res["risk_score"])
print("Indicators:")
for ind in scamon_res["indicators"]:
    print(" -", ind)

# 3. Knowledge retrieval
chunks = query_knowledge("internship placement fee policy verification genuine offer")
print(f"Retrieved {len(chunks)} chunks")

# 4. Fusion
fusion = fuse_policy_and_security(test_query, chunks, scamon_res)
print("\n--- FINAL FUSION RESULT ---")
print("Assessment:", fusion["final_assessment"])
print("Formatted Answer:\n", fusion["formatted_answer"])
