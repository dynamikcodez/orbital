import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DiscoveryGallery.css';

const ARCHETYPES = [
  {
    id: 'earth-observation',
    name: 'Earth Observation',
    tagline: 'Imaging the planet from orbit.',
    description: 'Agriculture, disaster response, urban planning, deforestation tracking.',
    orbitType: 'SSO', altKm: '450–650', lifespanYrs: '3–7',
    costRange: '$1M–$15M', massRange: '5–500 kg', icon: '🛰️',
    accentColor: '#10B981',
    useCases: ['Agricultural yield forecasting', 'Flood & disaster mapping', 'Urban growth tracking', 'Illegal deforestation detection'],
    keySubsystems: ['High-res optical payload', 'Precise ADCS (pointing)', 'X-band downlink', 'High-capacity onboard storage'],
    educationNote: 'Resolution and revisit time are the fundamental tradeoff. A single large satellite visits your target once a day with sharp imagery. A constellation of small, cheap satellites can revisit every 30 minutes at lower resolution. Planet Labs built a $1B+ company on the second approach.',
    realExamples: [
      { name: 'Dove (3U CubeSat)', operator: 'Planet Labs', year: 2013 },
      { name: 'SkySat (sub-metre HD)', operator: 'Planet Labs', year: 2013 },
    ],
  },
  {
    id: 'iot-relay',
    name: 'IoT Relay',
    tagline: 'Connecting sensors beyond cellular.',
    description: 'UHF/VHF relay for billions of ground sensors with no cellular coverage.',
    orbitType: 'LEO', altKm: '550–650', lifespanYrs: '5–10',
    costRange: '$500K–$5M', massRange: '2–50 kg', icon: '📡',
    accentColor: '#8B5CF6',
    useCases: ['Remote asset tracking', 'Agricultural sensor relay', 'Maritime monitoring', 'Environmental compliance'],
    keySubsystems: ['UHF/VHF transceiver payload', 'Low-power bus', 'Store-and-forward processor', 'Omnidirectional antenna'],
    educationNote: 'IoT relay satellites win by being cheap enough to fly in large constellations. The key engineering tradeoff is latency — store-and-forward architecture means a sensor reading may take minutes to reach its destination, not milliseconds.',
    realExamples: [
      { name: 'ARGOS system', operator: 'CLS / NOAA', year: 1978 },
      { name: 'LoRa LEO nodes', operator: 'Lacuna Space', year: 2020 },
    ],
  },
  {
    id: 'communications',
    name: 'Communications',
    tagline: 'Broadband, TV and backhaul from GEO.',
    description: 'High-bandwidth transponder satellites delivering broadband and TV globally.',
    orbitType: 'GEO', altKm: '35,786', lifespanYrs: '15–20',
    costRange: '$150M–$400M', massRange: '2,000–8,000 kg', icon: '🌐',
    accentColor: '#3B82F6',
    useCases: ['Direct-to-home television', 'Enterprise broadband', 'Maritime VSAT', 'Government SATCOM'],
    keySubsystems: ['High-power Ku/Ka transponder', 'Large deployable solar arrays', 'Electric propulsion', 'Steerable spot-beam antenna'],
    educationNote: 'GEO satellites appear stationary from the ground — ideal for broadcast and always-on links. The 35,786 km altitude adds ~600ms round-trip latency, which is imperceptible watching TV but ruins interactive gaming and voice calls.',
    realExamples: [
      { name: 'Intelsat 37e', operator: 'Intelsat', year: 2017 },
      { name: 'Viasat-3 Americas', operator: 'Viasat', year: 2023 },
    ],
  },
  {
    id: 'technology-demonstration',
    name: 'Tech Demo',
    tagline: 'Validate new tech at low cost and risk.',
    description: 'Short-lived, low-cost missions to prove novel technologies before full programs.',
    orbitType: 'LEO', altKm: '400–550', lifespanYrs: '1–3',
    costRange: '$200K–$5M', massRange: '1–30 kg', icon: '🔬',
    accentColor: '#F59E0B',
    useCases: ['Novel propulsion validation', 'New sensor testing', 'Algorithm flight heritage', 'University research missions'],
    keySubsystems: ['Experimental payload', 'COTS CubeSat bus', 'GPS receiver', 'S-band telemetry link'],
    educationNote: 'Tech demo satellites deliberately trade reliability for cost. A 6U CubeSat using commercial-off-the-shelf parts can achieve flight heritage for $500K — giving an experimental technology the credibility needed to fly on a $50M operational mission.',
    realExamples: [
      { name: 'LightSail 2 (solar sail)', operator: 'Planetary Society', year: 2019 },
      { name: 'CAPSTONE (lunar orbit)', operator: 'NASA / Advanced Space', year: 2022 },
    ],
  },
  {
    id: 'scientific',
    name: 'Scientific',
    tagline: 'Precision instruments for science.',
    description: 'Mission-specific orbits and precision instruments for Earth science and astrophysics.',
    orbitType: 'MEO', altKm: 'Mission-specific', lifespanYrs: '3–15',
    costRange: '$50M–$1B+', massRange: '100–6,000 kg', icon: '🔭',
    accentColor: '#EF4444',
    useCases: ['Global climate monitoring', 'Ice sheet & gravimetry', 'Space weather observation', 'Atmospheric composition'],
    keySubsystems: ['Precision science instrument suite', 'Cryogenic thermal control', 'High-volume onboard storage', 'Deep-space / X-band comms'],
    educationNote: 'Scientific missions optimise for measurement accuracy above all else. Many instruments must be cooled to within a degree of absolute zero to detect faint signals — making thermal control one of the most complex engineering challenges on these missions.',
    realExamples: [
      { name: 'GRACE-FO (gravity mapping)', operator: 'NASA / DLR', year: 2018 },
      { name: 'ICESat-2 (ice altimetry)', operator: 'NASA', year: 2018 },
    ],
  },
];

