import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress known Firebase Auth v12 assertion & popup COOP bugs
window.addEventListener('unhandledrejection', (e) => {
  const msg = e?.reason?.message || String(e?.reason || '');
  if (msg.includes("INTERNAL ASSERTION FAILED") || msg.includes("Pending promise was never set") || msg.includes("Cross-Origin-Opener-Policy")) {
    if (e.preventDefault) e.preventDefault();
  }
});
window.addEventListener('error', (e) => {
  const msg = e?.message || e?.error?.message || String(e || '');
  if (msg.includes("INTERNAL ASSERTION FAILED") || msg.includes("Pending promise was never set") || msg.includes("Cross-Origin-Opener-Policy")) {
    if (e.preventDefault) e.preventDefault();
    return true;
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
