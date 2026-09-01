import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SATELLITE_PRIMITIVES, getArchetypePrimitives } from './primitiveComponents';

/* ── colour map for subsystem types ── */
const TYPE_COLORS = {
  bus:      '#4B5EAA',
  solar:    '#10B981',
  camera:   '#F59E0B',
  antenna:  '#8B5CF6',
  adcs:     '#3B82F6',
  thruster: '#EF4444',
  thermal:  '#6B7280',
  default:  '#60A5FA',
};

function colorFor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

/* ── Tooltip shown on hover / click ── */
function SubsystemTooltip({ sub, position }) {
  const totalMass = sub.components?.reduce((s, c) => s + (c.massKg || 0), 0) || 0;
  const totalPower = sub.components?.reduce((s, c) => s + (c.powerConsumptionW || 0), 0) || 0;
  const totalCost = sub.components?.reduce((s, c) => s + (c.estimatedCostUSD?.min || 0), 0) || 0;
  return (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(10,14,26,0.92)',
        border: '1px solid rgba(59,130,246,0.4)',
        borderRadius: 10,
        padding: '10px 14px',
        color: '#F9FAFB',
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        minWidth: 160,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: colorFor(sub.type) }}>
          {sub.name}
        </div>
        <div style={{ color: '#9CA3AF' }}>
          Mass: <span style={{ color: '#F9FAFB' }}>{totalMass.toFixed(1)} kg</span>
        </div>
        <div style={{ color: '#9CA3AF' }}>
          Power: <span style={{ color: '#F9FAFB' }}>{totalPower} W</span>
        </div>
        <div style={{ color: '#9CA3AF' }}>
          Cost: <span style={{ color: '#10B981' }}>${(totalCost / 1000).toFixed(0)}K</span>
        </div>
        {sub.components?.map((c, i) => (
          <div key={i} style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>• {c.name}</div>
        ))}
      </div>
    </Html>
  );
}

/* ── Subsystem Mesh Wrapper with Focus & Explode lerping ── */
function SubsystemMesh({
  sub,
  targetPosition,
  geometry,
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  materialProps = {},
  selectedSubsystem,
  onSelectSubsystem,
}) {
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const isSelected = selectedSubsystem && (selectedSubsystem.id === sub.id || selectedSubsystem.type === sub.type);
  const isAnySelected = Boolean(selectedSubsystem);
  const isDimmed = isAnySelected && !isSelected;
  const showTooltip = hovered || isSelected;

  const color = materialProps.color || colorFor(sub.type);

  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.75,
    roughness: 0.18,
    emissive: color,
    emissiveIntensity: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    reflectivity: 0.8,
    envMapIntensity: 1.2,
    transparent: true,
    opacity: 1,
    ...materialProps,
  }), [color, materialProps]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.lerp(new THREE.Vector3(...targetPosition), delta * 6);
    }
    if (meshRef.current) {
      const targetEmissive = isSelected ? 0.6 : (hovered ? 0.3 : 0);
      const targetOpacity = isDimmed ? 0.25 : 1.0;

      meshRef.current.material.emissiveIntensity +=
        (targetEmissive - meshRef.current.material.emissiveIntensity) * 0.1;
      meshRef.current.material.opacity +=
        (targetOpacity - meshRef.current.material.opacity) * 0.1;

      const s = isSelected ? 1.06 : (hovered ? 1.03 : 1.0);
      meshRef.current.scale.lerp(new THREE.Vector3(s * scale[0], s * scale[1], s * scale[2]), 0.1);
    }
  });

  return (
    <group ref={groupRef} position={targetPosition} rotation={rotation}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={scale}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSubsystem?.(isSelected ? null : sub);
        }}
        castShadow
        receiveShadow
      />
      {showTooltip && <SubsystemTooltip sub={sub} position={[0, 1.2, 0]} />}
    </group>
  );
}

/* ── Specialized Archetype Primitive Components ── */

