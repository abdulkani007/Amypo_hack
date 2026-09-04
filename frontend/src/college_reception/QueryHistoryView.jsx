import React, { useState, useEffect } from 'react';
import { 
  History, Search, Trash2, RefreshCw, FileText, 
  Shield, CheckCircle2, Clock, AlertTriangle, ArrowRight
} from 'lucide-react';
import { fetchQueryHistory, clearQueryHistory } from './collegeApi';

export default function QueryHistoryView({ onSelectQuery }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterIntent, setFilterIntent] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchQueryHistory(50, filterIntent);
      setHistory(data.history || []);
    } catch (err) {
      console.error("Failed to load query history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [filterIntent]);

  const handleClear = async () => {
    try {
      await clearQueryHistory();
      setHistory([]);
      setConfirmClear(false);
    } catch (err) {
      alert(`Could not clear history: ${err.message}`);
    }
  };

  const filteredHistory = history.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.detected_intent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History style={{ width: '18px', height: '18px', color: 'var(--accent-green)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff', textTransform: 'uppercase' }}>
              QUERY_INTERACTION_HISTORY
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Persistent local log of student inquiries, classified intents, grounded answers, and security verdicts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {confirmClear ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleClear}
                style={{
                  background: 'var(--accent-red)',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-cyber)',
                  cursor: 'pointer'
                }}
              >
                CONFIRM CLEAR
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'var(--text-muted)',
                  padding: '6px 10px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={history.length === 0}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 61, 0, 0.4)',
                color: 'var(--accent-red)',
                padding: '6px 14px',
                fontSize: '11px',
                fontFamily: 'var(--font-cyber)',
                cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 style={{ width: '12px', height: '12px' }} />
              <span>CLEAR LOGS</span>
            </button>
          )}

          <button
            onClick={loadHistory}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent-green-dim)',
              color: 'var(--accent-green)',
              padding: '6px 12px',
              fontSize: '11px',
              fontFamily: 'var(--font-cyber)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw style={{ width: '12px', height: '12px' }} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'NORMAL_COLLEGE_QUERY', 'SECURITY_QUERY'].map(intent => (
            <button
              key={intent}
              onClick={() => setFilterIntent(intent)}
              style={{
                background: filterIntent === intent ? 'var(--accent-green)' : 'rgba(2, 3, 5, 0.6)',
                color: filterIntent === intent ? '#000' : 'var(--text-primary)',
                border: `1px solid ${filterIntent === intent ? 'var(--accent-green)' : 'rgba(0, 230, 118, 0.15)'}`,
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-cyber)',
                cursor: 'pointer'
              }}
            >
              {intent.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '240px' }}>
          <Search style={{ width: '13px', height: '13px', color: 'var(--text-muted)', position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search inquiry history..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-darker)',
              border: '1px solid var(--accent-green-dim)',
              color: '#fff',
              fontSize: '11px',
              padding: '7px 10px 7px 30px',
              outline: 'none',
              fontFamily: 'var(--font-cyber)'
            }}
          />
        </div>
      </div>

      {/* History Feed List */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
            <RefreshCw className="animate-spin" style={{ width: '20px', height: '20px', margin: '0 auto 8px', color: 'var(--accent-green)' }} />
            Loading query history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
            No matching inquiry records found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredHistory.map((item) => {
              const isSecurity = item.scamon_used || item.detected_intent?.includes('SECURITY');
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(2, 3, 5, 0.5)',
                    border: `1px solid ${isSecurity ? 'rgba(255, 160, 0, 0.3)' : 'rgba(0, 230, 118, 0.15)'}`,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'border 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '9px', 
                        color: isSecurity ? 'var(--accent-orange)' : 'var(--accent-green)',
                        background: isSecurity ? 'rgba(255, 160, 0, 0.1)' : 'rgba(0, 230, 118, 0.1)',
                        border: `1px solid ${isSecurity ? 'var(--accent-orange)' : 'var(--accent-green)'}`,
                        padding: '2px 8px',
                        fontWeight: 'bold'
                      }}>
                        {item.detected_intent}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.id}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {item.timestamp}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <Clock style={{ width: '11px', height: '11px' }} />
                      <span>{item.latency_ms}ms</span>
                      {item.scamon_used && (
                        <span style={{ color: 'var(--accent-orange)', border: '1px solid var(--accent-orange)', padding: '1px 6px' }}>
                          SCAMON FUSED
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                    Q: {item.question}
                  </div>

                  <div style={{ 
                    fontSize: '11.5px', 
                    lineHeight: '1.6', 
                    color: 'var(--text-primary)', 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '10px 14px',
                    borderLeft: `2px solid ${isSecurity ? 'var(--accent-orange)' : 'var(--accent-green)'}`,
                    whiteSpace: 'pre-line',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {item.answer}
                  </div>

                  {item.source_documents && item.source_documents.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sources:</span>
                      {item.source_documents.map((src, idx) => (
                        <span key={idx} style={{ color: 'var(--accent-green)', background: 'rgba(0, 230, 118, 0.05)', padding: '2px 6px' }}>
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
