import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, Search, RefreshCw, Layers, CheckCircle2, 
  ExternalLink, Calendar, HardDrive, ArrowLeft, Eye
} from 'lucide-react';
import { fetchCollegeDocuments, fetchDocumentContent, triggerKnowledgeReindex } from './collegeApi';

export default function KnowledgeBaseExplorer() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchCollegeDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);
    setContentLoading(true);
    try {
      const data = await fetchDocumentContent(doc.filename);
      setDocContent(data.content || '');
    } catch (err) {
      setDocContent(`Error loading document content: ${err.message}`);
    } finally {
      setContentLoading(false);
    }
  };

  const handleReindex = async () => {
    if (isReindexing) return;
    setIsReindexing(true);
    setReindexMsg('Re-indexing all mock documents into local ChromaDB with nomic-embed-text...');
    try {
      const res = await triggerKnowledgeReindex();
      setReindexMsg(`Successfully re-indexed ${res.result?.chunks_count || 101} chunks into ChromaDB!`);
      setTimeout(() => setReindexMsg(''), 4000);
    } catch (err) {
      setReindexMsg(`Re-indexing failed: ${err.message}`);
    } finally {
      setIsReindexing(false);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen style={{ width: '18px', height: '18px', color: 'var(--accent-green)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff', textTransform: 'uppercase' }}>
              INSTITUTIONAL_KNOWLEDGE_BASE
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Local Markdown Documents Repository for Amypo Institute of Technology (DEMO / MOCK DATA)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleReindex}
            disabled={isReindexing}
            style={{
              background: 'transparent',
              color: 'var(--accent-green)',
              border: '1px solid var(--accent-green)',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-cyber)',
              cursor: isReindexing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw className={isReindexing ? "animate-spin" : ""} style={{ width: '12px', height: '12px' }} />
            <span>{isReindexing ? 'INDEXING VECTORS...' : 'RE-INDEX KNOWLEDGE BASE'}</span>
          </button>
        </div>
      </div>

      {reindexMsg && (
        <div style={{ 
          background: reindexMsg.includes('failed') ? 'rgba(255, 61, 0, 0.1)' : 'rgba(0, 230, 118, 0.1)',
          border: `1px solid ${reindexMsg.includes('failed') ? 'var(--accent-red)' : 'var(--accent-green)'}`,
          padding: '10px 16px',
          fontSize: '11px',
          color: '#fff',
          fontFamily: 'var(--font-cyber)'
        }}>
          {reindexMsg}
        </div>
      )}

      {/* Main Content: Split List & Reader View */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '360px 1fr' : '1fr', gap: '20px' }}>
        
        {/* Document Grid / List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ margin: 0 }}>
              DOCUMENTS ({filteredDocs.length})
            </span>
            <div style={{ position: 'relative', width: '180px' }}>
              <Search style={{ width: '12px', height: '12px', color: 'var(--text-muted)', position: 'absolute', left: '8px', top: '10px' }} />
              <input 
                type="text"
                placeholder="Filter docs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-darker)',
                  border: '1px solid var(--accent-green-dim)',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '6px 8px 6px 26px',
                  outline: 'none',
                  fontFamily: 'var(--font-cyber)'
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
              <RefreshCw className="animate-spin" style={{ width: '20px', height: '20px', margin: '0 auto 8px', color: 'var(--accent-green)' }} />
              Loading institutional knowledge documents...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
              {filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.filename === doc.filename;
                return (
                  <div
                    key={doc.filename}
                    onClick={() => handleSelectDoc(doc)}
                    style={{
                      background: isSelected ? 'rgba(0, 230, 118, 0.08)' : 'rgba(2, 3, 5, 0.4)',
                      border: isSelected ? '1px solid var(--accent-green)' : '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--accent-green-dim)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FileText style={{ width: '13px', height: '13px', color: 'var(--accent-green)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{doc.title}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>{doc.filename}</span>
                      <span>{doc.word_count} words</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Reader Panel */}
        {selectedDoc && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 230, 118, 0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Document Viewer:</span>
                <h3 style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{selectedDoc.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-muted)',
                  padding: '4px 10px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-cyber)',
                  cursor: 'pointer'
                }}
              >
                CLOSE VIEWER
              </button>
            </div>

            {contentLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw className="animate-spin" style={{ width: '24px', height: '24px', color: 'var(--accent-green)' }} />
              </div>
            ) : (
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                maxHeight: '500px',
                fontSize: '12px', 
                lineHeight: '1.7', 
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-cyber)',
                background: 'rgba(2, 3, 5, 0.4)',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {docContent}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