/* 1. Solar Panel Wings (Supports 1-4 panel segments per wing) */
function SolarPanels({ sub, busWidth, exploded, archetype, selectedSubsystem, onSelectSubsystem }) {
  const primitive = archetype.subsystems?.solar || {};
  const panelsPerWing = primitive.panelsPerWing || 2;
  const panelDims = primitive.panelDimensions || [2.6, 0.04, 1.3];

  const panelGeo = useMemo(() => new THREE.BoxGeometry(...panelDims), [panelDims]);
  const baseOffset = busWidth / 2 + 0.35 + panelDims[0] / 2;
  const explodeFactor = exploded ? 1.6 : 1.0;

  const leftPos = [-baseOffset * explodeFactor, 0, 0];
  const rightPos = [baseOffset * explodeFactor, 0, 0];

  return (
    <group>
      <SubsystemMesh
        sub={sub}
        targetPosition={leftPos}
        geometry={panelGeo}
        materialProps={{ ...primitive.material, color: '#0d1b4a' }}
        selectedSubsystem={selectedSubsystem}
        onSelectSubsystem={onSelectSubsystem}
      />
      <SubsystemMesh
        sub={sub}
        targetPosition={rightPos}
        geometry={panelGeo}
        materialProps={{ ...primitive.material, color: '#0d1b4a' }}
        selectedSubsystem={selectedSubsystem}
        onSelectSubsystem={onSelectSubsystem}
      />
    </group>
  );
}

/* 2. Antenna Assembly (Supports Dishes, Turnstiles, Helical, Dual GEO Reflectors) */
function AntennaAssembly({ sub, busH, busW, exploded, archetype, selectedSubsystem, onSelectSubsystem }) {
  const primitive = archetype.subsystems?.antenna || {};
  const type = primitive.geometryType || 'parabolicDish';
  const explodeFactor = exploded ? 0.8 : 0;

  if (type === 'dualReflectorDishes') {
    // GEO Dual Reflectors (Left & Right deployable dishes)
    const dishGeo = new THREE.SphereGeometry(primitive.dishRadius || 0.8, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftDishPos = [-(busW / 2 + 0.8 + explodeFactor), 0.5, 0];
    const rightDishPos = [(busW / 2 + 0.8 + explodeFactor), 0.5, 0];
    return (
      <group>
        <SubsystemMesh
          sub={sub}
          targetPosition={leftDishPos}
          geometry={dishGeo}
          rotation={[0, 0, -Math.PI / 3]}
          materialProps={{ color: '#C084FC', metalness: 0.9, roughness: 0.1 }}
          selectedSubsystem={selectedSubsystem}
          onSelectSubsystem={onSelectSubsystem}
        />
        <SubsystemMesh
          sub={sub}
          targetPosition={rightDishPos}
          geometry={dishGeo}
          rotation={[0, 0, Math.PI / 3]}
          materialProps={{ color: '#C084FC', metalness: 0.9, roughness: 0.1 }}
          selectedSubsystem={selectedSubsystem}
          onSelectSubsystem={onSelectSubsystem}
        />
      </group>
    );
  }

  if (type === 'turnstileWhip' || type === 'helicalTurnstileCombo') {
    // CubeSat / IoT Turnstile Whip Antennas
    const whipGeo = new THREE.CylinderGeometry(0.015, 0.015, primitive.whipLength || 0.8, 8);
    const baseY = busH / 2 + 0.25 + explodeFactor;
    return (
      <group>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <SubsystemMesh
            key={idx}
            sub={sub}
            targetPosition={[0, baseY, 0]}
            geometry={whipGeo}
            rotation={[Math.PI / 4, angle, 0]}
            materialProps={{ color: '#EC4899', metalness: 0.9, roughness: 0.1 }}
            selectedSubsystem={selectedSubsystem}
            onSelectSubsystem={onSelectSubsystem}
          />
        ))}
      </group>
    );
  }

  // Parabolic Dish (Default)
  const dishRadius = primitive.radius || 0.45;
  const dishGeo = new THREE.SphereGeometry(dishRadius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const targetPos = [0, busH / 2 + 0.55 + explodeFactor, 0];

  return (
    <SubsystemMesh
      sub={sub}
      targetPosition={targetPos}
      geometry={dishGeo}
      materialProps={{ color: '#9F7AEA', metalness: 0.85, roughness: 0.1, clearcoat: 0.5 }}
      selectedSubsystem={selectedSubsystem}
      onSelectSubsystem={onSelectSubsystem}
    />
  );
}

