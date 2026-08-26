import React from 'react';

export default function DesignSummary({ design, onTrade }) {
  if (!design) return null;
  return (
    <section className="design-summary glassmorphism" style={{
      margin: '2rem 0',
      padding: '1rem',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 'var(--radius)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'var(--shadow-elevated)'
    }}>
      <h2 style={{ color: 'var(--color-primary)' }}>Satellite Concept</h2>
      <pre style={{ color: 'var(--color-text)', overflowX: 'auto' }}>{JSON.stringify(design, null, 2)}</pre>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => onTrade('cost')} style={{ marginRight: '0.5rem' }}>Reduce Cost 20%</button>
        <button onClick={() => onTrade('mass')}>Reduce Mass 15%</button>
      </div>
    </section>
  );
}
