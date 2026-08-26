export function applyTrade(design, type) {
  // Returns a new design object with adjusted values based on the trade type.
  const newDesign = { ...design };
  switch (type) {
    case 'cost':
      // Reduce total cost by 20% and bus cost proportionally.
      newDesign.totalCostUSD = Math.round(design.totalCostUSD * 0.8);
      if (newDesign.bus && newDesign.bus.costUSD) {
        newDesign.bus.costUSD = Math.round(design.bus.costUSD * 0.8);
      }
      break;
    case 'mass':
      // Reduce total mass (bus + payload) by 15%.
      if (newDesign.bus && newDesign.bus.massKg) {
        newDesign.bus.massKg = Math.round(design.bus.massKg * 0.85);
      }
      if (newDesign.payload && newDesign.payload.massKg) {
        newDesign.payload.massKg = Math.round(design.payload.massKg * 0.85);
      }
      break;
    case 'power':
      // Reduce power consumption by 10%.
      if (newDesign.bus && newDesign.bus.powerW) {
        newDesign.bus.powerW = Math.round(design.bus.powerW * 0.9);
      }
      if (newDesign.payload && newDesign.payload.powerW) {
        newDesign.payload.powerW = Math.round(design.payload.powerW * 0.9);
      }
      break;
    default:
      // unknown trade, return unchanged.
      break;
  }
  return newDesign;
}
