import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [concept, setConcept] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  const handleSearch = async (searchConcept) => {
    const q = searchConcept || concept;
    if (!url || !q) {
      setError('Please fill in both the video URL and a concept to search.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url, concept: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Something went wrong.');
      } else {
        setResults(data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch {
      setError('Cannot reach the backend server. Make sure it is running on port 8000.');
    }
    setLoading(false);
  };

  const highlightText = (text, concepts) => {
    let out = text;
    concepts.forEach((kw) => {
      if (kw.length > 2) {
        const re = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        out = out.replace(re, '<span class="hl">$1</span>');
      }
    });
    return <span dangerouslySetInnerHTML={{ __html: out }} />;
  };

  const buildYtLink = (ts) => {
    const sec = Math.floor(ts);
    if (url.includes('?')) return `${url}&t=${sec}s`;
    return `${url}?t=${sec}s`;
  };

  return (
    <>
      {/* —— Nav —— */}
      <nav className="navbar">
        <a className="nav-brand" href="#">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Lecture<span className="dot">Find</span>
        </a>
        <div className="nav-links">
          <a href="#search">Search</a>
          <a href="#how">How It Works</a>
          <a href="#features">Features</a>
        </div>
      </nav>

      {/* —— Hero —— */}
      <section className="hero">
        <span className="hero-badge">NLP-Powered Lecture Search</span>
        <h1>Find any concept inside a <em>YouTube lecture</em></h1>
        <p>Paste a video link, type what you're looking for, and we'll show you exactly where it's discussed — grouped into time clusters, with NLP synonym expansion.</p>
      </section>

      {/* —— Search —— */}
      <section className="search-section" id="search">
        <div className="search-card">
          <div className="field">
            <label htmlFor="urlInput">YouTube URL</label>
            <input
              id="urlInput"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="conceptInput">Concept / Topic</label>
            <input
              id="conceptInput"
              type="text"
              placeholder="e.g. gradient descent, neural network..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-search" onClick={() => handleSearch()} disabled={loading}>
            {loading ? <><span className="spin" /> Analysing transcript…</> : 'Search Video'}
          </button>
        </div>
      </section>

      {/* —— Error —— */}
      {error && <div className="results-panel"><div className="error-bar">{error}</div></div>}

      {/* —— Results —— */}
      {results && (
        <section className="results-panel" ref={resultsRef}>
          <div className="results-meta">
            <span className="meta-label">Searched with:</span>
            {results.expanded_concepts.map((k, i) => (
              <span key={i} className="pill">{k}</span>
            ))}
          </div>

          {results.results.length === 0 ? (
            <div className="empty-box">
              <p>No matches found for <strong>"{results.original_concept}"</strong> in this transcript.</p>
              {results.suggested_topics?.length > 0 && (
                <div className="suggestions">
                  <h4>Related topics discussed in this video:</h4>
                  {results.suggested_topics.map((t, i) => (
                    <span key={i} className="chip" onClick={() => { setConcept(t); handleSearch(t); }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            results.results.map((r, i) => (
              <div className="clip" key={i}>
                <div className="clip-top">
                  <span className="clip-range">{r.formatted_time}</span>
                  <a className="btn-jump" href={buildYtLink(r.timestamp)} target="_blank" rel="noreferrer">
                    ▶ Go to Clip
                  </a>
                </div>
                <div className="clip-text">{highlightText(r.text, r.matched_concepts)}</div>
              </div>
            ))
          )}
        </section>
      )}

      {/* —— How It Works —— */}
      <section className="how-section" id="how">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Paste a Link</h3>
            <p>Drop any YouTube lecture URL. We fetch its full transcript automatically — no API key needed.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Enter a Concept</h3>
            <p>Type a concept like "backpropagation". Our NLP engine expands it to include synonyms and related terms using WordNet.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Get Clustered Results</h3>
            <p>Matching transcript segments are grouped into time clusters so you see ranges like 2:30 — 3:15 instead of scattered timestamps.</p>
          </div>
          <div className="step-card">
            <div className="step-num">4</div>
            <h3>Jump to the Video</h3>
            <p>Click "Go to Clip" to open YouTube at the exact second. In the Chrome extension, it jumps the current video in-place.</p>
          </div>
        </div>
      </section>

      {/* —— Features —— */}
      <section className="features" id="features">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3>NLP Synonym Expansion</h3>
            <p>WordNet-based concept expansion ensures you don't miss discussion of related terminology.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/></svg>
            </div>
            <h3>Temporal Clustering</h3>
            <p>Nearby matches are merged into time ranges instead of individual timestamps for clearer navigation.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3>Similar Topic Fallback</h3>
            <p>If your query isn't found, the system suggests the closest related topics actually discussed in the video.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h3>Chrome Extension</h3>
            <p>Also ships as a browser extension that works directly on YouTube pages — search and jump without leaving the video.</p>
          </div>
        </div>
      </section>


    </>
  );
}

export default App;
