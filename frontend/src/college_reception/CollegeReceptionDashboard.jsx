import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Shield, Search, Send, RefreshCw, Cpu, Database, 
  FileText, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink,
  Layers, Clock, Sparkles, BookOpen, AlertOctagon, Check, Mail,
  Copy, RotateCcw, GraduationCap, CreditCard, Building, 
  ChevronDown, ChevronUp, Maximize2, Minimize2, MessageSquare,
  ShieldCheck, HelpCircle, User, Bot, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { submitCollegeQuery, fetchSystemStatus } from './collegeApi';

// 4 Highlighted Starter Topic Cards (Like ChatGPT / Claude)
const STARTER_CARDS = [
  {
    id: 'academic',
    icon: GraduationCap,
    category: 'Academics & Attendance',
    title: 'Minimum Attendance Rules',
    query: 'What is the minimum attendance percentage required for semester exams?',
    desc: 'Anna University regulations, medical condonation, and exam eligibility criteria.'
  },
  {
    id: 'fees',
    icon: CreditCard,
    category: 'Tuition & Payments',
    title: 'CSE Tuition & Exam Fees',
    query: 'What is the CSE semester fee and exam fee schedule?',
    desc: 'Department tuition structure, examination fees, and official ERP payment channels.'
  },
  {
    id: 'security',
    icon: Shield,
    category: 'ScamON Threat Verification',
    title: 'Verify Suspicious Internship Offer',
    query: 'I received an internship email asking for ₹3,000. Is it genuine?',
    desc: 'Multi-vector cyber verification checking fee demands against college placement policy.'
  },
  {
    id: 'hostel',
    icon: Building,
    category: 'Campus & Hostels',
    title: 'Hostel Blocks & Annual Fees',
    query: 'What are the hostel blocks, mess timings, and annual fees?',
    desc: 'Accommodation details for Kurinji, Mullai, and Kaveri blocks with curfew rules.'
  }
];

const SUGGESTED_CHIPS = [
  "What scholarships are available for students?",
  "What are the placement eligibility rules?",
  "What is the exam cell email and office location?",
  "What is the first graduate scholarship amount?",
  "What are the library timings and book lending limit?"
];

