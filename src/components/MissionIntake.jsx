import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MissionIntake.css';

const ARCHETYPE_META = {
  'earth-observation':      { label: 'Earth Observation', icon: '🛰️', color: '#10B981' },
  'iot-relay':              { label: 'IoT Relay',          icon: '📡', color: '#8B5CF6' },
  'communications':         { label: 'Communications',     icon: '🌐', color: '#3B82F6' },
  'technology-demonstration':{ label: 'Tech Demo',         icon: '🔬', color: '#F59E0B' },
  'scientific':             { label: 'Scientific',          icon: '🔭', color: '#EF4444' },
};

const EXAMPLE_PROMPTS = [
  {
    category: 'Earth Observation',
    archetypeId: 'earth-observation',
    icon: '🌿',
    title: 'Deforestation monitor',
    prompt: 'I need a satellite to monitor illegal deforestation in the Amazon and Congo basin. I want daily coverage with resolution good enough to detect individual trees being removed. The mission should last at least 5 years. Budget is around $5 million.',
  },
  {
    category: 'Earth Observation',
    archetypeId: 'earth-observation',
    icon: '🌊',
    title: 'Coastal flood response',
    prompt: 'Design a disaster response satellite for rapid flood mapping in Southeast Asia. It should be able to deliver imagery within 6 hours of a flood event, at 3–5m resolution. We have a budget of $8M and need a 7-year mission life.',
  },
  {
    category: 'IoT Relay',
    archetypeId: 'iot-relay',
    icon: '🌾',
    title: 'Agricultural sensor relay',
    prompt: 'I want to relay data from 50,000 soil moisture and weather sensors spread across remote farmland in Sub-Saharan Africa where there is no cellular network. Data latency of up to 2 hours is acceptable. Budget is $2M, mission life 7 years.',
  },
  {
    category: 'IoT Relay',
    archetypeId: 'iot-relay',
    icon: '🚢',
    title: 'Arctic maritime tracking',
    prompt: 'Track vessels in the Arctic shipping corridor where there is no AIS terrestrial coverage. I need position updates every 4 hours for up to 2,000 vessels. Budget $3M. Mission life 5 years.',
  },
  {
    category: 'Tech Demo',
    archetypeId: 'technology-demonstration',
    icon: '⚡',
    title: 'Electric propulsion demo',
    prompt: 'We want to demonstrate a new low-power Hall-effect thruster on a 6U CubeSat in LEO. Mission success is firing the thruster for 100 hours and measuring specific impulse. Budget $800K. Mission life 18 months.',
  },
  {
    category: 'Tech Demo',
    archetypeId: 'technology-demonstration',
    icon: '🌌',
    title: 'Space debris capture demo',
    prompt: 'Prove out a net-capture mechanism for space debris on a 12U CubeSat. Target is to capture a simulated debris object (deploying our own target) at 450km LEO. Budget $1.5M, 1-year mission.',
  },
  {
    category: 'Scientific',
    archetypeId: 'scientific',
    icon: '🌡️',
    title: 'Atmospheric composition',
    prompt: 'We need a satellite to continuously measure methane and CO2 concentrations globally to support climate monitoring. High measurement precision is critical. Budget up to $80M. Mission life 10 years.',
  },
  {
    category: 'Communications',
    archetypeId: 'communications',
    icon: '📶',
    title: 'Rural broadband relay',
    prompt: 'Provide broadband internet to rural communities in East Africa that currently have no connectivity. Target throughput 50 Mbps per beam across 10 simultaneous beams. Budget $200M. 15-year mission.',
  },
];