const ORBIT_COLOR = { SSO: '#10B981', LEO: '#3B82F6', MEO: '#F59E0B', GEO: '#8B5CF6' };

const PROCESS_STEPS = [
  { num: '01', label: 'Pick archetype', desc: 'Choose a satellite category to seed your design with the right assumptions.' },
  { num: '02', label: 'Describe mission', desc: 'Write your mission objective in plain language — no jargon needed.' },
  { num: '03', label: 'Answer 2–4 questions', desc: 'Orbital, our AI system, asks focused clarifying questions — one at a time, no engineering jargon.' },
  { num: '04', label: 'Get full design', desc: 'Receive a complete engineering design with BoM, simulations, and cost ranges.' },
];

export default function DiscoveryGallery() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const handleSelect = (id) => {
    sessionStorage.setItem('selectedArchetype', id);
    navigate('/mission');
  };

  const handleSkip = () => {
    sessionStorage.removeItem('selectedArchetype');
    navigate('/mission');
  };

  return (
    <div className="gallery-root">

      {/* ── Top nav ── */}
      <nav className="gallery-nav">
        <div className="nav-logo">
          <span className="logo-dot">&#9689;</span>
          <span className="logo-name">Orbital</span>
          <span className="logo-tag">AI Satellite Engineering</span>
        </div>
        <button className="nav-skip" onClick={handleSkip}>
          Skip to mission intake &#8594;
        </button>
        <button
          className="nav-skip"
          onClick={() => navigate('/xr')}
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
          }}
        >
          🥽 XR Demo
        </button>
      </nav>

      {/* ── Hero ── */}
      <header className="gallery-hero">
        <div className="hero-eyebrow">AI-POWERED SPACE SYSTEMS ENGINEERING</div>
        <h1 className="hero-title">
          Design a satellite.<br />
          <span className="hero-title-accent">In minutes, not months.</span>
        </h1>
        <p className="hero-sub">
          Tell us what you want your satellite to do. <strong className="hero-brand">Orbital</strong>, our AI space systems engineer,
          will ask a few clarifying questions and then produce a complete engineering design —
          subsystems, Bill of Materials, power simulation, and cost estimates — all grounded in real mission data.
        </p>

        {/* Process steps */}
        <div className="process-steps">
          {PROCESS_STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="process-step">
                <span className="step-num">{s.num}</span>
                <div className="step-body">
                  <strong className="step-label">{s.label}</strong>
                  <span className="step-desc">{s.desc}</span>
                </div>
              </div>
              {i < PROCESS_STEPS.length - 1 && <div className="step-connector" />}
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* ── Archetype grid ── */}
      <section className="gallery-section">
        <div className="section-header">
          <h2 className="section-title">Choose a starting point</h2>
          <p className="section-sub">
            Each archetype pre-loads the right engineering assumptions, orbit parameters, and cost benchmarks for your mission type.
          </p>
        </div>

        <div className="gallery-grid">
          {ARCHETYPES.map((a) => {
            const isExpanded = expanded === a.id;
            const orbitColor = ORBIT_COLOR[a.orbitType] || '#3B82F6';
            return (
              <div
                key={a.id}
                className={'archetype-card' + (isExpanded ? ' is-expanded' : '') + (hovered === a.id ? ' is-hovered' : '')}
                style={{ '--card-accent': a.accentColor }}
                onMouseEnter={() => setHovered(a.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setExpanded(isExpanded ? null : a.id)}
              >
                {/* Accent top border */}
                <div className="card-accent-bar" />

                <div className="card-head">
                  <span className="card-icon">{a.icon}</span>
                  <div className="card-head-right">
                    <h3 className="card-name">{a.name}</h3>
                    <span className="card-orbit-badge" style={{ background: orbitColor + '1a', color: orbitColor, borderColor: orbitColor + '40' }}>
                      {a.orbitType} · {a.altKm} km
                    </span>
                  </div>
                </div>

                <p className="card-tagline">{a.tagline}</p>
                <p className="card-desc">{a.description}</p>

                <div className="card-meta-row">
                  <div className="meta-item">
                    <span className="meta-label">LIFESPAN</span>
                    <span className="meta-val">{a.lifespanYrs} yr</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">MASS RANGE</span>
                    <span className="meta-val">{a.massRange}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">EST. COST</span>
                    <span className="meta-val" style={{ color: a.accentColor }}>{a.costRange}</span>
                  </div>
                </div>

                {/* Expandable detail */}
                {isExpanded && (
                  <div className="card-detail" onClick={e => e.stopPropagation()}>
                    <div className="detail-grid">
                      <div>
                        <h4 className="detail-section-label">USE CASES</h4>
                        <ul className="detail-list">
                          {a.useCases.map(u => <li key={u}>{u}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="detail-section-label">KEY SUBSYSTEMS</h4>
                        <ul className="detail-list">
                          {a.keySubsystems.map(s => <li key={s}>{s}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="detail-examples">
                      <h4 className="detail-section-label">REAL MISSIONS</h4>
                      <div className="examples-row">
                        {a.realExamples.map(ex => (
                          <span key={ex.name} className="example-chip">
                            {ex.name} &middot; {ex.operator} &middot; {ex.year}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="detail-insight">
                      <span className="insight-icon">&#128161;</span>
                      <div>
                        <span className="insight-label">ENGINEERING INSIGHT</span>
                        <p className="insight-text">{a.educationNote}</p>
                      </div>
                    </div>

                    <button className="btn-select" onClick={() => handleSelect(a.id)}>
                      Design a {a.name} satellite &#8594;
                    </button>
                  </div>
                )}

                {!isExpanded && (
                  <div className="card-footer">
                    <span className="expand-hint">Tap to explore &darr;</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Skip option */}
        <div className="gallery-skip-row">
          <span className="skip-label">Not sure which type fits your mission?</span>
          <button className="btn-skip-text" onClick={handleSkip}>
            Describe your mission freely &#8594;
          </button>
        </div>
      </section>
    </div>
  );
}
