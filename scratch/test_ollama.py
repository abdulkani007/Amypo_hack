import requests
import json

res = requests.post("http://localhost:11434/api/generate", json={
    "model": "llama3.1:8b",
    "prompt": "Say hello in 3 words",
    "stream": False
}, timeout=30)
print("Status:", res.status_code)
print("Response:", res.json().get("response"))
