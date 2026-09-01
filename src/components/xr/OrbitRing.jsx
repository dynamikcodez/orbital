import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Glowing orbital ring around the satellite.
 * Shows the orbit type + altitude as context.
 */
export default function OrbitRing({ orbitType = 'LEO', altitudeKm = 550, radius = 4 }) {
  const orbitColors = {
    SSO: '#10B981',
    LEO: '#3B82F6',
    MEO: '#F59E0B',
    GEO: '#8B5CF6',
  };
  const color = orbitColors[orbitType] || '#3B82F6';

  const curve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  return (
    <group rotation={[Math.PI / 6, 0, 0]}>
      {/* Main ring */}
      <line geometry={curve}>
        <lineBasicMaterial color={color} transparent opacity={0.4} linewidth={1} />
      </line>
      {/* Glow ring */}
      <line geometry={curve}>
        <lineBasicMaterial color={color} transparent opacity={0.15} linewidth={3} />
      </line>
    </group>
  );
}
