import React, { useState, useCallback } from 'react';

/* ── Layer metadata: maps subsystem type → depth along explode axis ──
 *  depth is a normalized 0-1 value used by the slider to pause the camera
 *  at each "chapter" of the disassembly.
 */
export const EXPLODE_LAYERS = [
  {
    type: 'thermal',
    label: 'Thermal Blanket',
    icon: '🛡️',
    depth: 0.12,
    material: 'Gold Kapton MLI (20-layer)',
    function: 'Passive thermal insulation — maintains -10°C to +50°C across orbital eclipse cycles',
    color: '#F59E0B',
  },
  {
    type: 'solar',
    label: 'Solar Arrays',
    icon: '☀️',
    depth: 0.28,
    material: 'GaAs Triple-Junction PV cells on CFRP substrate',
    function: 'Primary power generation — 120W BOL at 28% efficiency',
    color: '#34D399',
  },
  {
    type: 'antenna',
    label: 'Comms Antenna',
    icon: '📡',
    depth: 0.44,
    material: 'Carbon-fibre dish, gold-plated feed horn',
    function: 'S-Band + UHF RF link — 8 Mbps downlink to ground station',
    color: '#A78BFA',
  },
  {
    type: 'camera',
    label: 'Imaging Payload',
    icon: '📷',
    depth: 0.58,
    material: 'Fused silica optics, InGaAs SWIR detector array',
    function: 'Multispectral Earth observation — 5m GSD VNIR imaging',
    color: '#FBBF24',
  },
  {
    type: 'adcs',
    label: 'Attitude Control',
    icon: '🎯',
    depth: 0.72,
    material: 'Titanium reaction wheels, star tracker optical head',
    function: 'Three-axis stabilization — <0.05° pointing accuracy',
    color: '#60A5FA',
  },
  {
    type: 'thruster',
    label: 'Propulsion',
    icon: '🚀',
    depth: 0.85,
    material: 'Aluminium cold-gas thruster, Inconel propellant tank',
    function: 'Station-keeping and collision avoidance — 15 m/s ΔV budget',
    color: '#F87171',
  },
  {
    type: 'bus',
    label: 'Satellite Bus',
    icon: '🛰️',
    depth: 1.0,
    material: 'Aluminium 7075-T6 honeycomb structure',
    function: 'Primary structural chassis — all subsystems mount to this frame',
    color: '#6B8DD6',
  },
];

/* ── Editable field — inline single-field editor ── */
function EditableField({ label, value, unit = '', onSave, numeric = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));

  const commit = () => {
    const parsed = numeric ? parseFloat(draft) : draft.trim();
    if (!isNaN(parsed) || !numeric) onSave(parsed);
    setEditing(false);
  };

  return (
    <div style={fieldStyles.wrapper}>
      <span style={fieldStyles.label}>{label}</span>
      {editing ? (
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            autoFocus
            style={fieldStyles.input}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          />
          <button style={fieldStyles.saveBtn} onClick={commit}>✓</button>
        </span>
      ) : (
        <span
          style={fieldStyles.value}
          title="Click to edit"
          onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
        >
          {value ?? '—'}{unit && value != null ? ' ' + unit : ''}
          <span style={fieldStyles.editIcon}>✏️</span>
        </span>
      )}
    </div>
  );
}

