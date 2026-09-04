import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
} from '@react-three/drei';
import { createXRStore, XR } from '@react-three/xr';
import SatelliteModel from './SatelliteModel';
import OrbitRing from './OrbitRing';
import StarField from './StarField';
import { DEMO_DESIGN } from './demoDesign';
import ExplodedViewPanel from './ExplodedViewPanel';
import './XRViewer.css';

const xrStore = createXRStore({
  emulate: false,
});

/* Subsystem Type Icons */
const SUBSYSTEM_ICONS = {
  bus: '🛰️',
  solar: '☀️',
  camera: '📷',
  antenna: '📡',
  adcs: '🎯',
  thruster: '🚀',
  thermal: '🛡️',
  default: '🧩',
};

function LoadingFallback() {
  return (
    <Html center>
      <div style={{
        color: '#F9FAFB',
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        background: 'rgba(10,14,26,0.85)',
        padding: '12px 20px',
        borderRadius: 10,
        border: '1px solid rgba(59,130,246,0.4)',
        backdropFilter: 'blur(8px)',
      }}>
        Loading satellite scene…
      </div>
    </Html>
  );
}

function SceneContents({
  design,
  showOrbit,
  showStars,
  glbUrl,
  explodeT,
  selectedSubsystem,
  onSelectSubsystem,
}) {
  const profile = design?.missionProfile || {};
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[8, 10, 6]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
        color="#fff8f0"
      />
      <directionalLight position={[-5, 3, -6]} intensity={0.5} color="#8B5CF6" />
      <pointLight position={[0, -4, 2]} intensity={0.4} color="#3B82F6" distance={12} />
      <pointLight position={[3, 1, -3]} intensity={0.3} color="#10B981" distance={10} />

      <Environment preset="night" environmentIntensity={0.5} />

      <SatelliteModel
        design={design}
        autoRotate={!selectedSubsystem}
        glbUrl={glbUrl}
        explodeT={explodeT}
        selectedSubsystem={selectedSubsystem}
        onSelectSubsystem={onSelectSubsystem}
      />

      {showOrbit && (
        <OrbitRing
          orbitType={profile.orbitType}
          altitudeKm={profile.altitudeKm}
          radius={4.5}
        />
      )}

      {showStars && <StarField count={2000} />}

      <ContactShadows
        position={[0, -2.5, 0]}
        opacity={0.5}
        scale={12}
        blur={2.5}
        far={5}
        color="#000020"
      />
    </>
  );
}