/* 3. Camera / Payload (Supports Optical Telescope, Planar SAR Radar Panel, Magnetometer) */
function PayloadCamera({ sub, busH, busW, exploded, archetype, selectedSubsystem, onSelectSubsystem }) {
  const primitive = archetype.subsystems?.camera || {};
  const type = primitive.geometryType || 'telescopeBaffle';
  const explodeFactor = exploded ? 0.7 : 0;

  if (type === 'planarSarArray') {
    // SAR Synthetic Aperture Radar Array Panel underneath
    const dims = primitive.dimensions || [4.5, 0.08, 1.2];
    const sarGeo = new THREE.BoxGeometry(...dims);
    const targetPos = [0, -(busH / 2 + 0.4 + explodeFactor), 0];
    return (
      <SubsystemMesh
        sub={sub}
        targetPosition={targetPos}
        geometry={sarGeo}
        materialProps={{ color: '#10B981', metalness: 0.7, roughness: 0.2, emissive: '#059669', emissiveIntensity: 0.15 }}
        selectedSubsystem={selectedSubsystem}
        onSelectSubsystem={onSelectSubsystem}
      />
    );
  }

  if (type === 'magnetometerBoom') {
    // Deep Space Instrument Boom
    const boomGeo = new THREE.CylinderGeometry(0.02, 0.02, primitive.boomLength || 3.0, 8);
    const targetPos = [busW / 2 + 1.2 + explodeFactor, 0, 0];
    return (
      <SubsystemMesh
        sub={sub}
        targetPosition={targetPos}
        geometry={boomGeo}
        rotation={[0, 0, Math.PI / 2]}
        materialProps={{ color: '#9CA3AF', metalness: 0.9, roughness: 0.1 }}
        selectedSubsystem={selectedSubsystem}
        onSelectSubsystem={onSelectSubsystem}
      />
    );
  }

  // Optical Telescope / Imager Lens (Default)
  const baffleGeo = new THREE.CylinderGeometry(0.35, 0.42, 0.65, 24);
  const targetPos = [0, -(busH / 2 + 0.35 + explodeFactor), 0];

  return (
    <SubsystemMesh
      sub={sub}
      targetPosition={targetPos}
      geometry={baffleGeo}
      materialProps={{ color: '#B8860B', metalness: 0.6, roughness: 0.25 }}
      selectedSubsystem={selectedSubsystem}
      onSelectSubsystem={onSelectSubsystem}
    />
  );
}

