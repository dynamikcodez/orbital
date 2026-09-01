/**
 * Satellite 3D Primitive Component Registry
 * 
 * Defines 3D geometric recipes, materials, dimensions, and attachment rules
 * for ALL satellite archetypes:
 *  1. CubeSat (1U / 3U / 6U / 12U)
 *  2. Earth Observation (Optical Imager / Hyperspectral)
 *  3. GEO Communications (Heavy Comms Sat)
 *  4. SAR Radar (Synthetic Aperture Radar Planar Array)
 *  5. IoT / Store-and-Forward Relay
 *  6. Deep Space / Exploration Probe
 */

export const SATELLITE_PRIMITIVES = {
  // ── Archetype 1: CubeSat (Standard N-Unit Nanosatellite) ──
  cubeSat: {
    name: 'CubeSat Standard',
    description: 'Standardized modular CubeSat frame (1U-12U) with tape spring antennas and deployable solar panels.',
    bus: {
      geometryType: 'box',
      baseDimensions: [0.6, 1.2, 0.6], // 6U proportional
      material: { color: '#2B3A67', metalness: 0.85, roughness: 0.15, clearcoat: 0.5 },
      edgeHighlightColor: '#4F75E8',
    },
    subsystems: {
      solar: {
        geometryType: 'solarWing',
        panelsPerWing: 1,
        panelDimensions: [1.2, 0.03, 0.6],
        cellTexture: 'solarCellBlue',
        attachment: 'lateral',
        material: { color: '#0A1E4A', metalness: 0.4, roughness: 0.4 },
      },
      antenna: {
        geometryType: 'turnstileWhip',
        whipCount: 4,
        whipLength: 0.8,
        attachment: 'top',
        material: { color: '#E5E7EB', metalness: 0.9, roughness: 0.1 },
      },
      camera: {
        geometryType: 'miniLens',
        radius: 0.12,
        height: 0.25,
        attachment: 'bottom',
        material: { color: '#111827', clearcoat: 1.0, ior: 2.2 },
      },
      thruster: {
        geometryType: 'coldGasNozzle',
        nozzles: 4,
        radius: 0.04,
        height: 0.15,
        attachment: 'rear',
        material: { color: '#9CA3AF', metalness: 0.9, roughness: 0.2 },
      },
      adcs: {
        geometryType: 'boxModule',
        dimensions: [0.2, 0.2, 0.2],
        attachment: 'side',
        material: { color: '#3B82F6', metalness: 0.7, roughness: 0.2 },
      },
    },
  },

  // ── Archetype 2: Earth Observation (High Resolution Imager) ──
  earthObservation: {
    name: 'Earth Observation Satellite',
    description: 'Medium-class optical satellite with telescope baffle tube, sun shade, and multispectral sensor payload.',
    bus: {
      geometryType: 'box',
      baseDimensions: [1.2, 1.5, 1.2],
      material: { color: '#1E293B', metalness: 0.8, roughness: 0.2, clearcoat: 0.4 },
      edgeHighlightColor: '#38BDF8',
    },
    subsystems: {
      camera: {
        geometryType: 'telescopeBaffle',
        mainCylinder: { radiusTop: 0.4, radiusBottom: 0.5, height: 1.1 },
        sunShade: { radius: 0.45, height: 0.2 },
        lensGlass: { radius: 0.38, ior: 2.5, reflectivity: 1.0 },
        attachment: 'bottom',
        material: { color: '#0F172A', metalness: 0.5, roughness: 0.2 },
      },
      solar: {
        geometryType: 'solarWing',
        panelsPerWing: 2,
        panelDimensions: [2.8, 0.04, 1.4],
        cellTexture: 'solarCellBlue',
        attachment: 'lateral',
        material: { color: '#0D1B4A', metalness: 0.3, roughness: 0.5 },
      },
      antenna: {
        geometryType: 'parabolicDish',
        radius: 0.45,
        depth: 0.2,
        feedHorn: true,
        attachment: 'top',
        material: { color: '#9F7AEA', metalness: 0.85, roughness: 0.1 },
      },
      adcs: {
        geometryType: 'starTrackerPod',
        trackerCount: 2,
        radius: 0.1,
        height: 0.3,
        attachment: 'side',
        material: { color: '#64748B', metalness: 0.8, roughness: 0.2 },
      },
      thruster: {
        geometryType: 'hydrazineCone',
        radiusTop: 0.06,
        radiusBottom: 0.22,
        height: 0.4,
        attachment: 'rear',
        material: { color: '#B91C1C', metalness: 0.85, roughness: 0.15 },
      },
    },
  },

  // ── Archetype 3: GEO Communications Satellite (Heavy Comms) ──
  communicationsGEO: {
    name: 'GEO Communications Satellite',
    description: 'Heavy geostationary telecommunication platform featuring multi-panel solar wings and dual steerable reflector dishes.',
    bus: {
      geometryType: 'box',
      baseDimensions: [2.0, 2.8, 2.0],
      material: { color: '#1E1B4B', metalness: 0.85, roughness: 0.15, clearcoat: 0.6 },
      edgeHighlightColor: '#818CF8',
    },
    subsystems: {
      solar: {
        geometryType: 'solarWing',
        panelsPerWing: 4, // 4 articulated solar panels per wing
        panelDimensions: [3.5, 0.05, 1.8],
        cellTexture: 'solarCellHighEff',
        attachment: 'lateral',
        material: { color: '#0284C7', metalness: 0.4, roughness: 0.3 },
      },
      antenna: {
        geometryType: 'dualReflectorDishes',
        dishRadius: 0.85,
        dishCount: 2,
        attachment: 'dualSide',
        material: { color: '#C084FC', metalness: 0.9, roughness: 0.1, clearcoat: 0.8 },
      },
      thruster: {
        geometryType: 'liquidApogeeEngine',
        nozzleRadius: 0.35,
        nozzleHeight: 0.65,
        attachment: 'rear',
        material: { color: '#EF4444', metalness: 0.9, roughness: 0.1, emissive: '#FF2200' },
      },
      thermal: {
        geometryType: 'goldMLIWrap',
        thickness: 0.08,
        attachment: 'wrapBus',
        material: { color: '#F59E0B', metalness: 0.95, roughness: 0.05, clearcoat: 1.0 },
      },
    },
  },

  // ── Archetype 4: Synthetic Aperture Radar (SAR) Satellite ──
  sarRadar: {
    name: 'SAR Radar Imaging Satellite',
    description: 'All-weather radar satellite featuring a large planar active electronically scanned array (AESA) antenna panel.',
    bus: {
      geometryType: 'box',
      baseDimensions: [1.4, 1.8, 1.0],
      material: { color: '#0F172A', metalness: 0.8, roughness: 0.2 },
      edgeHighlightColor: '#34D399',
    },
    subsystems: {
      camera: { // SAR radar panel acts as payload
        geometryType: 'planarSarArray',
        dimensions: [4.5, 0.08, 1.2],
        gridTiling: [8, 2],
        attachment: 'bottom',
        material: { color: '#10B981', metalness: 0.7, roughness: 0.2, emissive: '#059669', emissiveIntensity: 0.1 },
      },
      solar: {
        geometryType: 'solarWing',
        panelsPerWing: 3,
        panelDimensions: [3.0, 0.04, 1.5],
        cellTexture: 'solarCellBlue',
        attachment: 'topLateral',
        material: { color: '#0369A1', metalness: 0.4, roughness: 0.4 },
      },
      antenna: {
        geometryType: 'xBandDataDownlink',
        radius: 0.35,
        attachment: 'top',
        material: { color: '#A855F7', metalness: 0.85, roughness: 0.15 },
      },
      thruster: {
        geometryType: 'electricPropulsionHall',
        thrusterCount: 2,
        radius: 0.15,
        height: 0.3,
        attachment: 'rear',
        material: { color: '#06B6D4', metalness: 0.8, roughness: 0.2, emissive: '#0891B2', emissiveIntensity: 0.3 },
      },
    },
  },

  // ── Archetype 5: IoT / Store-and-Forward Relay ──
  iotRelay: {
    name: 'IoT Constellation Relay',
    description: 'Compact telemetry relay satellite with turnstile UHF/VHF dipoles and patch antenna arrays for ground sensor connectivity.',
    bus: {
      geometryType: 'box',
      baseDimensions: [0.8, 1.0, 0.8],
      material: { color: '#1E293B', metalness: 0.8, roughness: 0.2 },
      edgeHighlightColor: '#F43F5E',
    },
    subsystems: {
      antenna: {
        geometryType: 'helicalTurnstileCombo',
        turnstileWhips: 4,
        helicalHelixRadius: 0.15,
        helixHeight: 0.7,
        attachment: 'bottom',
        material: { color: '#EC4899', metalness: 0.9, roughness: 0.1 },
      },
      solar: {
        geometryType: 'bodyMountedAndWings',
        wingDimensions: [1.8, 0.03, 0.8],
        attachment: 'lateral',
        material: { color: '#0284C7', metalness: 0.4, roughness: 0.4 },
      },
      adcs: {
        geometryType: 'magnetorquerRods',
        rodCount: 3,
        length: 0.4,
        attachment: 'internal',
        material: { color: '#64748B', metalness: 0.9, roughness: 0.1 },
      },
    },
  },

  // ── Archetype 6: Deep Space / Planetary Exploration ──
  deepSpace: {
    name: 'Deep Space Explorer',
    description: 'Interplanetary probe equipped with a high-gain deep space dish, radioisotope power generator (RTG), and long boom instruments.',
    bus: {
      geometryType: 'octagonalPrism',
      radius: 1.1,
      height: 1.6,
      material: { color: '#334155', metalness: 0.85, roughness: 0.15, clearcoat: 0.5 },
      edgeHighlightColor: '#F59E0B',
    },
    subsystems: {
      antenna: {
        geometryType: 'highGainDeepSpaceDish',
        radius: 1.2, // Large 2.4m diameter dish
        depth: 0.4,
        feedHorn: true,
        attachment: 'top',
        material: { color: '#F3F4F6', metalness: 0.7, roughness: 0.2, clearcoat: 0.8 },
      },
      solar: { // RTG replaces solar for deep space
        geometryType: 'rtgGenerator',
        radius: 0.3,
        height: 1.1,
        coolingFins: 6,
        attachment: 'sideBoom',
        material: { color: '#374151', metalness: 0.9, roughness: 0.2, emissive: '#EF4444', emissiveIntensity: 0.08 },
      },
      camera: {
        geometryType: 'magnetometerBoom',
        boomLength: 3.5,
        sensorSphereRadius: 0.15,
        attachment: 'oppositeSideBoom',
        material: { color: '#9CA3AF', metalness: 0.9, roughness: 0.1 },
      },
      thruster: {
        geometryType: 'bipropellantMainEngine',
        nozzleRadius: 0.4,
        height: 0.7,
        attachment: 'rear',
        material: { color: '#DC2626', metalness: 0.85, roughness: 0.15 },
      },
    },
  },
};

/**
 * Helper to get primitive configuration for a specific satellite archetype
 */
export function getArchetypePrimitives(orbitType = 'LEO', totalMass = 50, missionName = '') {
  const nameLower = (missionName || '').toLowerCase();

  if (nameLower.includes('sar') || nameLower.includes('radar')) {
    return SATELLITE_PRIMITIVES.sarRadar;
  }
  if (nameLower.includes('deep') || nameLower.includes('explore') || nameLower.includes('probe')) {
    return SATELLITE_PRIMITIVES.deepSpace;
  }
  if (orbitType === 'GEO' || totalMass > 600) {
    return SATELLITE_PRIMITIVES.communicationsGEO;
  }
  if (nameLower.includes('iot') || nameLower.includes('relay') || nameLower.includes('sensor')) {
    return SATELLITE_PRIMITIVES.iotRelay;
  }
  if (totalMass <= 25 || nameLower.includes('cubesat')) {
    return SATELLITE_PRIMITIVES.cubeSat;
  }

  // Default: Earth Observation
  return SATELLITE_PRIMITIVES.earthObservation;
}
