import React, { useState } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle2, AlertOctagon, 
  Send, RefreshCw, Lock, ExternalLink, FileText, ArrowRight,
  HelpCircle, Eye, Mail
} from 'lucide-react';
import { verifySecurityContent } from './collegeApi';

export default function SecurityVerificationView({ onNavigate }) {
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [sender, setSender] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sampleScenarios = [
    {
      label: "Fake Internship Fee Demand",
      text: "Congratulations! You are selected for Summer Web Developer Internship at TechCorp. To confirm your slot, kindly transfer ₹3,000 for verification and kit allocation via UPI to techcorp@upi within 2 hours.",
      url: "",
      sender: "hr.techcorp.internships@gmail.com"
    },
    {
      label: "Unverified Placement Drive SMS",
      text: "Urgent: Amypo Campus Placement Shortlist announced for TCS Ninja. Pay ₹1,500 registration deposit immediately at http://tcs-amypo-careers.xyz to attend interview.",
      url: "http://tcs-amypo-careers.xyz",
      sender: "VM-PLACMT"
    },
    {
      label: "Legitimate College Circular",
      text: "All 5th semester students are informed that the End-Semester Examination timetable is released on the ERP portal. Download your hall tickets at erp.amypo.edu.in.",
      url: "https://erp.amypo.edu.in",
      sender: "examcell@amypo.edu.in"
    }
  ];

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const data = await verifySecurityContent(content, url || null, sender || null);
      setResult(data.fusion);
    } catch (err) {
      setResult({
        error: true,
        formatted_answer: `Verification error: ${err.message}`,
        risk_score: null,
        threat_level: 'ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadScenario = (s) => {
    setContent(s.text);
    setUrl(s.url);
    setSender(s.sender);
    setResult(null);
  };

  const riskScore = result?.risk_score;
  const threatLevel = result?.threat_level || 'UNKNOWN';
  const isHighRisk = threatLevel === 'HIGH RISK' || (riskScore && riskScore >= 70);
  const isSuspicious = threatLevel === 'SUSPICIOUS' || (riskScore && riskScore >= 40 && riskScore < 70);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield style={{ width: '18px', height: '18px', color: 'var(--accent-green)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff', textTransform: 'uppercase' }}>
              SECURITY_VERIFICATION_CONSOLE
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-vector threat verification checking communications against ScamON AI & Amypo Institutional Policies.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--accent-green)', background: 'var(--accent-green-dim)', border: '1px solid var(--accent-green)', padding: '4px 10px' }}>
            SCAMON INTEGRATION ACTIVE
          </span>
        </div>
      </div>

      {/* Input Console + Preset Scenarios */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <span className="card-title">SUBMIT_COMMUNICATION_FOR_AUDIT</span>

        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Load Test Sample:</span>
          {sampleScenarios.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadScenario(s)}
              style={{
                background: 'rgba(0, 230, 118, 0.05)',
                border: '1px solid rgba(0, 230, 118, 0.2)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                fontSize: '11px',
                fontFamily: 'var(--font-cyber)',
                cursor: 'pointer'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              MESSAGE TEXT / EMAIL BODY / OFFER DETAILS:
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste suspicious internship offer, job message, SMS text, or fee demand here..."
              style={{
                width: '100%',
                background: 'var(--bg-darker)',
                border: '1px solid var(--accent-green-dim)',
                color: '#fff',
                padding: '12px',
                fontSize: '12px',
                fontFamily: 'var(--font-cyber)',
                outline: 'none',
                lineHeight: '1.5'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                SUSPICIOUS URL (OPTIONAL):
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="e.g. http://tcs-amypo-careers.xyz"
                style={{
                  width: '100%',
                  background: 'var(--bg-darker)',
                  border: '1px solid var(--accent-green-dim)',
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-cyber)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                SENDER EMAIL / PHONE (OPTIONAL):
              </label>
              <input
                type="text"
                value={sender}
                onChange={e => setSender(e.target.value)}
                placeholder="e.g. hr.techcorp@gmail.com"
                style={{
                  width: '100%',
                  background: 'var(--bg-darker)',
                  border: '1px solid var(--accent-green-dim)',
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-cyber)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            style={{
              background: 'var(--accent-green)',
              color: '#000',
              border: 'none',
              padding: '12px 24px',
              fontSize: '12px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-cyber)',
              cursor: isLoading || !content.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px'
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw className="animate-spin" style={{ width: '14px', height: '14px' }} />
                <span>AUDITING THREAT VECTORS...</span>
              </>
            ) : (
              <>
                <Shield style={{ width: '14px', height: '14px' }} />
                <span>VERIFY WITH SCAMON & COLLEGE POLICY</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span className="card-title">VERIFICATION_AUDIT_REPORT</span>

          {/* Top Score Banner */}
          <div style={{ 
            background: isHighRisk ? 'rgba(255, 61, 0, 0.1)' : isSuspicious ? 'rgba(255, 160, 0, 0.1)' : 'rgba(0, 230, 118, 0.1)',
            border: `1px solid ${isHighRisk ? 'var(--accent-red)' : isSuspicious ? 'var(--accent-orange)' : 'var(--accent-green)'}`,
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OVERALL AUDIT VERDICT:</span>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: isHighRisk ? 'var(--accent-red)' : isSuspicious ? 'var(--accent-orange)' : 'var(--accent-green)',
                marginTop: '2px'
              }}>
                {result.final_assessment}
              </h3>
            </div>

            {riskScore !== null && riskScore !== undefined && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>THREAT SCORE</span>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: isHighRisk ? 'var(--accent-red)' : isSuspicious ? 'var(--accent-orange)' : 'var(--accent-green)' 
                }}>
                  {riskScore}/100
                </div>
              </div>
            )}
          </div>

          {/* Indicators */}
          {result.indicators && result.indicators.length > 0 && (
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                DETECTED THREAT MARKERS:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {result.indicators.map((ind, i) => (
                  <div key={i} style={{ 
                    background: 'rgba(2, 3, 5, 0.4)', 
                    border: '1px solid rgba(255, 61, 0, 0.3)', 
                    padding: '8px 12px', 
                    fontSize: '11px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle style={{ width: '13px', height: '13px', color: 'var(--accent-red)' }} />
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatted Full Assessment */}
          <div style={{ 
            fontSize: '12px', 
            lineHeight: '1.7', 
            color: 'var(--text-primary)',
            background: 'var(--bg-darker)',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            whiteSpace: 'pre-line'
          }}>
            {result.formatted_answer}
          </div>

          {/* Quick Routing to ScamON Forensic Agents */}
          {onNavigate && (
            <div style={{ 
              borderTop: '1px solid rgba(0, 230, 118, 0.2)', 
              paddingTop: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                  FORENSIC INVESTIGATION ACTIONS IN SCAMON:
                </span>
                <span style={{ fontSize: '9px', color: 'var(--accent-green)', background: 'rgba(0, 230, 118, 0.1)', padding: '2px 8px', border: '1px solid var(--accent-green-dim)' }}>
                  SCAMON BRIDGE ONLINE
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onNavigate('Email Investigation')}
                  style={{
                    background: 'rgba(255, 61, 0, 0.15)',
                    border: '1px solid #FF3D00',
                    color: '#fff',
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-cyber)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 10px rgba(255,61,0,0.2)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#FF3D00';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 61, 0, 0.15)';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  <Mail style={{ width: '13px', height: '13px' }} />
                  <span>INVESTIGATE SENDER IN SCAMON EMAIL AGENT ❯</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('Web & QR Scan')}
                  style={{
                    background: 'rgba(0, 230, 118, 0.08)',
                    border: '1px solid var(--accent-green)',
                    color: '#fff',
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-cyber)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent-green)';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0, 230, 118, 0.08)';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  <ExternalLink style={{ width: '13px', height: '13px' }} />
                  <span>SCAN DOMAIN IN SCAMON WEB SCANNER ❯</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('Complaint Agent')}
                  style={{
                    background: 'rgba(255, 160, 0, 0.08)',
                    border: '1px solid var(--accent-orange)',
                    color: '#fff',
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-cyber)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent-orange)';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 160, 0, 0.08)';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  <AlertTriangle style={{ width: '13px', height: '13px', color: 'var(--accent-orange)' }} />
                  <span>FILE INCIDENT REPORT WITH COMPLAINT AGENT ❯</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