export default function MissionIntake() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [archetype, setArchetype] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('examples'); // 'examples' | 'freeform'

  useEffect(() => {
    const saved = sessionStorage.getItem('selectedArchetype');
    if (saved) {
      setArchetype(saved);
      setActiveTab('freeform');
    }
  }, []);

  const applyPrompt = (p) => {
    setDescription(p.prompt);
    setArchetype(p.archetypeId);
    setActiveTab('freeform');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (!description.trim()) { setError('Please describe your mission before continuing.'); return; }
    setError('');
    setLoading(true);
    sessionStorage.setItem('missionDescription', description.trim());
    sessionStorage.setItem('selectedArchetype', archetype || '');
    sessionStorage.setItem('interviewHistory', JSON.stringify([]));
    navigate('/interview');
  };

  const selectedMeta = archetype ? ARCHETYPE_META[archetype] : null;

  return (
    <div className="intake-root">

      {/* Nav */}
      <nav className="intake-nav">
        <button className="nav-back" onClick={() => navigate('/')}>&#8592; Back</button>
        <div className="nav-center">
          <span className="nav-logo">&#9689; Orbital</span>
          <div className="breadcrumb">
            <span className="bc-done">Gallery</span>
            <span className="bc-sep">›</span>
            <span className="bc-active">Mission Intake</span>
            <span className="bc-sep">›</span>
            <span className="bc-next">Interview</span>
            <span className="bc-sep">›</span>
            <span className="bc-next">Design</span>
          </div>
        </div>
        <div style={{ width: 80 }} />
      </nav>

      <div className="intake-layout">

        {/* Left column — tabs */}
        <div className="intake-main">

          {/* Tab switcher */}
          <div className="tab-bar">
            <button
              className={'tab-btn' + (activeTab === 'examples' ? ' tab-active' : '')}
              onClick={() => setActiveTab('examples')}
            >
              &#9733; Example missions
            </button>
            <button
              className={'tab-btn' + (activeTab === 'freeform' ? ' tab-active' : '')}
              onClick={() => setActiveTab('freeform')}
            >
              Write my own
            </button>
          </div>

          {/* ── Example prompts tab ── */}
          {activeTab === 'examples' && (
            <div className="examples-panel">
              <p className="examples-intro">
                Click any example to pre-fill your mission description. You can edit it before submitting.
              </p>
              <div className="prompt-grid">
                {EXAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    className="prompt-card"
                    onClick={() => applyPrompt(p)}
                  >
                    <div className="prompt-card-top">
                      <span className="prompt-icon">{p.icon}</span>
                      <div>
                        <span className="prompt-category">{p.category}</span>
                        <h4 className="prompt-title">{p.title}</h4>
                      </div>
                    </div>
                    <p className="prompt-preview">{p.prompt.slice(0, 110)}…</p>
                    <span className="prompt-use-cta">Use this prompt &#8594;</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Freeform tab ── */}
          {activeTab === 'freeform' && (
            <div className="freeform-panel">

              {/* Archetype selector */}
              <div className="field-group">
                <label className="field-label">SATELLITE TYPE <span className="field-optional">(optional — improves design accuracy)</span></label>
                <div className="archetype-chips">
                  {Object.entries(ARCHETYPE_META).map(([id, meta]) => (
                    <button
                      key={id}
                      className={'chip' + (archetype === id ? ' chip-active' : '')}
                      style={archetype === id ? { '--chip-color': meta.color } : {}}
                      onClick={() => setArchetype(archetype === id ? '' : id)}
                    >
                      {meta.icon} {meta.label}
                    </button>
                  ))}
                </div>
                {selectedMeta && (
                  <div className="chip-selected-note" style={{ color: selectedMeta.color }}>
                    ✓ {selectedMeta.label} assumptions will be applied
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="field-group">
                <label className="field-label">MISSION DESCRIPTION</label>
                <textarea
                  className="mission-textarea"
                  rows={9}
                  placeholder={
                    'Describe your satellite mission in plain language.\n\n' +
                    'Include:\n' +
                    '• What you want to observe, measure, or transmit\n' +
                    '• Where (region, global, or orbit preference)\n' +
                    '• How often / how fast you need results\n' +
                    '• Rough budget or size (CubeSat, microsatellite, etc.)\n' +
                    '• Mission lifetime\n\n' +
                    'Example: "I want to monitor crop health across East Africa with weekly imagery at 10m resolution. Budget is $3M, 5-year mission."'
                  }
                  value={description}
                  onChange={e => { setDescription(e.target.value); setError(''); }}
                />
                <div className="textarea-footer">
                  <span className="char-count">{description.length} chars</span>
                  <span className="char-hint">More detail → more accurate design</span>
                </div>
              </div>

              {error && <div className="intake-error">{error}</div>}

              <button
                className="btn-begin"
                onClick={handleSubmit}
                disabled={loading || !description.trim()}
              >
                {loading && <span className="spinner" />}
                {loading ? 'Starting…' : 'Begin Orbital Interview →'}
              </button>

              <p className="intake-footer-note">
                Orbital, our AI space systems engineer, will ask 2–4 focused questions — then generate your complete satellite design.
              </p>

              {/* Tip to use examples */}
              {!description && (
                <button className="tip-examples-link" onClick={() => setActiveTab('examples')}>
                  &#128161; Not sure what to write? Browse example missions
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar — what to expect */}
        <aside className="intake-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">What you'll get</h3>
            <ul className="sidebar-list">
              {[
                'Full mission profile with orbit parameters',
                'Subsystem breakdown with rationale',
                'Bill of Materials with mass & power',
                'Cost estimates (min / mid / max)',
                'Power balance & downlink simulation',
                '2 trade-off variants (cost vs. mass)',
                'Inline engineering education notes',
              ].map(item => (
                <li key={item}>
                  <span className="sidebar-check">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-card sidebar-tip">
            <div className="tip-icon">💡</div>
            <div>
              <strong>Tip</strong>
              <p>You don't need to know anything about satellite engineering. Write your mission goal the same way you'd explain it to a friend. <strong>Orbital</strong>, our AI system, will handle the technical translation.</p>
            </div>
          </div>

          <div className="sidebar-card sidebar-tip">
            <div className="tip-icon">🔒</div>
            <div>
              <strong>Privacy</strong>
              <p>Your mission description is only used for the current design session. Nothing is stored after you close the browser.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
