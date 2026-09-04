from typing import Dict, Any, List


def fuse_policy_and_security(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    scamon_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Combines official institutional knowledge base findings with ScamON multi-agent
    forensic analysis to produce a grounded, dual-layered security assessment.
    """
    # 1. Extract college policy snippet
    college_policy_text = ""
    policy_sources = []
    if retrieved_chunks:
        for c in retrieved_chunks[:2]:
            policy_sources.append(c.get("source", "college_policy"))
        # Summarize policy excerpt
        college_policy_text = retrieved_chunks[0]["text"][:350].strip() + "..."
    else:
        college_policy_text = (
            "Amypo Institute of Technology policy strictly prohibits collecting any fees for "
            "internships, placements, or hall ticket distribution outside official ERP channels. "
            "Official internships and corporate recruitments never demand registration charges."
        )

    # 2. Extract ScamON metrics
    is_available = scamon_result.get("available", False)
    risk_score = scamon_result.get("risk_score")
    threat_level = scamon_result.get("threat_level", "UNKNOWN")
    indicators = scamon_result.get("indicators", [])

    # 3. Determine Final Assessment
    if not is_available:
        final_assessment = "NEEDS HUMAN REVIEW (ScamON Offline)"
        rec_summary = (
            "The college knowledge base confirms strict policies against paying fees for offers. "
            "However, automated ScamON verification was unavailable. Do NOT make any payments. "
            "Please bring the communication directly to the Placement Cell (Block B, Room 102)."
        )
    elif threat_level == "HIGH RISK" or (risk_score and risk_score >= 70):
        final_assessment = "HIGH RISK / LIKELY SCAM"
        rec_summary = (
            "DO NOT make any payment or click external links. This offer exhibits multiple high-risk "
            "scam indicators that directly violate Amypo Institute of Technology guidelines. "
            "Verify immediately with the Placement Cell (placement@amypo.edu.in)."
        )
    elif threat_level == "SUSPICIOUS" or (risk_score and risk_score >= 40):
        final_assessment = "SUSPICIOUS - EXERCISE CAUTION"
        rec_summary = (
            "Proceed with vigilance. While not definitively confirmed as malicious, this communication "
            "contains anomalous elements. Verify with your Department HOD before responding."
        )
    else:
        final_assessment = "LIKELY SAFE - VERIFY CREDENTIALS"
        rec_summary = (
            "No active threat indicators detected. Ensure all correspondence continues through official "
            "channels and never share OTPs or credentials."
        )

    # 4. Construct unified markdown output
    indicators_list = "\n".join([f"- {ind}" for ind in indicators]) if indicators else "- No anomalous threat signatures detected."
    
    score_display = f"{risk_score}/100" if risk_score is not None else "N/A (Offline)"

    markdown_response = f"""### 🏛️ Official College Policy
{college_policy_text}

### 🛡️ ScamON Security Analysis
- **Service Status**: {"ONLINE (Verified)" if is_available else "OFFLINE (Fallback Active)"}
- **Composite Threat Score**: **{score_display}**
- **Threat Classification**: **{threat_level}**
- **Detected Risk Indicators**:
{indicators_list}

### ⚖️ Final Assessment
**{final_assessment}**  
*(Note: Threat analysis is automated and evidence-driven; verify with institution authorities for definitive confirmation.)*

### 📋 Recommended Actions
{rec_summary}
"""

    return {
        "is_security_fusion": True,
        "college_policy": college_policy_text,
        "policy_sources": policy_sources,
        "scamon_result": scamon_result,
        "final_assessment": final_assessment,
        "risk_score": risk_score,
        "threat_level": threat_level,
        "indicators": indicators,
        "recommendation": rec_summary,
        "formatted_answer": markdown_response
    }
