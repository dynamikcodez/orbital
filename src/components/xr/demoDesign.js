/**
 * Demo satellite design data — used when no AI-generated design exists.
 * Matches the schema Claude produces so the XR viewer works standalone.
 */
export const DEMO_DESIGN = {
  missionProfile: {
    name: 'AzamSat-1',
    description: 'Low-Earth orbit Earth observation satellite for agricultural monitoring across West Africa.',
    orbitType: 'SSO',
    altitudeKm: 550,
    targetLifespanYears: 5,
    totalMassKg: 45,
    totalPowerW: 80,
    estimatedCostUSD: { min: 1_200_000, mid: 2_400_000, max: 4_000_000 },
  },
  subsystems: [
    {
      id: 'bus',
      name: 'Satellite Bus',
      type: 'bus',
      rationale: 'Aluminum honeycomb 6U CubeSat bus provides optimal strength-to-weight ratio for LEO missions under 50 kg.',
      educationNote: 'The bus is the structural backbone — all other subsystems mount to it. Size is measured in "Units" (1U = 10×10×10 cm).',
      components: [
        { name: 'Structural Frame (6U)', role: 'Primary load-bearing structure', massKg: 8, powerConsumptionW: 0, estimatedCostUSD: { min: 40_000, max: 65_000 }, redundancy: 'N/A' },
        { name: 'Onboard Computer (OBC)', role: 'Flight software, telemetry, command handling', massKg: 0.4, powerConsumptionW: 5, estimatedCostUSD: { min: 25_000, max: 40_000 }, redundancy: 'Cold spare' },
      ],
    },
    {
      id: 'power',
      name: 'Power System',
      type: 'solar',
      rationale: 'Deployable GaAs triple-junction arrays sized for 120W BOL with 33% margin over peak 80W draw.',
      educationNote: 'Solar panels convert sunlight to electricity. In eclipse (Earth shadow), the battery sustains operations for ~35 minutes per orbit.',
      components: [
        { name: 'Deployable Solar Arrays (2×)', role: 'Primary power generation', massKg: 3.2, powerConsumptionW: 0, estimatedCostUSD: { min: 60_000, max: 95_000 }, redundancy: 'Dual wing' },
        { name: 'Li-Ion Battery Pack (40Wh)', role: 'Eclipse power storage', massKg: 2.5, powerConsumptionW: 0, estimatedCostUSD: { min: 30_000, max: 50_000 }, redundancy: 'Series-parallel' },
        { name: 'Power Distribution Unit', role: 'Voltage regulation & switching', massKg: 0.3, powerConsumptionW: 1, estimatedCostUSD: { min: 15_000, max: 25_000 } },
      ],
    },
    {
      id: 'payload',
      name: 'Imaging Payload',
      type: 'camera',
      rationale: 'Multispectral imager with 5 spectral bands (VNIR) enables NDVI crop health analysis across West Africa.',
      educationNote: 'The payload is the mission instrument. This imager captures light in visible and near-infrared bands to detect vegetation stress invisible to the human eye.',
      components: [
        { name: 'Multispectral Imager (5m GSD)', role: 'Primary Earth observation sensor', massKg: 6, powerConsumptionW: 25, estimatedCostUSD: { min: 350_000, max: 500_000 } },
        { name: 'Image Processing Unit', role: 'Onboard compression & storage', massKg: 0.3, powerConsumptionW: 4, estimatedCostUSD: { min: 20_000, max: 35_000 } },
      ],
    },
    {
      id: 'comms',
      name: 'Communications',
      type: 'antenna',
      rationale: 'S-Band primary link for 8 Mbps downlink; UHF backup ensures telemetry even with primary failure.',
      educationNote: 'The comms system is the satellite\'s voice. S-Band (2-4 GHz) handles high-speed data; UHF provides a low-rate backup link.',
      components: [
        { name: 'S-Band Transceiver', role: 'Primary data downlink (8 Mbps)', massKg: 1.2, powerConsumptionW: 12, estimatedCostUSD: { min: 45_000, max: 70_000 }, redundancy: 'Hot standby' },
        { name: 'UHF Backup Link', role: 'Emergency telemetry & command', massKg: 0.5, powerConsumptionW: 3, estimatedCostUSD: { min: 15_000, max: 25_000 } },
        { name: 'Patch Antenna Array', role: 'Directional RF radiator', massKg: 0.2, powerConsumptionW: 0, estimatedCostUSD: { min: 8_000, max: 12_000 } },
      ],
    },
    {
      id: 'adcs',
      name: 'Attitude Control',
      type: 'adcs',
      rationale: '3-axis reaction wheel stabilization with star tracker for <0.05° pointing accuracy required by 5m GSD imager.',
      educationNote: 'ADCS keeps the satellite pointed correctly. Reaction wheels spin to create torque, while the star tracker determines orientation by matching star patterns.',
      components: [
        { name: 'Reaction Wheels (3-axis)', role: 'Fine attitude control actuator', massKg: 2.0, powerConsumptionW: 8, estimatedCostUSD: { min: 80_000, max: 120_000 }, redundancy: '3+1 skewed' },
        { name: 'Star Tracker', role: 'Precision attitude sensor', massKg: 0.8, powerConsumptionW: 4, estimatedCostUSD: { min: 55_000, max: 85_000 }, redundancy: 'Dual head' },
        { name: 'Magnetorquers (3-axis)', role: 'Momentum desaturation', massKg: 0.6, powerConsumptionW: 2, estimatedCostUSD: { min: 20_000, max: 35_000 } },
      ],
    },
    {
      id: 'propulsion',
      name: 'Propulsion',
      type: 'thruster',
      rationale: 'Cold gas thrusters provide 15 m/s ΔV for orbit maintenance and collision avoidance over 5-year mission.',
      educationNote: 'Cold gas thrusters use pressurized nitrogen — simple, reliable, and safe. They trade efficiency for low risk, ideal for small satellites.',
      components: [
        { name: 'Cold Gas Thruster (N₂)', role: 'Orbit raising & station-keeping', massKg: 2.2, powerConsumptionW: 1, estimatedCostUSD: { min: 90_000, max: 140_000 } },
        { name: 'Propellant Tank (0.8L)', role: 'Compressed gas storage', massKg: 0.8, powerConsumptionW: 0, estimatedCostUSD: { min: 12_000, max: 20_000 } },
      ],
    },
    {
      id: 'thermal',
      name: 'Thermal Control',
      type: 'thermal',
      rationale: 'Passive MLI blankets with thermostat-controlled heaters maintain -10°C to +50°C operating range.',
      educationNote: 'In orbit, one side faces the Sun (+150°C) while the other faces deep space (-170°C). Thermal control keeps electronics in their safe temperature window.',
      components: [
        { name: 'MLI Blankets (20-layer)', role: 'Passive thermal insulation', massKg: 0.8, powerConsumptionW: 0, estimatedCostUSD: { min: 10_000, max: 18_000 } },
        { name: 'Kapton Film Heaters (4×)', role: 'Active heating during eclipse', massKg: 0.4, powerConsumptionW: 6, estimatedCostUSD: { min: 8_000, max: 15_000 } },
        { name: 'Thermistors (8-ch)', role: 'Temperature monitoring sensors', massKg: 0.3, powerConsumptionW: 0.5, estimatedCostUSD: { min: 2_000, max: 5_000 } },
      ],
    },
  ],
  simulations: {
    powerBudget: {
      solarGenerationW: 120,
      peakConsumptionW: 80,
      averageConsumptionW: 55,
      eclipseDrawW: 35,
      marginPercent: 33,
    },
    linkBudget: {
      dataRateMbps: 8,
      contactMinutesPerOrbit: 12,
      dailyDownlinkGB: 4.2,
    },
  },
  tradeOffVariants: [
    {
      title: 'Cost-Optimized',
      objective: 'Minimize cost',
      description: 'Replace multispectral with RGB-only imager, reduce ground resolution to 10m.',
      changes: ['Swap payload to COTS RGB camera', 'Remove star tracker, use sun sensors'],
      impactMassKg: -8,
      impactCostUSD: -280_000,
    },
    {
      title: 'Performance-Optimized',
      objective: 'Maximize imaging capability',
      description: 'Upgrade to hyperspectral imager with onboard ML classification.',
      changes: ['Add GPU co-processor', 'Increase solar array area by 40%'],
      impactMassKg: +12,
      impactCostUSD: +450_000,
    },
  ],
};
