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
      components: [
        { name: 'Structural Frame (6U)', massKg: 8, powerConsumptionW: 0, estimatedCostUSD: { min: 40_000 } },
        { name: 'Onboard Computer', massKg: 0.4, powerConsumptionW: 5, estimatedCostUSD: { min: 25_000 } },
      ],
    },
    {
      id: 'power',
      name: 'Power System',
      type: 'solar',
      components: [
        { name: 'Deployable Solar Arrays (2×)', massKg: 3.2, powerConsumptionW: 0, estimatedCostUSD: { min: 60_000 } },
        { name: 'Li-Ion Battery Pack', massKg: 2.5, powerConsumptionW: 0, estimatedCostUSD: { min: 30_000 } },
      ],
    },
    {
      id: 'payload',
      name: 'Payload',
      type: 'camera',
      components: [
        { name: 'Multispectral Imager (5m GSD)', massKg: 6, powerConsumptionW: 25, estimatedCostUSD: { min: 350_000 } },
      ],
    },
    {
      id: 'comms',
      name: 'Communications',
      type: 'antenna',
      components: [
        { name: 'S-Band Transceiver', massKg: 1.2, powerConsumptionW: 12, estimatedCostUSD: { min: 45_000 } },
        { name: 'UHF Backup Link', massKg: 0.5, powerConsumptionW: 3, estimatedCostUSD: { min: 15_000 } },
      ],
    },
    {
      id: 'adcs',
      name: 'Attitude Control',
      type: 'adcs',
      components: [
        { name: 'Reaction Wheels (3-axis)', massKg: 2.0, powerConsumptionW: 8, estimatedCostUSD: { min: 80_000 } },
        { name: 'Star Tracker', massKg: 0.8, powerConsumptionW: 4, estimatedCostUSD: { min: 55_000 } },
        { name: 'Magnetorquers', massKg: 0.6, powerConsumptionW: 2, estimatedCostUSD: { min: 20_000 } },
      ],
    },
    {
      id: 'propulsion',
      name: 'Propulsion',
      type: 'thruster',
      components: [
        { name: 'Cold Gas Thruster', massKg: 3.0, powerConsumptionW: 1, estimatedCostUSD: { min: 90_000 } },
      ],
    },
    {
      id: 'thermal',
      name: 'Thermal Control',
      type: 'thermal',
      components: [
        { name: 'MLI Blankets + Heaters', massKg: 1.5, powerConsumptionW: 6, estimatedCostUSD: { min: 20_000 } },
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
