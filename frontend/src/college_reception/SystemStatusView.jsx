import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, Database, Shield, CheckCircle2, 
  AlertTriangle, RefreshCw, Layers, Server, Terminal, HardDrive
} from 'lucide-react';
import { fetchSystemStatus } from './collegeApi';

export default function SystemStatusView() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemStatus();
      setStatus(data);
    } catch (err) {
      console.error("Failed to load status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity style={{ width: '18px', height: '18px', color: 'var(--accent-green)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff', textTransform: 'uppercase' }}>
              LOCAL_SYSTEM_DIAGNOSTICS
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time telemetry and component operational state for Amypo College Reception AI (PS7).
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          style={{
            background: 'transparent',
            border: '1px solid var(--accent-green)',
            color: 'var(--accent-green)',
            padding: '8px 16px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-cyber)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} style={{ width: '12px', height: '12px' }} />
          <span>REFRESH DIAGNOSTICS</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '60px 0', textAlign: 'center' }}>
          <RefreshCw className="animate-spin" style={{ width: '28px', height: '28px', margin: '0 auto 12px', color: 'var(--accent-green)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Probing local AI subsystems...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* 1. Ollama Diagnostics */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} />
                <span className="card-title" style={{ margin: 0 }}>LOCAL_OLLAMA_SERVICE</span>
              </div>
              <span style={{ 
                fontSize: '10px', 
                color: status?.ollama?.status === 'ONLINE' ? 'var(--accent-green)' : '#FF3D00',
                border: `1px solid ${status?.ollama?.status === 'ONLINE' ? 'var(--accent-green)' : '#FF3D00'}`,
                padding: '2px 8px',
                fontWeight: 'bold'
              }}>
                {status?.ollama?.status}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div>Endpoint: <span style={{ color: '#fff' }}>{status?.ollama?.url || 'http://localhost:11434'}</span></div>
              <div>Inference LLM: <span style={{ color: 'var(--accent-green)' }}>{status?.ollama?.llm_model}</span> ({status?.ollama?.llm_ready ? 'Available' : 'Missing'})</div>
              <div>Embedding Engine: <span style={{ color: 'var(--accent-green)' }}>{status?.ollama?.embed_model}</span> ({status?.ollama?.embed_ready ? 'Available' : 'Missing'})</div>
              <div>Cloud AI APIs: <span style={{ color: '#fff' }}>NONE (100% Local Execution)</span></div>
            </div>

            <div style={{ marginTop: '10px', borderTop: '1px dashed rgba(0, 230, 118, 0.15)', paddingTop: '10px', fontSize: '10px', color: 'var(--text-muted)' }}>
              Models in Ollama: {status?.ollama?.available_models?.join(', ') || 'nomic-embed-text:latest, llama3.1:8b'}
            </div>
          </div>

          {/* 2. ChromaDB Vector Store Diagnostics */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} />
                <span className="card-title" style={{ margin: 0 }}>CHROMADB_VECTOR_STORE</span>
              </div>
              <span style={{ 
                fontSize: '10px', 
                color: 'var(--accent-green)',
                border: '1px solid var(--accent-green)',
                padding: '2px 8px',
                fontWeight: 'bold'
              }}>
                {status?.chromadb?.status}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div>Target Collection: <span style={{ color: '#fff' }}>{status?.chromadb?.collection_name}</span></div>
              <div>Indexed Vector Chunks: <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{status?.chromadb?.total_chunks_indexed}</span></div>
              <div>Distance Metric: <span style={{ color: '#fff' }}>Cosine Similarity (HNSW Space)</span></div>
              <div>Storage Mode: <span style={{ color: '#fff' }}>Persistent Local Directory</span></div>
            </div>
          </div>

          {/* 3. Knowledge Base Documents */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} />
                <span className="card-title" style={{ margin: 0 }}>MOCK_KNOWLEDGE_BASE</span>
              </div>
              <span style={{ 
                fontSize: '10px', 
                color: 'var(--accent-green)',
                border: '1px solid var(--accent-green)',
                padding: '2px 8px',
                fontWeight: 'bold'
              }}>
                {status?.knowledge_base?.status}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div>Institutional Entity: <span style={{ color: '#fff' }}>Amypo Institute of Technology</span></div>
              <div>Total Markdown Documents: <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{status?.knowledge_base?.total_markdown_documents} files</span></div>
              <div>Structured JSON Database: <span style={{ color: status?.knowledge_base?.database_json_present ? 'var(--accent-green)' : '#FF3D00' }}>
                {status?.knowledge_base?.database_json_present ? 'VERIFIED (college_data.json)' : 'MISSING'}
              </span></div>
              <div>Data Integrity: <span style={{ color: '#fff' }}>100% Mock / Demonstration Set</span></div>
            </div>
          </div>

          {/* 4. ScamON Security Layer Adapter */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} />
                <span className="card-title" style={{ margin: 0 }}>SCAMON_INTEGRATION_LAYER</span>
              </div>
              <span style={{ 
                fontSize: '10px', 
                color: status?.scamon_security_layer?.status?.includes('ONLINE') ? 'var(--accent-green)' : 'var(--accent-orange)',
                border: `1px solid ${status?.scamon_security_layer?.status?.includes('ONLINE') ? 'var(--accent-green)' : 'var(--accent-orange)'}`,
                padding: '2px 8px',
                fontWeight: 'bold'
              }}>
                {status?.scamon_security_layer?.status}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div>Adapter Mode: <span style={{ color: '#fff' }}>Optional Security Verification Layer</span></div>
              <div>Target ScamON URL: <span style={{ color: '#fff' }}>{status?.scamon_security_layer?.base_url}</span></div>
              <div>Fault Isolation: <span style={{ color: 'var(--accent-green)' }}>Isolated Adapter with Graceful Fallback</span></div>
              <div>ScamON Subsystems: <span style={{ color: '#fff' }}>Protected Legacy Subsystem (Untouched)</span></div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