/* 4. Thruster Nozzle (Supports Cold Gas, Hydrazine Cone, Apogee Engine, Hall Thruster) */
function ThrusterNozzle({ sub, busD, exploded, archetype, selectedSubsystem, onSelectSubsystem }) {
  const primitive = archetype.subsystems?.thruster || {};
  const type = primitive.geometryType || 'hydrazineCone';
  const explodeFactor = exploded ? 0.7 : 0;

  let nozzleGeo = new THREE.CylinderGeometry(0.08, 0.22, 0.4, 16);
  if (type === 'liquidApogeeEngine') {
    nozzleGeo = new THREE.CylinderGeometry(0.12, 0.38, 0.65, 20);
  } else if (type === 'electricPropulsionHall') {
    nozzleGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.3, 16);
  } else if (type === 'coldGasNozzle') {
    nozzleGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.18, 12);
  }

  const baseZ = -(busD / 2 + 0.25);
  const targetPos = [0, 0, baseZ - explodeFactor];

  return (
    <SubsystemMesh
      sub={sub}
      targetPosition={targetPos}
      geometry={nozzleGeo}
      materialProps={{ color: '#B33333', metalness: 0.85, roughness: 0.12 }}
      selectedSubsystem={selectedSubsystem}
      onSelectSubsystem={onSelectSubsystem}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   Main Satellite Model — Parametric Archetype-Aware Renderer
   ═══════════════════════════════════════════════════════ */
export default function SatelliteModel({
  design,
  autoRotate = true,
  glbUrl = null,
  exploded = false,
  selectedSubsystem = null,
  onSelectSubsystem = null,
}) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current && !selectedSubsystem) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  if (glbUrl) {
    return <GLTFSatellite url={glbUrl} autoRotate={autoRotate} design={design} />;
  }

  const profile = design?.missionProfile || {};
  const subsystems = design?.subsystems || [];

  // Determine Satellite Primitive Archetype
  const archetype = getArchetypePrimitives(profile.orbitType, profile.totalMassKg, profile.name);
  const busConfig = archetype.bus;

  // Subsystems
  const busSub = subsystems.find(s => s.type === 'bus');
  const solarSub = subsystems.find(s => s.type === 'solar');
  const cameraSub = subsystems.find(s => s.type === 'camera');
  const antennaSub = subsystems.find(s => s.type === 'antenna');
  const adcsSub = subsystems.find(s => s.type === 'adcs');
  const thrusterSub = subsystems.find(s => s.type === 'thruster');
  const thermalSub = subsystems.find(s => s.type === 'thermal');

  // Scale bus dimensions by total mass & archetype parameters
  const [baseW, baseH, baseD] = busConfig.baseDimensions;
  const massScale = Math.max(0.7, Math.min(1.8, (profile.totalMassKg || 50) / 100));
  const busW = baseW * massScale;
  const busH = baseH * massScale;
  const busD = baseD * massScale;

  const busGeo = useMemo(() => new THREE.BoxGeometry(busW, busH, busD, 2, 2, 2), [busW, busH, busD]);
  const adcsGeo = useMemo(() => new THREE.BoxGeometry(0.25, 0.25, 0.25), []);
  const thermalGeo = useMemo(() => new THREE.BoxGeometry(busW + 0.06, busH + 0.06, busD + 0.06), [busW, busH, busD]);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(busGeo), [busGeo]);

  const adcsX = busW / 2 + 0.18;
  const adcsPos = [exploded ? adcsX + 0.6 : adcsX, 0.15, 0];

  return (
    <Float speed={1.5} rotationIntensity={0.12} floatIntensity={0.25}>
      <group ref={groupRef}>
        {/* Bus */}
        {busSub && (
          <SubsystemMesh
            sub={busSub}
            targetPosition={[0, 0, 0]}
            geometry={busGeo}
            materialProps={busConfig.material}
            selectedSubsystem={selectedSubsystem}
            onSelectSubsystem={onSelectSubsystem}
          />
        )}

        {/* Bus edge highlights */}
        <lineSegments geometry={edgesGeo} position={[0, 0, 0]}>
          <lineBasicMaterial color={busConfig.edgeHighlightColor || '#5a7ac4'} transparent opacity={0.3} />
        </lineSegments>

        {/* Thermal MLI wrap */}
        {thermalSub && !exploded && (
          <mesh position={[0, 0, 0]} geometry={thermalGeo}>
            <meshPhysicalMaterial
              color="#d4af37"
              metalness={0.95}
              roughness={0.08}
              transparent
              opacity={0.12}
              clearcoat={1}
              clearcoatRoughness={0}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Solar panels */}
        {solarSub && (
          <SolarPanels
            sub={solarSub}
            busWidth={busW}
            exploded={exploded}
            archetype={archetype}
            selectedSubsystem={selectedSubsystem}
            onSelectSubsystem={onSelectSubsystem}
          />
        )}

        {/* Camera / payload */}
        {cameraSub && (
          <PayloadCamera
            sub={cameraSub}
            busH={busH}
            busW={busW}
            exploded={exploded}
            archetype={archetype}
            selectedSubsystem={selectedSubsystem}
            onSelectSubsystem={onSelectSubsystem}
          />
        )}

        {/* Antenna assembly */}
        {antennaSub && (
          <AntennaAssembly
            sub={antennaSub}
            busH={busH}
            busW={busW}
            exploded={exploded}
            archetype={archetype}
            selectedSubsystem={selectedSubsystem}
            onSelectSubsystem={onSelectSubsystem}
          />
        )}

        {/* ADCS module */}
        {adcsSub && (
          <SubsystemMesh
            sub={adcsSub}
            targetPosition={adcsPos}
            geometry={adcsGeo}
            materialProps={{ color: '#2563eb', metalness: 0.7, roughness: 0.2 }}
            selectedSubsystem={selectedSubsystem}
            onSelectSubsystem={onSelectSubsystem}
          />
        )}

        {/* Thruster nozzle */}
        {thrusterSub && (
          <ThrusterNozzle
            sub={thrusterSub}
            busD={busD}
            exploded={exploded}
            archetype={archetype}
            selectedSubsystem={selectedSubsystem}
            onSelectSubsystem={onSelectSubsystem}
          />
        )}
      </group>
    </Float>
  );
}

function GLTFSatellite({ url, autoRotate, design }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.12} floatIntensity={0.25}>
      <group ref={groupRef}>
        <primitive object={scene} scale={1} />
      </group>
    </Float>
  );
}