// Inline Markdown formatter for headings, quotes, bold, code, and lists
const renderInlineMarkdown = (text) => {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} style={{ color: '#fff', fontWeight: 'bold' }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code 
          key={match.index} 
          style={{
            background: 'rgba(0, 230, 118, 0.08)',
            color: 'var(--accent-green)',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '12px',
            fontFamily: 'var(--font-cyber)',
            border: '1px solid var(--accent-green-dim)'
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
};

const renderFormattedContent = (content) => {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let inQuote = false;
  let quoteBuffer = [];

  const flushQuote = (key) => {
    if (quoteBuffer.length > 0) {
      elements.push(
        <div 
          key={key} 
          style={{
            margin: '12px 0',
            padding: '12px 16px',
            background: 'rgba(0, 230, 118, 0.04)',
            borderLeft: '3px solid var(--accent-green)',
            borderRadius: '0 4px 4px 0',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: '1.6'
          }}
        >
          {quoteBuffer.map((ql, qIdx) => (
            <div key={qIdx}>{renderInlineMarkdown(ql)}</div>
          ))}
        </div>
      );
      quoteBuffer = [];
      inQuote = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('>')) {
      inQuote = true;
      quoteBuffer.push(trimmed.replace(/^>\s*/, ''));
      return;
    } else if (inQuote) {
      flushQuote(`quote_${idx}`);
    }

    if (!trimmed) {
      elements.push(<div key={`sp_${idx}`} style={{ height: '8px' }} />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 
          key={`h3_${idx}`}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'var(--accent-green)',
            marginTop: '14px',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '0.5px'
          }}
        >
          {renderInlineMarkdown(trimmed.replace('### ', ''))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 
          key={`h2_${idx}`}
          style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: '#fff',
            borderBottom: '1px solid rgba(0, 230, 118, 0.15)',
            paddingBottom: '4px',
            marginTop: '16px',
            marginBottom: '8px'
          }}
        >
          {renderInlineMarkdown(trimmed.replace('## ', ''))}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div 
          key={`li_${idx}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            margin: '4px 0',
            fontSize: '13px',
            color: 'var(--text-primary)',
            lineHeight: '1.6'
          }}
        >
          <span style={{ color: 'var(--accent-green)', fontSize: '11px', marginTop: '2px' }}>❯</span>
          <div style={{ flex: 1 }}>{renderInlineMarkdown(trimmed.slice(2))}</div>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)/);
      elements.push(
        <div 
          key={`num_${idx}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            margin: '4px 0',
            fontSize: '13px',
            color: 'var(--text-primary)',
            lineHeight: '1.6'
          }}
        >
          <span style={{ 
            color: 'var(--accent-green)', 
            fontWeight: 'bold', 
            fontSize: '11px', 
            background: 'rgba(0, 230, 118, 0.1)', 
            padding: '1px 6px',
            borderRadius: '2px'
          }}>
            {match[1]}
          </span>
          <div style={{ flex: 1 }}>{renderInlineMarkdown(match[2])}</div>
        </div>
      );
    } else {
      elements.push(
        <p 
          key={`p_${idx}`}
          style={{
            fontSize: '13px',
            lineHeight: '1.65',
            color: 'var(--text-primary)',
            margin: '4px 0'
          }}
        >
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  if (inQuote) {
    flushQuote('quote_end');
  }

  return elements;
};

export default function CollegeReceptionDashboard({ onNavigate }) {
  // Multi-Turn Conversational Feed
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // SOC Live Daemon Logs
  const [activityLogs, setActivityLogs] = useState([
    "RECEPTION_DAEMON_INITIALIZED",
    "LISTENING_ON_CHROMA_VECTOR_SOCKET",
    "SCAMON_CYBER_BRIDGE_ATTACHED"
  ]);

  // System Diagnostics
  const [systemStatus, setSystemStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // UI Interactive States
  const [showTelemetryHUD, setShowTelemetryHUD] = useState(true);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});

  const chatEndRef = useRef(null);
  const logsEndRef = useRef(null);
  const inputRef = useRef(null);

  // Poll system status
  const loadStatus = async () => {
    try {
      const stat = await fetchSystemStatus();
      setSystemStatus(stat);
    } catch (e) {
      console.warn("Could not load system status:", e);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLogs]);

  // Handle Query Submission
  const handleQuerySubmit = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const queryToSend = textOverride || inputQuery;
    if (!queryToSend.trim() || isLoading) return;

    const userMessageId = 'usr_' + Date.now();
    const assistantMessageId = 'asst_' + (Date.now() + 1);

    // 1. Append User Message
    const userMsg = {
      id: userMessageId,
      role: 'user',
      content: queryToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 2. Append Assistant Loading Placeholder
    const placeholderMsg = {
      id: assistantMessageId,
      role: 'assistant',
      loading: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg, placeholderMsg]);
    setInputQuery('');
    setIsLoading(true);

    // Append Telemetry
    setActivityLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] QUERY_RECEIVED: "${queryToSend.slice(0, 40)}${queryToSend.length > 40 ? '...' : ''}"`,
      `[${new Date().toLocaleTimeString()}] CLASSIFYING_INTENT_AND_ROUTING...`
    ]);

    try {
      const data = await submitCollegeQuery(queryToSend);

      // Append backend logs if any
      if (data.logs && Array.isArray(data.logs)) {
        setActivityLogs(prev => [
          ...prev,
          ...data.logs.map(l => `[${new Date().toLocaleTimeString()}] ${l}`)
        ]);
      } else {
        setActivityLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ROUTE: ${data.intent || 'NORMAL_COLLEGE_QUERY'}`,
          `[${new Date().toLocaleTimeString()}] RESPONSE_READY in ${data.processing_time_ms}ms`
        ]);
      }

      // Update Assistant Message with full payload
      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMessageId) {
          return {
            ...msg,
            loading: false,
            content: data.answer,
            intent: data.intent,
            sources: data.sources || [],
            scamon_used: data.scamon_used,
            security_fusion: data.security_fusion,
            processing_time_ms: data.processing_time_ms,
            model: data.model || 'llama3.1:8b'
          };
        }
        return msg;
      }));
    } catch (err) {
      setActivityLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ERROR: ${err.message}`
      ]);

      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMessageId) {
          return {
            ...msg,
            loading: false,
            error: true,
            content: `Connection Error: ${err.message}. Please verify the local Ollama and FastAPI backend services are running.`,
            sources: []
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleSourceExpand = (msgId, srcIdx) => {
    setExpandedSources(prev => {
      const key = `${msgId}_${srcIdx}`;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputQuery('');
    setActivityLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] CONVERSATION_SESSION_RESET`
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', height: 'calc(100vh - 100px)' }}>
      
      {/* 1. Sleek Cyber Top Header Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--accent-green)', borderRadius: '50%', boxShadow: 'var(--accent-green-glow)' }} className="animate-pulse" />
            <div style={{ position: 'absolute', width: '22px', height: '22px', border: '1px solid var(--accent-green)', borderRadius: '50%', opacity: 0.4 }} className="animate-ping" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#fff', textTransform: 'uppercase', margin: 0 }}>
                COLLEGE_AI_RECEPTION
              </h2>
              <span style={{ fontSize: '9px', color: 'var(--accent-green)', background: 'var(--accent-green-dim)', padding: '2px 8px', border: '1px solid var(--accent-green)', fontWeight: 'bold' }}>
                GPT ARCHITECTURE • LOCAL PS7
              </span>
            </div>
            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Amypo Institute of Technology — Local RAG Intelligence & ScamON Security Subsystem
            </p>
          </div>
        </div>

        {/* Real-time Indicators & Control Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 230, 118, 0.04)', border: '1px solid var(--accent-green-dim)', padding: '5px 10px', fontSize: '10px' }}>
            <Cpu style={{ width: '12px', height: '12px', color: 'var(--accent-green)' }} />
            <span style={{ color: 'var(--text-muted)' }}>OLLAMA:</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
              {systemStatus?.ollama?.status || 'ONLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 230, 118, 0.04)', border: '1px solid var(--accent-green-dim)', padding: '5px 10px', fontSize: '10px' }}>
            <Database style={{ width: '12px', height: '12px', color: 'var(--accent-green)' }} />
            <span style={{ color: 'var(--text-muted)' }}>VECTORS:</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
              {systemStatus?.chromadb?.total_chunks_indexed || 90} CHUNKS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 230, 118, 0.04)', border: '1px solid var(--accent-green-dim)', padding: '5px 10px', fontSize: '10px' }}>
            <Shield style={{ width: '12px', height: '12px', color: 'var(--accent-green)' }} />
            <span style={{ color: 'var(--text-muted)' }}>SCAMON:</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
              ONLINE (ACTIVE)
            </span>
          </div>

          {/* New Chat Reset Button */}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '5px 10px',
                fontSize: '10px',
                fontFamily: 'var(--font-cyber)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-green)';
                e.currentTarget.style.color = 'var(--accent-green)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <RotateCcw style={{ width: '11px', height: '11px' }} />
              <span>NEW CHAT</span>
            </button>
          )}

          {/* Toggle Live SOC Telemetry HUD */}
          <button
            onClick={() => setShowTelemetryHUD(!showTelemetryHUD)}
            style={{
              background: showTelemetryHUD ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
              border: `1px solid ${showTelemetryHUD ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.15)'}`,
              color: showTelemetryHUD ? 'var(--accent-green)' : 'var(--text-muted)',
              padding: '5px 10px',
              fontSize: '10px',
              fontFamily: 'var(--font-cyber)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            <Terminal style={{ width: '11px', height: '11px' }} />
            <span>{showTelemetryHUD ? 'HIDE HUD' : 'SHOW HUD'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Layout: Conversational Feed + Collapsible HUD */}
      <div style={{ display: 'flex', flex: 1, gap: '16px', overflow: 'hidden', position: 'relative' }}>
        
        {/* LEFT COLUMN: GPT Conversational Stream */}
        <div 
          className="glass-panel" 
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid var(--accent-green-dim)'
          }}
        >
          {/* Scrollable Conversation Stream */}
          <div 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '24px 20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px' 
            }}
            className="soc-sidebar-scroll"
          >
            {/* STATE A: EMPTY HERO WELCOME SCREEN (ChatGPT / Claude Style) */}
            {messages.length === 0 ? (
              <div style={{ maxWidth: '780px', margin: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '28px', padding: '20px 0' }}>
                
                {/* Glowing AI Core Icon */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    width: '64px', height: '64px', 
                    borderRadius: '50%', 
                    background: 'radial-gradient(circle, rgba(0, 230, 118, 0.25) 0%, rgba(2, 3, 5, 0.9) 75%)',
                    border: '1px solid var(--accent-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(0, 230, 118, 0.3)'
                  }}>
                    <Bot style={{ width: '32px', height: '32px', color: 'var(--accent-green)' }} />
                  </div>
                  <div style={{ 
                    position: 'absolute', bottom: '-2px', right: '-2px', 
                    width: '18px', height: '18px', 
                    borderRadius: '50%', 
                    background: '#05070a', 
                    border: '1px solid var(--accent-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Sparkles style={{ width: '10px', height: '10px', color: 'var(--accent-green)' }} />
                  </div>
                </div>

                {/* Hero Title & Subtext */}
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff', marginBottom: '8px' }}>
                    How can I assist you at Amypo Institute?
                  </h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: '1.6' }}>
                    Ask any question regarding semester fees, academic regulations, examination schedules, or hostel facilities. You can also paste suspicious emails or payment requests for automated ScamON cyber verification.
                  </p>
                </div>

                {/* 4 Topic Starter Cards (2x2 Grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', width: '100%', textAlign: 'left' }}>
                  {STARTER_CARDS.map(card => {
                    const CardIcon = card.icon;
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleQuerySubmit(null, card.query)}
                        style={{
                          background: 'rgba(2, 3, 5, 0.65)',
                          border: '1px solid rgba(0, 230, 118, 0.12)',
                          padding: '18px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent-green)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 230, 118, 0.15)';
                          e.currentTarget.style.background = 'rgba(2, 3, 5, 0.9)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.12)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.background = 'rgba(2, 3, 5, 0.65)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CardIcon style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} />
                            <span style={{ fontSize: '10px', color: 'var(--accent-green)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              {card.category}
                            </span>
                          </div>
                          <ArrowRight style={{ width: '13px', height: '13px', color: 'var(--text-muted)' }} />
                        </div>

                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold', marginTop: '2px' }}>
                          "{card.query}"
                        </div>

                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                          {card.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Prompt Pill Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '720px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', alignSelf: 'center', marginRight: '4px' }}>
                    Quick Inquiries:
                  </span>
                  {SUGGESTED_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuerySubmit(null, chip)}
                      style={{
                        background: 'rgba(0, 230, 118, 0.04)',
                        border: '1px solid rgba(0, 230, 118, 0.18)',
                        color: 'var(--text-primary)',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-cyber)',
                        cursor: 'pointer',
                        borderRadius: '20px',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent-green)';
                        e.currentTarget.style.color = 'var(--accent-green)';
                        e.currentTarget.style.background = 'rgba(0, 230, 118, 0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.18)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'rgba(0, 230, 118, 0.04)';
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* STATE B: ACTIVE CONVERSATIONAL FEED (ChatGPT Multi-Turn Style) */
              <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  const isSecurity = msg.security_fusion || msg.scamon_used;
                  const threatScore = msg.security_fusion?.risk_score;
                  const threatLevel = msg.security_fusion?.threat_level || 'UNKNOWN';
                  const isHighThreat = threatLevel === 'HIGH RISK' || (threatScore && threatScore >= 70);

                  return (
                    <div 
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        gap: '6px',
                        width: '100%',
                        animation: 'fadeIn 0.25s ease-out'
                      }}
                    >
                      {/* Avatar & Sender Label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                        {isUser ? (
                          <>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                            <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', fontFamily: 'var(--font-cyber)' }}>YOU</span>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.15)', border: '1px solid var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User style={{ width: '11px', height: '11px', color: 'var(--accent-green)' }} />
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.15)', border: '1px solid var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Bot style={{ width: '11px', height: '11px', color: 'var(--accent-green)' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', fontFamily: 'var(--font-cyber)' }}>AMYPO DIGITAL RECEPTION</span>
                            {msg.intent && (
                              <span style={{ 
                                fontSize: '9px', 
                                padding: '1px 6px', 
                                border: isSecurity ? '1px solid var(--accent-red)' : '1px solid var(--accent-green)', 
                                color: isSecurity ? 'var(--accent-red)' : 'var(--accent-green)',
                                background: isSecurity ? 'rgba(255, 61, 0, 0.1)' : 'var(--accent-green-dim)' 
                              }}>
                                {msg.intent}
                              </span>
                            )}
                            {msg.processing_time_ms && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock style={{ width: '10px', height: '10px' }} /> {msg.processing_time_ms}ms
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Message Bubble Card */}
                      <div
                        style={{
                          maxWidth: isUser ? '85%' : '100%',
                          width: isUser ? 'auto' : '100%',
                          background: isUser ? 'rgba(0, 230, 118, 0.08)' : 'rgba(3, 5, 8, 0.75)',
                          border: isUser ? '1px solid rgba(0, 230, 118, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                          padding: isUser ? '12px 18px' : '18px 20px',
                          borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                          boxShadow: isUser ? '0 0 15px rgba(0, 230, 118, 0.06)' : 'none',
                          color: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px'
                        }}
                      >
                        {/* Loading State Spinner */}
                        {msg.loading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
                            <RefreshCw className="animate-spin" style={{ width: '18px', height: '18px', color: 'var(--accent-green)' }} />
                            <div>
                              <span style={{ fontSize: '12px', color: 'var(--accent-green)', letterSpacing: '1px', fontWeight: 'bold' }}>
                                QUERYING LOCAL KNOWLEDGE BASE & GENERATING GROUNDED ANSWER...
                              </span>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                Retrieving vector chunks from ChromaDB • Synthesizing with local llama3.1:8b
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* IF SECURITY THREAT: Dual-Layer ScamON Fusion Card */}
                            {isSecurity && (
                              <div style={{ 
                                background: isHighThreat ? 'rgba(255, 61, 0, 0.08)' : 'rgba(255, 160, 0, 0.08)', 
                                border: `1px solid ${isHighThreat ? 'var(--accent-red)' : 'var(--accent-orange)'}`, 
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                borderRadius: '2px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertOctagon style={{ width: '18px', height: '18px', color: isHighThreat ? 'var(--accent-red)' : 'var(--accent-orange)' }} />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: isHighThreat ? 'var(--accent-red)' : 'var(--accent-orange)' }}>
                                      SECURITY VERIFICATION: {msg.security_fusion?.final_assessment || 'HIGH RISK / LIKELY SCAM'}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ 
                                      fontSize: '9px', 
                                      color: 'var(--accent-green)', 
                                      background: 'rgba(0, 230, 118, 0.1)', 
                                      border: '1px solid var(--accent-green-dim)', 
                                      padding: '2px 8px', 
                                      fontWeight: 'bold', 
                                      letterSpacing: '1px' 
                                    }}>
                                      SCAMON VERIFIED
                                    </span>
                                    {threatScore !== null && threatScore !== undefined && (
                                      <span style={{ 
                                        fontSize: '11px', 
                                        fontWeight: 'bold', 
                                        color: isHighThreat ? 'var(--accent-red)' : 'var(--accent-orange)',
                                        background: 'rgba(0,0,0,0.5)',
                                        padding: '2px 8px',
                                        border: `1px solid ${isHighThreat ? 'var(--accent-red)' : 'var(--accent-orange)'}`
                                      }}>
                                        RISK SCORE: {threatScore}/100
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Indicators */}
                                {msg.security_fusion?.indicators?.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {msg.security_fusion.indicators.map((ind, i) => (
                                      <span key={i} style={{ fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', padding: '3px 8px' }}>
                                        ⚠️ {ind}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* ScamON Action Dispatch Buttons */}
                                <div style={{ 
                                  borderTop: '1px dashed rgba(255, 61, 0, 0.3)', 
                                  paddingTop: '12px', 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: '8px' 
                                }}>
                                  <span style={{ fontSize: '10px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                                    TRANSFER INCIDENT TO SCAMON FOR DEEP INVESTIGATION:
                                  </span>

                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => onNavigate && onNavigate('Email Investigation')}
                                      style={{
                                        background: 'rgba(255, 61, 0, 0.15)',
                                        border: '1px solid #FF3D00',
                                        color: '#fff',
                                        padding: '7px 14px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        fontFamily: 'var(--font-cyber)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 0 10px rgba(255,61,0,0.25)',
                                        transition: 'all 0.2s'
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
                                      <span>OPEN IN SCAMON EMAIL INVESTIGATION ❯</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => onNavigate && onNavigate('Web & QR Scan')}
                                      style={{
                                        background: 'rgba(0, 230, 118, 0.08)',
                                        border: '1px solid var(--accent-green)',
                                        color: '#fff',
                                        padding: '7px 14px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        fontFamily: 'var(--font-cyber)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s'
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
                                      <span>SCAN IN SCAMON WEB SCANNER ❯</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => onNavigate && onNavigate('Security Verification')}
                                      style={{
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: '#fff',
                                        padding: '7px 14px',
                                        fontSize: '11px',
                                        fontFamily: 'var(--font-cyber)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--accent-green)';
                                        e.currentTarget.style.color = 'var(--accent-green)';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        e.currentTarget.style.color = '#fff';
                                      }}
                                    >
                                      <Shield style={{ width: '13px', height: '13px', color: 'var(--accent-green)' }} />
                                      <span>SECURITY AUDIT CONSOLE ❯</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => onNavigate && onNavigate('Complaint Agent')}
                                      style={{
                                        background: 'rgba(255, 160, 0, 0.08)',
                                        border: '1px solid var(--accent-orange)',
                                        color: '#fff',
                                        padding: '7px 14px',
                                        fontSize: '11px',
                                        fontFamily: 'var(--font-cyber)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s'
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
                                      <span>FILE CYBERCRIME COMPLAINT ❯</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Rendered Markdown Answer Body */}
                            <div style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                              {isUser ? msg.content : renderFormattedContent(msg.content)}
                            </div>

                            {/* Collapsible Verified Citations Accordion (Assistant Only) */}
                            {!isUser && msg.sources && msg.sources.length > 0 && (
                              <div style={{ marginTop: '8px', borderTop: '1px dashed rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                                  VERIFIED INSTITUTIONAL CITATIONS ({msg.sources.length}):
                                </span>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {msg.sources.map((src, srcIdx) => {
                                    const sourceName = typeof src === 'string' ? src : (src.source || src.document || 'Document');
                                    const relevance = typeof src === 'object' && typeof src.relevance_pct === 'number' && !isNaN(src.relevance_pct) ? Math.round(src.relevance_pct) : null;
                                    const snippet = typeof src === 'object' ? src.text : null;
                                    const isExpanded = expandedSources[`${msg.id}_${srcIdx}`];

                                    return (
                                      <div 
                                        key={srcIdx}
                                        style={{
                                          background: 'rgba(0, 230, 118, 0.03)',
                                          border: '1px solid var(--accent-green-dim)',
                                          borderRadius: '2px',
                                          padding: '8px 12px',
                                          cursor: snippet ? 'pointer' : 'default',
                                          transition: 'all 0.15s'
                                        }}
                                        onClick={() => snippet && toggleSourceExpand(msg.id, srcIdx)}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText style={{ width: '12px', height: '12px', color: 'var(--accent-green)' }} />
                                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{sourceName}</span>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {relevance !== null && !isNaN(relevance) && (
                                              <span style={{ fontSize: '10px', color: 'var(--accent-green)' }}>
                                                {relevance}% match
                                              </span>
                                            )}
                                            {snippet && (
                                              isExpanded ? <ChevronUp style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} /> : <ChevronDown style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                                            )}
                                          </div>
                                        </div>

                                        {isExpanded && snippet && (
                                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--accent-green-dim)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                            {snippet}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Message Quick Action Toolbar */}
                            {!isUser && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', paddingTop: '6px' }}>
                                <button
                                  onClick={() => handleCopyText(msg.id, msg.content)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: copiedMsgId === msg.id ? 'var(--accent-green)' : 'var(--text-muted)',
                                    fontSize: '10px',
                                    fontFamily: 'var(--font-cyber)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {copiedMsgId === msg.id ? <Check style={{ width: '11px', height: '11px' }} /> : <Copy style={{ width: '11px', height: '11px' }} />}
                                  <span>{copiedMsgId === msg.id ? 'COPIED' : 'COPY'}</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Floating GPT Pinned Bottom Input Dock */}
          <div style={{ 
            padding: '16px 20px 14px 20px', 
            borderTop: '1px solid rgba(0, 230, 118, 0.15)', 
            background: 'rgba(2, 3, 5, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <form onSubmit={handleQuerySubmit}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'var(--bg-darker)',
                border: '1px solid var(--accent-green-dim)',
                padding: '4px 6px 4px 14px',
                borderRadius: '6px',
                transition: 'border 0.2s, box-shadow 0.2s',
                boxShadow: '0 0 15px rgba(0, 0, 0, 0.4)'
              }}>
                <Search style={{ width: '16px', height: '16px', color: 'var(--accent-green)', marginRight: '8px', flexShrink: 0 }} />
                
                <input 
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={e => setInputQuery(e.target.value)}
                  placeholder="Ask about fees, exams, attendance, hostel, scholarships, or paste a suspicious offer to verify..."
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 6px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-cyber)',
                    outline: 'none',
                    letterSpacing: '0.5px'
                  }}
                />

                {inputQuery && (
                  <button
                    type="button"
                    onClick={() => setInputQuery('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-cyber)'
                    }}
                  >
                    ✕
                  </button>
                )}

                <button 
                  type="submit"
                  disabled={isLoading || !inputQuery.trim()}
                  style={{
                    background: isLoading || !inputQuery.trim() ? 'rgba(0, 230, 118, 0.15)' : 'var(--accent-green)',
                    color: isLoading || !inputQuery.trim() ? 'var(--text-muted)' : '#000',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-cyber)',
                    cursor: isLoading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: isLoading || !inputQuery.trim() ? 'none' : '0 0 12px rgba(0, 230, 118, 0.4)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin" style={{ width: '13px', height: '13px' }} />
                      <span>PROCESSING</span>
                    </>
                  ) : (
                    <>
                      <Send style={{ width: '13px', height: '13px' }} />
                      <span>ASK RECEPTION</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', fontSize: '9.5px', color: 'var(--text-muted)' }}>
              <span>🔒 100% Local Inference (llama3.1:8b) • Zero External Cloud API • Verified by Official Amypo Documents</span>
              <span>ScamON Shield Subsystem Active</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sleek Collapsible SOC Telemetry HUD */}
        {showTelemetryHUD && (
          <div 
            className="glass-panel" 
            style={{ 
              width: '320px', 
              display: 'flex', 
              flexDirection: 'column', 
              border: '1px solid var(--accent-green-dim)',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {/* HUD Header */}
            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid var(--accent-green-dim)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'rgba(2, 3, 5, 0.6)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal style={{ width: '13px', height: '13px', color: 'var(--accent-green)' }} />
                <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff' }}>
                  SOC_ACTIVITY_HUD
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '7px', height: '7px', background: 'var(--accent-green)', borderRadius: '50%' }} className="animate-pulse" />
                <span style={{ fontSize: '9px', color: 'var(--accent-green)', fontWeight: 'bold' }}>LIVE</span>
              </div>
            </div>

            {/* Micro Diagnostics Badges */}
            <div style={{ padding: '12px 14px', borderBottom: '1px dashed rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>LLM Engine:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>llama3.1:8b (Local)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Embedder:</span>
                <span style={{ color: '#fff' }}>nomic-embed-text</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vector Store:</span>
                <span style={{ color: '#fff' }}>ChromaDB (Local)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Indexed Chunks:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{systemStatus?.chromadb?.total_chunks_indexed || 90}</span>
              </div>
            </div>

            {/* Real-time Terminal Log Feed */}
            <div 
              style={{ 
                flex: 1, 
                padding: '12px', 
                overflowY: 'auto', 
                fontFamily: 'monospace', 
                fontSize: '10px', 
                lineHeight: '1.6', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px',
                background: 'rgba(0, 0, 0, 0.5)'
              }}
              className="soc-sidebar-scroll"
            >
              {activityLogs.map((log, lIdx) => {
                const isError = log.includes('ERROR');
                const isSuccess = log.includes('SUCCESS') || log.includes('READY') || log.includes('COMPLETE');
                const isSecurity = log.includes('SECURITY') || log.includes('THREAT') || log.includes('SCAM');
                
                let textColor = 'var(--text-primary)';
                if (isError) textColor = 'var(--accent-red)';
                else if (isSecurity) textColor = 'var(--accent-orange)';
                else if (isSuccess) textColor = 'var(--accent-green)';

                return (
                  <div key={lIdx} style={{ color: textColor, wordBreak: 'break-word' }}>
                    <span style={{ color: 'rgba(0, 230, 118, 0.4)', marginRight: '6px' }}>❯</span>
                    {log}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>

            {/* Bottom HUD Footer */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--accent-green-dim)', fontSize: '9px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>SESSION_ID: #{Math.abs(Date.now() % 99999)}</span>
              <span style={{ color: 'var(--accent-green)' }}>ACTIVE</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
