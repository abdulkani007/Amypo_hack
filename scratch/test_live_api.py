import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

payload = {
    "query": "I received an internship email asking for ₹3,000. Is it genuine?"
}

try:
    res = requests.post("http://127.0.0.1:8001/api/college/query", json=payload, timeout=30)
    print("Status Code:", res.status_code)
    data = res.json()
    print("Intent:", data.get("intent"))
    print("ScamON Used:", data.get("scamon_used"))
    fusion = data.get("security_fusion", {})
    print("Final Assessment:", fusion.get("final_assessment"))
    print("Risk Score:", fusion.get("risk_score"))
    print("Threat Level:", fusion.get("threat_level"))
    print("Indicators:")
    for ind in fusion.get("indicators", []):
        print(" -", ind)
    print("\nFormatted Answer:\n", data.get("answer"))
except Exception as e:
    print("Error querying server:", e)
