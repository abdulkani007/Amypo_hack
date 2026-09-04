const API_BASE = 'http://127.0.0.1:8001/api/college';

export async function submitCollegeQuery(query, topK = 4) {
  const response = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  return response.json();
}

export async function verifySecurityContent(content, url = null, sender = null) {
  const response = await fetch(`${API_BASE}/security-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, url, sender })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Verification Error ${response.status}: ${errorText}`);
  }
  return response.json();
}

export async function fetchCollegeDocuments() {
  const response = await fetch(`${API_BASE}/documents`);
  if (!response.ok) throw new Error('Failed to fetch documents');
  return response.json();
}

export async function fetchDocumentContent(filename) {
  const response = await fetch(`${API_BASE}/documents/${filename}`);
  if (!response.ok) throw new Error(`Failed to fetch document: ${filename}`);
  return response.json();
}

export async function fetchCollegeDatabase() {
  const response = await fetch(`${API_BASE}/database`);
  if (!response.ok) throw new Error('Failed to fetch structured database');
  return response.json();
}

export async function fetchSystemStatus() {
  const response = await fetch(`${API_BASE}/system-status`);
  if (!response.ok) throw new Error('Failed to fetch system status');
  return response.json();
}

export async function triggerKnowledgeReindex() {
  const response = await fetch(`${API_BASE}/index?force=true`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to re-index knowledge base');
  return response.json();
}

export async function fetchQueryHistory(limit = 50, intent = 'ALL') {
  const response = await fetch(`${API_BASE}/history?limit=${limit}&intent=${intent}`);
  if (!response.ok) throw new Error('Failed to fetch query history');
  return response.json();
}

export async function clearQueryHistory() {
  const response = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to clear query history');
  return response.json();
}
