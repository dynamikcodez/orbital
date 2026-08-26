import React, { useState } from 'react';
import { generateDesign } from '../utils/aiService';

export default function InterviewWizard({ onResult }) {
  const [answers, setAnswers] = useState({
    objective: '',
    region: '',
    resolution: '',
    revisit: '',
    orbit: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setAnswers({ ...answers, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const design = await generateDesign(answers);
      if (design) onResult(design);
    } catch (err) {
      console.error(err);
      alert('Failed to generate design. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="interview-wizard" style={{ margin: '2rem 0' }}>
      <h2 style={{ color: 'var(--color-primary)' }}>Mission Requirements</h2>
      <label>
        Objective
        <input name="objective" value={answers.objective} onChange={handleChange} placeholder="e.g. High‑res imaging" />
      </label>
      <label>
        Target region / coverage
        <input name="region" value={answers.region} onChange={handleChange} placeholder="e.g. 30°N‑10°S" />
      </label>
      <label>
        Desired resolution (m)
        <input name="resolution" value={answers.resolution} onChange={handleChange} placeholder="e.g. 0.5" />
      </label>
      <label>
        Revisit time (hrs)
        <input name="revisit" value={answers.revisit} onChange={handleChange} placeholder="e.g. 12" />
      </label>
      <label>
        Preferred orbit
        <input name="orbit" value={answers.orbit} onChange={handleChange} placeholder="e.g. Sun‑sync" />
      </label>
      <label>
        Budget (USD)
        <input name="budget" value={answers.budget} onChange={handleChange} placeholder="e.g. 5M" />
      </label>
      <button className="cta" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? (
          <span className="spinner" style={{ display: 'inline-block', width: '1rem', height: '1rem', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', verticalAlign: 'middle', marginRight: '0.5rem' }}></span>
        ) : null}
        {loading ? 'Generating…' : 'Generate Design'}
      </button>
    </section>
  );
}
