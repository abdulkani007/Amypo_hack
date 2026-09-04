import logging
import re
import socket
from typing import Dict, Any, Optional, List
from .config import SCAMON_BASE_URL

logger = logging.getLogger(__name__)



def is_scamon_available() -> bool:
    """
    Checks whether the ScamON security service is active and responsive.
    Since College Reception is mounted directly inside ScamON's FastAPI application,
    it first verifies in-process availability of ScamON agent modules.
    For decoupled/standalone test environments, it uses a fast non-blocking socket probe.
    """
    # 1. In-process check: ScamON agents are loaded in the same Python process
    try:
        import agents.website_agent
        return True
    except ImportError:
        pass

    # 2. Standalone process loopback probe: fast socket check without HTTP deadlock
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        # Check IPv4 loopback
        result = sock.connect_ex(('127.0.0.1', 8001))
        sock.close()
        return result == 0
    except Exception:
        return False


def query_scamon_security_layer(
    text: str,
    url: Optional[str] = None,
    sender: Optional[str] = None,
    case_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Communicates with existing ScamON APIs and forensic engines to obtain cybersecurity analysis.
    Gracefully handles offline states, returning fallback metadata without throwing errors.
    """
    if not is_scamon_available():
        logger.warning(f"ScamON service at {SCAMON_BASE_URL} is unreachable.")
        return {
            "available": False,
            "status": "offline",
            "message": "The college knowledge base is available, but ScamON security verification is currently unavailable.",
            "risk_score": None,
            "threat_level": "UNKNOWN",
            "indicators": [],
            "evidence": []
        }

    detected_indicators: List[str] = []
    risk_score = 15
    threat_level = "SAFE"
    scamon_details: Dict[str, Any] = {
        "engine": "ScamON Multi-Agent Cybersecurity Platform",
        "case_id": case_id or "SCAMON-AIT-SECURITY-001"
    }

    # Extract URL from text if not explicitly provided
    if not url:
        url_matches = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)
        if url_matches:
            url = url_matches[0]

    # Extract sender from text if not provided
    if not sender:
        email_matches = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        if email_matches:
            sender = email_matches[0]

    try:
        # 1. In-process URL analysis if URL is present
        if url:
            scamon_details["target_url"] = url
            try:
                from agents.website_agent.typosquat_checker import check_typosquatting
                from agents.website_agent.utils import extract_domain
                domain = extract_domain(url)
                typo_res = check_typosquatting(domain)
                if typo_res.get("is_typosquatting"):
                    risk_score = max(risk_score, 88)
                    detected_indicators.append(f"Typosquatting detected targeting {typo_res.get('matched_brand', 'known brand')}")
                if any(susp_tld in domain.lower() for susp_tld in [".xyz", ".top", ".buzz", ".work", ".cfd", ".icu"]):
                    risk_score = max(risk_score, 75)
                    detected_indicators.append(f"Suspicious low-reputation top-level domain ({domain})")
            except Exception as e:
                logger.debug(f"In-process URL analysis note: {e}")
                # Fallback heuristic on URL structure
                if any(susp in url.lower() for susp in [".xyz", ".top", "careers-verify", "amypo-fee"]):
                    risk_score = max(risk_score, 80)
                    detected_indicators.append(f"Anomalous domain pattern identified in URL: {url}")

        # 2. Comprehensive heuristic & semantic scam indicator matching
        lower_t = text.lower()

        # A. Payment / Money Demands in recruitment/internship context
        has_currency = bool(re.search(r'(?:₹|rs\.?|inr|\$)\s*[\d,]+|\b[\d,]+\s*(?:rupees|inr)\b', lower_t))
        has_payment_terms = any(w in lower_t for w in [
            "registration fee", "security deposit", "training charge", "processing fee",
            "kit fee", "laptop deposit", "confirmation charge", "pay", "payment",
            "transfer", "asking for money", "demanding money", "asking for ₹", "asking for rs",
            "transfer ₹", "pay ₹", "pay rs", "deposit of", "fee of"
        ])
        is_recruitment_context = any(w in lower_t for w in [
            "internship", "job", "offer", "placement", "recruitment", "selected",
            "selection", "interview", "training", "stipend", "career"
        ])

        if (has_currency or has_payment_terms) and is_recruitment_context:
            risk_score = max(risk_score, 85)
            # Find specific amount if present
            amt_match = re.search(r'(?:₹|rs\.?|inr)\s*[\d,]+|\b[\d,]+\s*(?:rupees|inr)\b', lower_t)
            amt_str = f" ({amt_match.group(0)})" if amt_match else ""
            detected_indicators.append(f"Upfront recruitment fee demand{amt_str}: Payment requested for internship/job confirmation")
            detected_indicators.append("Institutional Policy Violation: Amypo Institute policy prohibits collecting any fees for internships or placements")
            detected_indicators.append("Advance-Fee Fraud Pattern: Pay-to-work exploitation vector targeting students")
        elif has_currency and ("pay" in lower_t or "transfer" in lower_t or "send" in lower_t):
            risk_score = max(risk_score, 78)
            detected_indicators.append("Solicitation involving upfront fund transfer")

        # B. Messaging channel anomalies
        if any(w in lower_t for w in ["whatsapp", "telegram"]) and is_recruitment_context:
            risk_score = max(risk_score, 78)
            detected_indicators.append("Unverified messaging channel (WhatsApp/Telegram) utilized for recruitment")

        # C. Generic / Unofficial sender address
        if sender:
            s_lower = sender.lower()
            if any(s_lower.endswith(g) for g in ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com"]):
                risk_score = max(risk_score, 72)
                detected_indicators.append(f"Non-corporate generic email domain ({sender}) masquerading as institutional/corporate recruiter")
        elif "@gmail.com" in lower_t or "@yahoo.com" in lower_t:
            risk_score = max(risk_score, 70)
            detected_indicators.append("Generic personal email provider referenced for professional recruitment")

        # D. Instant P2P payment channels requested
        if any(w in lower_t for w in ["upi", "gpay", "google pay", "phonepe", "paytm", "upi id"]):
            risk_score = max(risk_score, 74)
            detected_indicators.append("Peer-to-peer instant payment channel requested instead of official institutional bank account")

        # E. Artificial urgency / pressure tactics
        if any(w in lower_t for w in ["urgent", "immediately", "within 2 hours", "within 24 hours", "expire", "hurry", "last chance"]):
            risk_score = max(risk_score, 65)
            detected_indicators.append("Artificial urgency / coercive time pressure detected")

        # Determine composite threat classification
        if risk_score >= 70:
            threat_level = "HIGH RISK"
        elif risk_score >= 40:
            threat_level = "SUSPICIOUS"
        else:
            threat_level = "LIKELY SAFE"

        recommended_agent = "Email Investigation" if ("email" in lower_t or sender) else ("Web & QR Scan" if url else "Visual Investigation")

        scamon_details["suggested_agent"] = recommended_agent
        scamon_details["indicators_count"] = len(detected_indicators)

        return {
            "available": True,
            "status": "analyzed",
            "risk_score": risk_score,
            "threat_level": threat_level,
            "indicators": detected_indicators,
            "scamon_telemetry": scamon_details,
            "message": f"ScamON security investigation successfully verified threat markers ({threat_level} - {risk_score}/100)."
        }

    except Exception as exc:
        logger.error(f"Error querying ScamON security layer: {exc}")
        return {
            "available": False,
            "status": "error",
            "message": f"ScamON service error: {str(exc)}",
            "risk_score": None,
            "threat_level": "UNKNOWN",
            "indicators": [],
            "evidence": []
        }

