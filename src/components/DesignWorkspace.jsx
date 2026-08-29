import React, { useEffect, useState } from "react";
import "./DesignWorkspace.css";
import { applyTrade } from "../utils/tradeService";


export default function DesignWorkspace() {
  const [design, setDesign] = useState(null);
  const [error, setError] = useState(null);

  // Load design from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem("satelliteDesign");
    if (raw) {
      try {
        setDesign(JSON.parse(raw));
      } catch (e) {
        setError("Failed to parse saved design.");
      }
    } else {
      setError("No design data found. Complete the interview first.");
    }
  }, []);

  const handleTrade = (type) => {
    if (!design) return;
    const updated = applyTrade(design, type);
    setDesign(updated);
  };

  if (error) {
    return (
      <section className="design-workspace">
        <h2 className="section-title">Design Workspace</h2>
        <p className="error-msg">{error}</p>
      </section>
    );
  }

  if (!design) {
    return (
      <section className="design-workspace">
        <h2 className="section-title">Design Workspace</h2>
        <p>Loading design…</p>
      </section>
    );
  }

  const { missionProfile, subsystems, simulations, tradeOffVariants } = design;

  return (
    <section className="design-workspace">
      <h2 className="section-title">Design Workspace</h2>
      <img src="/satellite_block_diagram.png" alt="Satellite block diagram" className="block-diagram" />

      {/* Mission Profile */}
      <div className="design-section mission-profile">
        <h3 className="section-subtitle">Mission Profile</h3>
        <ul className="profile-list">
          <li><strong>Name:</strong> {missionProfile?.name}</li>
          <li><strong>Description:</strong> {missionProfile?.description}</li>
          <li><strong>Orbit:</strong> {missionProfile?.orbitType} ({missionProfile?.altitudeKm} km)</li>
          <li><strong>Lifespan:</strong> {missionProfile?.targetLifespanYears} yr</li>
          <li><strong>Mass:</strong> {missionProfile?.totalMassKg} kg</li>
          <li><strong>Power:</strong> {missionProfile?.totalPowerW} W</li>
          <li><strong>Cost:</strong> ${missionProfile?.estimatedCostUSD?.min ?? "?"} – ${missionProfile?.estimatedCostUSD?.mid ?? "?"} – ${missionProfile?.estimatedCostUSD?.max ?? "?"}</li>
        </ul>
      </div>

      {/* Subsystems */}
      <div className="design-section subsystems">
        <h3 className="section-subtitle">Subsystems</h3>
        {subsystems?.map((sub) => (
          <details key={sub.id} className="subsystem-detail">
            <summary>{sub.name}</summary>
            <ul>
              {sub.components?.map((c, i) => (
                <li key={i}>
                  <strong>{c.name}</strong> – mass: {c.massKg} kg, power: {c.powerConsumptionW} W, cost: ${c.estimatedCostUSD?.min ?? "?"}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      {/* Simulations */}
      <div className="design-section simulations">
        <h3 className="section-subtitle">Simulations</h3>
        <pre className="sim-json">{JSON.stringify(simulations, null, 2)}</pre>
      </div>

      {/* Trade‑off Variants */}
      <div className="design-section tradeoffs">
        <h3 className="section-subtitle">Trade‑off Variants</h3>
        {tradeOffVariants?.map((v, i) => (
          <article key={i} className="trade-variant">
            <h4>{v.title}</h4>
            <p><strong>Objective:</strong> {v.objective}</p>
            <p>{v.description}</p>
            <ul>
              {v.changes?.map((c, idx) => (<li key={idx}>{c}</li>))}
            </ul>
            <p><strong>Impact:</strong> {v.impactMassKg} kg, ${v.impactCostUSD}</p>
          </article>
        ))}
      </div>

      {/* Trade Buttons */}
      <div className="design-section trade-actions">
        <h3 className="section-subtitle">Apply Trade Adjustments</h3>
        <button className="btn-trade" onClick={() => handleTrade('cost')}>Cost‑Optimized (‑20%)</button>
        <button className="btn-trade" onClick={() => handleTrade('mass')}>Mass‑Optimized (‑15%)</button>
        <button className="btn-trade" onClick={() => handleTrade('power')}>Power‑Optimized (‑10%)</button>
      </div>
    </section>
  );
}

