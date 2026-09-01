import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import XRViewer from './xr/XRViewer';
import { DEMO_DESIGN } from './xr/demoDesign';

/**
 * Standalone XR experience page — accessible at /xr
 * 
 * Automated workflow:
 * 1. Loads design from sessionStorage (AI-generated) or demo data
 * 2. Automatically calls /api/generate-model to create a realistic GLB
 * 3. Displays the parametric model immediately, swaps to AI model when ready
 */
export default function XRExperience() {
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [glbUrl, setGlbUrl] = useState(null);
  const [genStatus, setGenStatus] = useState('idle'); // idle | generating | done | error | no-key

  useEffect(() => {
    const raw = sessionStorage.getItem('satelliteDesign');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setDesign(parsed);
        triggerModelGen(parsed);
        return;
      } catch { /* fall through */ }
    }
    setDesign(DEMO_DESIGN);
    setIsDemo(true);
    triggerModelGen(DEMO_DESIGN);
  }, []);

  const triggerModelGen = useCallback(async (designData) => {
    // Check if we already have a cached model
    const cached = sessionStorage.getItem('satelliteGlbUrl');
    if (cached) {
      setGlbUrl(cached);
      setGenStatus('done');
      return;
    }

    setGenStatus('generating');
    try {
      const res = await fetch('/api/generate-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design: designData, provider: 'auto' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.hint?.includes('env var')) {
          setGenStatus('no-key');
        } else {
          setGenStatus('error');
        }
        console.warn('[XR] 3D gen unavailable:', err);
        return;
      }

      const data = await res.json();
      if (data.glbUrl) {
        setGlbUrl(data.glbUrl);
        sessionStorage.setItem('satelliteGlbUrl', data.glbUrl);
        setGenStatus('done');
        console.log(`[XR] AI model ready via ${data.provider}`);
      }
    } catch (err) {
      console.warn('[XR] 3D gen failed:', err.message);
      setGenStatus('error');
    }
  }, []);

  if (!design) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0E1A' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 200,
          background: 'rgba(17,24,39,0.9)',
          color: '#F9FAFB',
          border: '1px solid #1F2937',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
          transition: '0.2s ease',
        }}
      >
        ← Back
      </button>

      {/* Generation status badge */}
      {genStatus !== 'idle' && genStatus !== 'done' && (
        <div style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 200,
          background: genStatus === 'generating'
            ? 'rgba(59,130,246,0.15)'
            : genStatus === 'no-key'
              ? 'rgba(107,114,128,0.15)'
              : 'rgba(239,68,68,0.15)',
          border: `1px solid ${
            genStatus === 'generating' ? 'rgba(59,130,246,0.3)' :
            genStatus === 'no-key' ? 'rgba(107,114,128,0.3)' :
            'rgba(239,68,68,0.3)'
          }`,
          borderRadius: 10,
          padding: '8px 16px',
          color: genStatus === 'generating' ? '#3B82F6' :
                 genStatus === 'no-key' ? '#6B7280' : '#EF4444',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          backdropFilter: 'blur(8px)',
        }}>
          {genStatus === 'generating' && '⏳ Generating AI model...'}
          {genStatus === 'no-key' && '🔑 No 3D API key — using parametric model'}
          {genStatus === 'error' && '⚠ AI gen failed — using parametric model'}
        </div>
      )}

      {genStatus === 'done' && glbUrl && (
        <div style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 200,
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 10,
          padding: '8px 16px',
          color: '#10B981',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          backdropFilter: 'blur(8px)',
        }}>
          ✓ AI model loaded
        </div>
      )}

      {/* Demo banner */}
      {isDemo && (
        <div style={{
          position: 'fixed',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          background: 'rgba(245,158,11,0.15)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 10,
          padding: '8px 20px',
          color: '#F59E0B',
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
          textAlign: 'center',
        }}>
          Demo mode — <span
            onClick={() => navigate('/mission')}
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
          >Design your own satellite</span> to see it here
        </div>
      )}

      <XRViewer design={design} standalone={true} glbUrl={glbUrl} />
    </div>
  );
}
