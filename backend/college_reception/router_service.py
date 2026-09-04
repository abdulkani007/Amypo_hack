import re
from typing import Dict, Any, List


SECURITY_KEYWORDS = [
    "genuine", "real", "legitimate", "scam", "fraud", "fake", "phishing",
    "trust", "safe", "verify", "verification", "suspicious", "otp",
    "registration fee", "security deposit", "internship fee", "laptop fee",
    "demanding money", "asking for money", "asking to pay", "pay ₹", "pay rs",
    "send money", "transfer money", "google pay", "phonepe", "paytm", "upi id",
    "qr code", "whatsapp offer", "telegram offer", "sms link", "click link",
    "threat", "coercive", "hacked", "compromised", "unauthorized payment"
]

COLLEGE_ACADEMIC_KEYWORDS = [
    "fee", "fees", "tuition", "semester", "attendance", "hostel", "room",
    "mess", "exam", "examination", "hall ticket", "revaluation", "syllabus",
    "admission", "cutoff", "tnea", "management quota", "documents required",
    "internship", "placement", "recruiter", "package", "lpa", "scholarship",
    "first graduate", "post-matric", "timing", "office hours", "principal",
    "dean", "hod", "department", "cse", "it", "ece", "eee", "mech", "aids",
    "contact", "phone", "email", "bus", "transport", "library", "wifi",
    "calendar", "holiday", "dates", "sports", "club"
]


def classify_query_intent(query: str) -> Dict[str, Any]:
    """
    Classifies the user query into:
    - NORMAL_COLLEGE_QUERY: Academic, institutional, fees, contacts, hostel, attendance, policies.
    - SECURITY_QUERY: Verification of suspected scams, fraud offers, suspicious emails/SMS/links.
    - UNKNOWN_QUERY: Out of scope or ambiguous.
    """
    clean_q = query.strip()
    lower_q = clean_q.lower()

    # Extract potential URLs or emails
    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', clean_q)
    emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', clean_q)
    currency_matches = re.findall(r'(?:₹|rs\.?|inr)\s*[\d,]+|\b[\d,]+\s*(?:rupees|inr)\b', lower_q)

    # Check for security triggers
    security_matches = [kw for kw in SECURITY_KEYWORDS if kw in lower_q]
    
    # Check for URL scan request
    has_url = len(urls) > 0
    has_suspicious_payment = (
        len(currency_matches) > 0 and 
        any(k in lower_q for k in ["ask", "demand", "pay", "fee", "send", "transfer", "internship", "offer", "job"])
    )

    # 1. Clear security signals
    if security_matches or has_url or has_suspicious_payment or "otp" in lower_q:
        reasons = []
        if security_matches:
            reasons.append(f"Matched security keywords: {', '.join(security_matches[:3])}")
        if has_url:
            reasons.append(f"Contains URL for verification: {urls[0]}")
        if has_suspicious_payment:
            reasons.append("Contains suspicious payment reference associated with offer")

        return {
            "intent": "SECURITY_QUERY",
            "confidence": 0.95 if (len(security_matches) >= 2 or has_suspicious_payment) else 0.85,
            "reasons": reasons,
            "entities": {
                "urls": urls,
                "emails": emails,
                "currency_amounts": currency_matches
            }
        }

    # 2. Check for College Academic Query signals
    academic_matches = [kw for kw in COLLEGE_ACADEMIC_KEYWORDS if kw in lower_q]
    if academic_matches or any(q_word in lower_q for q_word in ["what", "when", "where", "how", "who", "which", "is there", "tell me"]):
        return {
            "intent": "NORMAL_COLLEGE_QUERY",
            "confidence": 0.92,
            "reasons": [f"Academic topic detected: {', '.join(academic_matches[:3]) or 'general enquiry'}"],
            "entities": {
                "urls": [],
                "emails": [],
                "currency_amounts": []
            }
        }

    # 3. Fallback
    return {
        "intent": "UNKNOWN_QUERY",
        "confidence": 0.60,
        "reasons": ["Unclassified user prompt"],
        "entities": {
            "urls": urls,
            "emails": emails,
            "currency_amounts": currency_matches
        }
    }