/* ── Component edit card — for editing a single component within a layer ── */
function ComponentEditCard({ comp, subsystemType, onUpdate, color }) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback((field, val) => {
    onUpdate({ ...comp, [field]: val });
  }, [comp, onUpdate]);

  return (
    <div style={{ ...cardStyles.comp, borderLeft: `3px solid ${color}` }}>
      <div
        style={cardStyles.compHeader}
        onClick={() => setExpanded(p => !p)}
        title="Click to expand and edit"
      >
        <span style={cardStyles.compName}>{comp.name}</span>
        <span style={{ color: '#6B7280', fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={cardStyles.compBody}>
          <EditableField
            label="Name"
            value={comp.name}
            onSave={v => update('name', v)}
          />
          <EditableField
            label="Role / Function"
            value={comp.role}
            onSave={v => update('role', v)}
          />
          <EditableField
            label="Mass"
            value={comp.massKg}
            unit="kg"
            numeric
            onSave={v => update('massKg', v)}
          />
          <EditableField
            label="Power Draw"
            value={comp.powerConsumptionW}
            unit="W"
            numeric
            onSave={v => update('powerConsumptionW', v)}
          />
          <EditableField
            label="Cost (min)"
            value={comp.estimatedCostUSD?.min}
            unit="USD"
            numeric
            onSave={v => update('estimatedCostUSD', { ...comp.estimatedCostUSD, min: v })}
          />
          <EditableField
            label="Cost (max)"
            value={comp.estimatedCostUSD?.max}
            unit="USD"
            numeric
            onSave={v => update('estimatedCostUSD', { ...comp.estimatedCostUSD, max: v })}
          />
          {comp.redundancy && (
            <EditableField
              label="Redundancy"
              value={comp.redundancy}
              onSave={v => update('redundancy', v)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Layer Card — shows one explode layer with metadata + component editor ── */
function LayerCard({ layer, subsystem, explodeT, isActive, onSelectLayer, onUpdateComponent }) {
  const [expanded, setExpanded] = useState(false);

  const isVisible = explodeT >= layer.depth - 0.18;

  return (
    <div
      style={{
        ...cardStyles.layer,
        borderColor: isActive ? layer.color : (isVisible ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'),
        opacity: isVisible ? 1 : 0.4,
        background: isActive ? `${layer.color}12` : 'rgba(255,255,255,0.02)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Layer header row */}
      <div
        style={cardStyles.layerHeader}
        onClick={() => {
          onSelectLayer(layer);
          setExpanded(p => !p);
        }}
      >
        <span style={{ fontSize: 18 }}>{layer.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...cardStyles.layerLabel, color: isActive ? layer.color : '#F9FAFB' }}>
              {layer.label}
            </span>
            <span style={cardStyles.depthBadge}>
              D{Math.round(layer.depth * 100)}
            </span>
          </div>
          <div style={cardStyles.layerMeta}>{layer.material}</div>
        </div>
        <span style={{ color: '#4B5563', fontSize: 10, marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Function description */}
      {isActive && (
        <div style={cardStyles.functionNote}>
          <span style={{ color: '#60A5FA', fontSize: 10, fontWeight: 600 }}>FUNCTION · </span>
          <span style={{ color: '#9CA3AF', fontSize: 10 }}>{layer.function}</span>
        </div>
      )}

      {/* Editable component list */}
      {expanded && subsystem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          <div style={cardStyles.compsHeader}>Components ({subsystem.components?.length ?? 0})</div>
          {(subsystem.components || []).map((comp, idx) => (
            <ComponentEditCard
              key={idx}
              comp={comp}
              subsystemType={layer.type}
              color={layer.color}
              onUpdate={(updated) => onUpdateComponent(subsystem, idx, updated)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main ExplodedViewPanel — the slide-in control surface
   ══════════════════════════════════════════════════════════ */
export default function ExplodedViewPanel({
  explodeT,
  onExplodeT,
  design,
  onUpdateDesign,
  onClose,
  onSelectLayer,
  activeLayerType,
}) {
  const subsystems = design?.subsystems || [];

  /* Find which depth-chapter the scrubber is nearest to */
  const nearestLayer = EXPLODE_LAYERS.reduce((best, l) => {
    return Math.abs(l.depth - explodeT) < Math.abs(best.depth - explodeT) ? l : best;
  }, EXPLODE_LAYERS[0]);

  /* Jump scrubber to a layer's depth position */
  const handleLayerClick = useCallback((layer) => {
    onExplodeT(layer.depth);
    onSelectLayer?.(layer);
  }, [onExplodeT, onSelectLayer]);

  /* Persist component edits back up to XRViewer */
  const handleUpdateComponent = useCallback((subsystem, compIdx, updatedComp) => {
    const newSubsystems = subsystems.map(s => {
      if (s.type !== subsystem.type) return s;
      const newComps = [...(s.components || [])];
      newComps[compIdx] = updatedComp;
      return { ...s, components: newComps };
    });
    onUpdateDesign({ ...design, subsystems: newSubsystems });
  }, [design, subsystems, onUpdateDesign]);

  /* Scrubber position: snap tick markers for each layer */
  const ticks = EXPLODE_LAYERS.map(l => l.depth);

  return (
    <div className="xr-explode-panel" style={panelStyles.root}>

      {/* ── Panel Header ── */}
      <div style={panelStyles.header}>
        <div style={panelStyles.headerLeft}>
          <span style={{ fontSize: 18 }}>💥</span>
          <div>
            <div style={panelStyles.title}>Exploded View</div>
            <div style={panelStyles.subtitle}>
              {explodeT === 0
                ? 'Fully assembled'
                : explodeT === 1
                ? 'Fully separated'
                : `Layer · ${nearestLayer.icon} ${nearestLayer.label}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            style={panelStyles.resetBtn}
            onClick={() => onExplodeT(0)}
            title="Reassemble"
          >
            ↺ Reset
          </button>
          <button style={panelStyles.closeBtn} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* ── Explode Scrubber ── */}
      <div style={panelStyles.scrubberSection}>
        <div style={panelStyles.scrubberRow}>
          <span style={panelStyles.scrubberLabel}>Assembled</span>
          <span style={panelStyles.scrubberValue}>{Math.round(explodeT * 100)}%</span>
          <span style={panelStyles.scrubberLabel}>Separated</span>
        </div>

        <div style={panelStyles.sliderWrapper}>
          <input
            id="explode-scrubber"
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={explodeT}
            onChange={e => {
              const v = parseFloat(e.target.value);
              onExplodeT(v);
              e.target.style.setProperty('--pct', `${v * 100}%`);
            }}
            className="xr-explode-slider"
            style={{ ...panelStyles.slider, '--pct': `${explodeT * 100}%` }}
          />
          {/* Tick marks at each layer depth */}
          <div style={panelStyles.tickRow}>
            {ticks.map((t, i) => (
              <div
                key={i}
                style={{
                  ...panelStyles.tick,
                  left: `${t * 100}%`,
                  background: explodeT >= t ? EXPLODE_LAYERS[i].color : 'rgba(255,255,255,0.15)',
                }}
                title={EXPLODE_LAYERS[i].label}
                onClick={() => onExplodeT(t)}
              />
            ))}
          </div>
        </div>

        {/* Quick-jump layer buttons */}
        <div style={panelStyles.quickJumps}>
          <button style={panelStyles.jumpBtn} onClick={() => onExplodeT(0)}>0%</button>
          {EXPLODE_LAYERS.map(l => (
            <button
              key={l.type}
              style={{
                ...panelStyles.jumpBtn,
                background: nearestLayer.type === l.type && explodeT > 0
                  ? `${l.color}25`
                  : 'rgba(255,255,255,0.04)',
                borderColor: nearestLayer.type === l.type && explodeT > 0
                  ? `${l.color}60`
                  : 'rgba(255,255,255,0.08)',
                color: nearestLayer.type === l.type && explodeT > 0 ? l.color : '#6B7280',
              }}
              onClick={() => handleLayerClick(l)}
              title={l.label}
            >
              {l.icon}
            </button>
          ))}
          <button style={panelStyles.jumpBtn} onClick={() => onExplodeT(1)}>100%</button>
        </div>
      </div>

      {/* ── Layer Stack ── */}
      <div style={panelStyles.layerScroll}>
        <div style={panelStyles.layerStackHeader}>
          Layer Stack — Depth Order
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {EXPLODE_LAYERS.map((layer) => {
            const subsystem = subsystems.find(s => s.type === layer.type);
            return (
              <LayerCard
                key={layer.type}
                layer={layer}
                subsystem={subsystem}
                explodeT={explodeT}
                isActive={activeLayerType === layer.type || nearestLayer.type === layer.type}
                onSelectLayer={handleLayerClick}
                onUpdateComponent={handleUpdateComponent}
              />
            );
          })}
        </div>
      </div>

      {/* ── Hint Footer ── */}
      <div style={panelStyles.footer}>
        <span style={{ opacity: 0.5 }}>💡</span>
        <span>Drag the scrubber or click a layer icon to navigate. Expand a layer to edit components inline.</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════════════ */
const panelStyles = {
  root: {
    position: 'absolute',
    top: 50,   /* clears the XRViewer header bar */
    left: 0,
    width: 340,
    maxHeight: 'calc(100% - 50px)',
    overflowY: 'auto',
    background: 'rgba(8,12,22,0.95)',
    border: '1px solid rgba(245,158,11,0.35)',
    borderRadius: '0 0 14px 0',
    color: '#F9FAFB',
    fontFamily: "'Inter', sans-serif",
    backdropFilter: 'blur(14px)',
    boxShadow: '4px 0 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.12)',
    zIndex: 60,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    gap: 10,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontWeight: 700,
    fontSize: 14,
    color: '#F59E0B',
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: '0.01em',
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: 1,
  },
  resetBtn: {
    fontSize: 11,
    padding: '4px 10px',
    background: 'rgba(59,130,246,0.12)',
    border: '1px solid rgba(59,130,246,0.3)',
    borderRadius: 6,
    color: '#60A5FA',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#6B7280',
    fontSize: 16,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
  },
  scrubberSection: {
    padding: '12px 16px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  scrubberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scrubberLabel: {
    fontSize: 9,
    color: '#4B5563',
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  scrubberValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#F59E0B',
    fontFamily: "'Space Grotesk', sans-serif",
    textShadow: '0 0 12px rgba(245,158,11,0.4)',
  },
  sliderWrapper: {
    position: 'relative',
    paddingBottom: 16,
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#F59E0B',
  },
  tickRow: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    height: 6,
    pointerEvents: 'auto',
  },
  tick: {
    position: 'absolute',
    width: 3,
    height: 8,
    borderRadius: 2,
    transform: 'translateX(-50%)',
    cursor: 'pointer',
    transition: 'background 0.3s',
    bottom: 0,
  },
  quickJumps: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  jumpBtn: {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#6B7280',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  },
  layerScroll: {
    flex: 1,
    padding: '10px 12px',
    overflowY: 'auto',
  },
  layerStackHeader: {
    fontSize: 9,
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 8,
  },
  footer: {
    display: 'flex',
    gap: 6,
    alignItems: 'flex-start',
    padding: '8px 14px 12px',
    fontSize: 10,
    color: '#4B5563',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    fontStyle: 'italic',
    lineHeight: 1.4,
    flexShrink: 0,
  },
};

const cardStyles = {
  layer: {
    border: '1px solid',
    borderRadius: 10,
    padding: '8px 10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  layerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  layerLabel: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  depthBadge: {
    fontSize: 9,
    color: '#4B5563',
    fontFamily: "'JetBrains Mono', monospace",
    background: 'rgba(255,255,255,0.06)',
    padding: '1px 5px',
    borderRadius: 4,
  },
  layerMeta: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: "'Inter', sans-serif",
  },
  functionNote: {
    marginTop: 6,
    padding: '5px 8px',
    background: 'rgba(59,130,246,0.06)',
    borderRadius: 6,
    lineHeight: 1.4,
  },
  compsHeader: {
    fontSize: 9,
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontFamily: "'JetBrains Mono', monospace",
    paddingBottom: 2,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 2,
  },
  comp: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: '6px 8px',
    border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
  },
  compHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#D1D5DB',
  },
  compBody: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
};

const fieldStyles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    gap: 8,
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: 'nowrap',
    minWidth: 70,
  },
  value: {
    fontSize: 11,
    color: '#F9FAFB',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    textAlign: 'right',
    transition: 'color 0.2s',
  },
  editIcon: {
    fontSize: 9,
    opacity: 0.4,
  },
  input: {
    width: 100,
    background: 'rgba(17,24,39,0.9)',
    border: '1px solid rgba(59,130,246,0.5)',
    borderRadius: 4,
    padding: '2px 6px',
    color: '#F9FAFB',
    fontSize: 11,
    outline: 'none',
    fontFamily: "'JetBrains Mono', monospace",
  },
  saveBtn: {
    background: '#16A34A',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    fontSize: 11,
    padding: '2px 6px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};