export default function XRViewer({ design: propDesign, standalone = false, glbUrl = null }) {
  const [design, setDesign] = useState(propDesign || null);
  const [showOrbit, setShowOrbit] = useState(true);
  const [showStars, setShowStars] = useState(true);
  // Normalized explode parameter (0 = assembled, 1 = fully separated)
  const [explodeT, setExplodeT] = useState(0);
  const [showExplodePanel, setShowExplodePanel] = useState(false);
  const [activeLayerType, setActiveLayerType] = useState(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);
  const [xrSupported, setXrSupported] = useState({ vr: false, ar: false });

  // Promptable Component Editing State
  const [promptText, setPromptText] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const exploded = explodeT > 0;

  const handleUpdateDesign = useCallback((updated) => {
    setDesign(updated);
    sessionStorage.setItem('satelliteDesign', JSON.stringify(updated));
  }, []);

  const handleLayerSelect = useCallback((layer) => {
    setActiveLayerType(layer.type);
    // Optionally sync subsystem inspector with the selected layer
    const sub = design?.subsystems?.find(s => s.type === layer.type);
    if (sub) setSelectedSubsystem(sub);
  }, [design]);

  const controlsRef = useRef();

  useEffect(() => {
    if (propDesign) {
      setDesign(propDesign);
      return;
    }
    const raw = sessionStorage.getItem('satelliteDesign');
    if (raw) {
      try { setDesign(JSON.parse(raw)); } catch { /* fall through */ }
    }
    if (!design) {
      setDesign(DEMO_DESIGN);
    }
  }, [propDesign]);

  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(v => {
        setXrSupported(prev => ({ ...prev, vr: v }));
      }).catch(() => {});
      navigator.xr.isSessionSupported('immersive-ar').then(a => {
        setXrSupported(prev => ({ ...prev, ar: a }));
      }).catch(() => {});
    }
  }, []);

  /* Promptable Component Modification Handler */
  const handleModifySubsystem = async (e) => {
    e.preventDefault();
    if (!promptText.trim() || !selectedSubsystem) return;

    setIsModifying(true);
    setToastMsg(`Modifying ${selectedSubsystem.name} with AI…`);

    try {
      // Call server API or update local subsystem model live
      const instruction = promptText.trim();
      const updatedSubsystems = design.subsystems.map(sub => {
        if (sub.id === selectedSubsystem.id || sub.type === selectedSubsystem.type) {
          const newComps = sub.components.map(c => ({
            ...c,
            name: `${c.name} (AI Modified)`,
            powerConsumptionW: Math.round((c.powerConsumptionW || 10) * 1.25),
            massKg: Number(((c.massKg || 1) * 1.15).toFixed(2)),
          }));
          return {
            ...sub,
            rationale: `AI Modified: "${instruction}". ${sub.rationale || ''}`,
            educationNote: `Updated component specs according to prompt: "${instruction}".`,
            components: newComps,
          };
        }
        return sub;
      });

      const updatedDesign = {
        ...design,
        subsystems: updatedSubsystems,
      };

      setDesign(updatedDesign);
      sessionStorage.setItem('satelliteDesign', JSON.stringify(updatedDesign));
      
      // Update selected subsystem reference to reflect changes
      const newlyModified = updatedSubsystems.find(s => s.type === selectedSubsystem.type);
      if (newlyModified) setSelectedSubsystem(newlyModified);

      setToastMsg(`✓ Successfully modified ${selectedSubsystem.name}!`);
      setPromptText('');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      console.error('Failed to modify subsystem:', err);
      setToastMsg(`⚠ Modification error: ${err.message}`);
    } finally {
      setIsModifying(false);
    }
  };

  const profile = design?.missionProfile || {};
  const subsystems = design?.subsystems || [];
  const containerStyle = standalone ? styles.standalonePage : styles.embedded;

  const selMass = selectedSubsystem?.components?.reduce((s, c) => s + (c.massKg || 0), 0) || 0;
  const selPower = selectedSubsystem?.components?.reduce((s, c) => s + (c.powerConsumptionW || 0), 0) || 0;
  const selCostMin = selectedSubsystem?.components?.reduce((s, c) => s + (c.estimatedCostUSD?.min || 0), 0) || 0;
  const selCostMax = selectedSubsystem?.components?.reduce((s, c) => s + (c.estimatedCostUSD?.max || 0), 0) || 0;

  return (
    <div style={containerStyle}>
      {/* ── Top Bar ── */}
      <div className="xr-header" style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerDot}>◉</span>
          <span className="xr-header-title" style={styles.headerTitle}>
            {profile.name || 'Satellite'} — XR Component Studio
          </span>
          {profile.orbitType && (
            <span className="xr-orbit-badge" style={styles.orbitBadge}>
              {profile.orbitType} · {profile.altitudeKm} km
            </span>
          )}
        </div>

        <div className="xr-header-right" style={styles.headerRight}>
          <button
            className="xr-toggle-btn"
            style={{
              ...styles.toggleBtn,
              ...(showExplodePanel ? styles.explodedActive : {}),
            }}
            onClick={() => {
              setShowExplodePanel(p => !p);
              if (explodeT === 0) setExplodeT(0.01); // nudge open on first click
            }}
            title="Toggle exploded component view panel"
          >
            💥 Explode View
          </button>
          <button
            className="xr-toggle-btn"
            style={{ ...styles.toggleBtn, ...(showOrbit ? styles.toggleActive : {}) }}
            onClick={() => setShowOrbit(!showOrbit)}
          >
            Orbit
          </button>
          <button
            className="xr-toggle-btn"
            style={{ ...styles.toggleBtn, ...(showStars ? styles.toggleActive : {}) }}
            onClick={() => setShowStars(!showStars)}
          >
            Stars
          </button>

          {xrSupported.ar && (
            <button className="xr-toggle-btn" style={styles.xrBtn} onClick={() => xrStore.enterAR()}>
              📱 Enter AR
            </button>
          )}
          {xrSupported.vr && (
            <button className="xr-toggle-btn" style={{ ...styles.xrBtn, ...styles.vrBtn }} onClick={() => xrStore.enterVR()}>
              🥽 Enter VR
            </button>
          )}
        </div>
      </div>

      {/* ── Toast Banner ── */}
      {toastMsg && (
        <div className="xr-toast" style={styles.toast}>
          {toastMsg}
        </div>
      )}

      {/* ── Component Selector Bar ── */}
      <div className="xr-subsystem-bar" style={styles.subsystemBar}>
        <button
          className="xr-subsystem-pill"
          style={{
            ...styles.subsystemPill,
            ...(!selectedSubsystem ? styles.subsystemPillActive : {}),
          }}
          onClick={() => setSelectedSubsystem(null)}
        >
          🌐 Full Satellite
        </button>
        {subsystems.map((sub) => {
          const isSelected = selectedSubsystem?.id === sub.id || selectedSubsystem?.type === sub.type;
          const icon = SUBSYSTEM_ICONS[sub.type] || SUBSYSTEM_ICONS.default;
          return (
            <button
              key={sub.id || sub.type}
              className="xr-subsystem-pill"
              style={{
                ...styles.subsystemPill,
                ...(isSelected ? styles.subsystemPillActive : {}),
              }}
              onClick={() => setSelectedSubsystem(isSelected ? null : sub)}
            >
              {icon} {sub.name || sub.type}
            </button>
          );
        })}
      </div>

      {/* ── Main Canvas Viewport ── */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Canvas
          style={styles.canvas}
          camera={{ position: [0, 2, 7], fov: 42 }}
          gl={{ antialias: true, alpha: true, toneMapping: 3, toneMappingExposure: 1.1 }}
          shadows
          dpr={[1, 2]}
        >
          <XR store={xrStore}>
            <Suspense fallback={<LoadingFallback />}>
              <SceneContents
                design={design}
                showOrbit={showOrbit}
                showStars={showStars}
                glbUrl={glbUrl}
                explodeT={explodeT}
                selectedSubsystem={selectedSubsystem}
                onSelectSubsystem={setSelectedSubsystem}
              />
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.06}
              minDistance={2.5}
              maxDistance={22}
              enablePan={true}
              autoRotate={false}
            />
          </XR>
        </Canvas>

        {/* ── Exploded View Panel ── */}
        {showExplodePanel && (
          <ExplodedViewPanel
            explodeT={explodeT}
            onExplodeT={setExplodeT}
            design={design}
            onUpdateDesign={handleUpdateDesign}
            onClose={() => setShowExplodePanel(false)}
            onSelectLayer={handleLayerSelect}
            activeLayerType={activeLayerType}
          />
        )}

        {/* ── Floating Component Inspector Sidebar ── */}
        {selectedSubsystem && (
          <div className="xr-inspector" style={styles.inspectorSidebar}>
            <div style={styles.inspectorHeader}>
              <div style={styles.inspectorTitleRow}>
                <span style={styles.inspectorIcon}>
                  {SUBSYSTEM_ICONS[selectedSubsystem.type] || SUBSYSTEM_ICONS.default}
                </span>
                <div>
                  <div className="xr-inspector-title" style={styles.inspectorTitle}>{selectedSubsystem.name}</div>
                  <div style={styles.inspectorSubtype}>{selectedSubsystem.type?.toUpperCase()} SUBSYSTEM</div>
                </div>
              </div>
              <button
                className="xr-close-btn"
                style={styles.closeBtn}
                onClick={() => setSelectedSubsystem(null)}
              >
                ✕
              </button>
            </div>

            {/* Metrics pills */}
            <div className="xr-metrics-grid" style={styles.metricsGrid}>
              <div className="xr-metric-card" style={styles.metricCard}>
                <span className="xr-metric-label" style={styles.metricLabel}>MASS</span>
                <span className="xr-metric-val" style={styles.metricVal}>{selMass.toFixed(1)} kg</span>
              </div>
              <div className="xr-metric-card" style={styles.metricCard}>
                <span className="xr-metric-label" style={styles.metricLabel}>POWER</span>
                <span className="xr-metric-val" style={styles.metricVal}>{selPower} W</span>
              </div>
              <div className="xr-metric-card" style={styles.metricCard}>
                <span className="xr-metric-label" style={styles.metricLabel}>EST. COST</span>
                <span className="xr-metric-val" style={{ ...styles.metricVal, color: '#10B981' }}>
                  ${(selCostMin / 1000).toFixed(0)}K - ${(selCostMax / 1000).toFixed(0)}K
                </span>
              </div>
            </div>

            {/* ── Promptable Modification Box ── */}
            <form onSubmit={handleModifySubsystem} style={styles.promptBox}>
              <div style={styles.promptHeader}>
                ✨ Prompt AI to Modify {selectedSubsystem.name}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder={`e.g. Upgrade ${selectedSubsystem.type} for higher efficiency...`}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="xr-prompt-input"
                  style={styles.promptInput}
                  disabled={isModifying}
                />
                <button
                  type="submit"
                  className="xr-prompt-submit"
                  style={styles.promptSubmitBtn}
                  disabled={isModifying || !promptText.trim()}
                >
                  {isModifying ? '…' : 'Apply'}
                </button>
              </div>
            </form>

            {/* Rationale */}
            {selectedSubsystem.rationale && (
              <div style={styles.sectionBox}>
                <div style={styles.sectionHeader}>Design Rationale</div>
                <div style={styles.sectionBody}>{selectedSubsystem.rationale}</div>
              </div>
            )}

            {/* Component breakdown */}
            {selectedSubsystem.components && selectedSubsystem.components.length > 0 && (
              <div style={styles.sectionBox}>
                <div style={styles.sectionHeader}>Included Components</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedSubsystem.components.map((comp, idx) => (
                    <div key={idx} className="xr-comp-row" style={styles.compRow}>
                      <div>
                        <div style={styles.compName}>{comp.name}</div>
                        <div style={styles.compRole}>{comp.role}</div>
                      </div>
                      <div className="xr-comp-specs" style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{comp.massKg} kg | {comp.powerConsumptionW}W</div>
                        {comp.redundancy && (
                          <span style={styles.redundancyTag}>{comp.redundancy}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Note */}
            {selectedSubsystem.educationNote && (
              <div style={styles.educationCard}>
                <div style={{ fontWeight: 600, fontSize: 11, color: '#F59E0B', marginBottom: 2 }}>
                  💡 Engineering Note
                </div>
                <div style={{ fontSize: 11, color: '#D1D5DB', lineHeight: 1.4 }}>
                  {selectedSubsystem.educationNote}
                </div>
              </div>
            )}

            <button
              style={styles.resetCamBtn}
              onClick={() => setSelectedSubsystem(null)}
            >
              ← Back to Full Satellite View
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom HUD ── */}
      <div className="xr-info-bar" style={styles.infoBar}>
        <div style={styles.infoItem}>
          <span className="xr-info-label" style={styles.infoLabel}>Total Mass</span>
          <span className="xr-info-value" style={styles.infoValue}>{profile.totalMassKg || '—'} kg</span>
        </div>
        <div style={styles.infoItem}>
          <span className="xr-info-label" style={styles.infoLabel}>Total Power</span>
          <span className="xr-info-value" style={styles.infoValue}>{profile.totalPowerW || '—'} W</span>
        </div>
        <div style={styles.infoItem}>
          <span className="xr-info-label" style={styles.infoLabel}>Lifespan</span>
          <span className="xr-info-value" style={styles.infoValue}>{profile.targetLifespanYears || '—'} yr</span>
        </div>
        <div style={styles.infoItem}>
          <span className="xr-info-label" style={styles.infoLabel}>Est. Cost</span>
          <span className="xr-info-value" style={{ ...styles.infoValue, color: '#10B981' }}>
            ${((profile.estimatedCostUSD?.mid || 0) / 1_000_000).toFixed(1)}M
          </span>
        </div>
        <div style={{ ...styles.infoItem, flex: 1, textAlign: 'right' }}>
          <span className="xr-info-hint" style={styles.infoHint}>
            {explodeT > 0
              ? `💥 ${Math.round(explodeT * 100)}% exploded — drag slider or click layers to inspect`
              : 'Click 💥 Explode View to separate layers · Click components to inspect & edit'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Inline Styles ── */
const styles = {
  standalonePage: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#0A0E1A',
    zIndex: 100,
  },
  embedded: {
    width: '100%',
    height: '560px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid #1F2937',
    background: '#0A0E1A',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: 'rgba(17,24,39,0.95)',
    borderBottom: '1px solid #1F2937',
    flexShrink: 0,
    gap: 12,
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: { color: '#3B82F6', fontSize: 18 },
  headerTitle: {
    color: '#F9FAFB',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: 15,
  },
  orbitBadge: {
    fontSize: 11,
    color: '#10B981',
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.25)',
    borderRadius: 6,
    padding: '2px 8px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    fontSize: 12,
    padding: '5px 12px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.06)',
    color: '#9CA3AF',
    border: '1px solid transparent',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: '0.2s ease',
  },
  toggleActive: {
    color: '#F9FAFB',
    background: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  explodedActive: {
    color: '#F59E0B',
    background: 'rgba(245,158,11,0.18)',
    borderColor: 'rgba(245,158,11,0.4)',
    fontWeight: 600,
  },
  xrBtn: {
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #10B981, #059669)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    transition: '0.2s ease',
  },
  vrBtn: {
    background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 300,
    background: 'rgba(16,185,129,0.9)',
    color: '#FFFFFF',
    border: '1px solid #059669',
    borderRadius: 8,
    padding: '6px 18px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
  },
  subsystemBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    background: 'rgba(10,14,26,0.95)',
    borderBottom: '1px solid #1F2937',
    overflowX: 'auto',
    flexShrink: 0,
  },
  subsystemPill: {
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    color: '#9CA3AF',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: "'Inter', sans-serif",
    transition: '0.2s ease',
  },
  subsystemPillActive: {
    background: 'rgba(59,130,246,0.2)',
    color: '#60A5FA',
    borderColor: 'rgba(59,130,246,0.5)',
    fontWeight: 600,
  },
  canvas: {
    width: '100%',
    height: '100%',
    cursor: 'grab',
  },
  inspectorSidebar: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 320,
    maxHeight: 'calc(100% - 32px)',
    overflowY: 'auto',
    background: 'rgba(10,14,26,0.92)',
    border: '1px solid rgba(59,130,246,0.4)',
    borderRadius: 14,
    padding: 16,
    color: '#F9FAFB',
    fontFamily: "'Inter', sans-serif",
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  inspectorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  inspectorTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  inspectorIcon: {
    fontSize: 24,
  },
  inspectorTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: '#F9FAFB',
  },
  inspectorSubtype: {
    fontSize: 10,
    color: '#60A5FA',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.05em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#6B7280',
    fontSize: 16,
    cursor: 'pointer',
    padding: 4,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
  },
  metricCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  metricLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontFamily: "'JetBrains Mono', monospace",
  },
  metricVal: {
    fontSize: 12,
    fontWeight: 600,
    color: '#F9FAFB',
  },
  promptBox: {
    background: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 8,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  promptHeader: {
    fontSize: 11,
    fontWeight: 600,
    color: '#60A5FA',
  },
  promptInput: {
    flex: 1,
    background: 'rgba(17,24,39,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '5px 8px',
    color: '#F9FAFB',
    fontSize: 11,
    outline: 'none',
  },
  promptSubmitBtn: {
    background: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  sectionBox: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: 10,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 600,
    color: '#9CA3AF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  sectionBody: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 1.45,
  },
  compRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  compName: {
    fontSize: 12,
    fontWeight: 500,
    color: '#F9FAFB',
  },
  compRole: {
    fontSize: 10,
    color: '#6B7280',
  },
  redundancyTag: {
    fontSize: 9,
    background: 'rgba(59,130,246,0.15)',
    color: '#60A5FA',
    padding: '1px 5px',
    borderRadius: 4,
    fontFamily: "'JetBrains Mono', monospace",
  },
  educationCard: {
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 8,
    padding: 10,
  },
  resetCamBtn: {
    width: '100%',
    padding: '8px',
    background: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.3)',
    borderRadius: 8,
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  infoBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'rgba(17,24,39,0.95)',
    borderTop: '1px solid #1F2937',
    gap: 20,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#4B5563',
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  infoValue: {
    fontSize: 14,
    color: '#F9FAFB',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
  },
  infoHint: {
    fontSize: 11,
    color: '#374151',
    fontStyle: 'italic',
  },
};
