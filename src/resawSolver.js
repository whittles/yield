/**
 * Resaw Planner Solver
 * Calculates production yield from rough lumber → finished kumiko strips
 */

export function solveResaw(input) {
  const {
    stock,           // { thickness, width, length, qty, condition }
    resawSettings,   // { kerf, slabAllowance, panelTarget }
    stripSettings,   // [{ name, sku, roughWidth, planeAllowance, finalWidth, depth, tableKerf }]
  } = input;

  // Step 1: Usable thickness after conditioning
  const conditionLoss = {
    'rough':       0.25,
    'skip-planed': 0.125,
    's3s':         0.0625,
    's4s':         0,
  };
  const usableThickness = stock.thickness - (conditionLoss[stock.condition] || 0);
  const usableWidth = stock.width; // width not affected by skip planing in this workflow

  // Step 2: Calculate slabs per board
  // Each slab needs: panelTarget + slabAllowance (for drum sanding)
  // Plus kerf between each slab
  // Formula: n slabs, (n-1) kerfs
  // n × slabThickness + (n-1) × kerf ≤ usableThickness
  // n × (slabThickness + kerf) - kerf ≤ usableThickness
  // n ≤ (usableThickness + kerf) / (slabThickness + kerf)

  const slabThickness = resawSettings.panelTarget + resawSettings.slabAllowance;
  const slabsPerBoard = Math.floor(
    (usableThickness + resawSettings.kerf) / (slabThickness + resawSettings.kerf)
  );

  // Actual thickness used
  const thicknessUsed = slabsPerBoard * slabThickness + (slabsPerBoard - 1) * resawSettings.kerf;
  const thicknessWaste = usableThickness - thicknessUsed;
  const thicknessWastePct = Math.round((thicknessWaste / usableThickness) * 100);

  // Step 3: Strips per panel per SKU
  const stripResults = stripSettings.map(strip => {
    // How many rough-width strips fit in the panel width?
    // n strips, (n-1) kerfs
    // n × roughWidth + (n-1) × tableKerf ≤ usableWidth
    const stripsPerPanel = Math.floor(
      (usableWidth + strip.tableKerf) / (strip.roughWidth + strip.tableKerf)
    );
    const widthUsed = stripsPerPanel * strip.roughWidth + (stripsPerPanel - 1) * strip.tableKerf;
    const widthWaste = usableWidth - widthUsed;

    return {
      ...strip,
      stripsPerPanel,
      widthUsed,
      widthWaste,
      widthWastePct: Math.round((widthWaste / usableWidth) * 100),
      stripsPerBoard: stripsPerPanel * slabsPerBoard,
      totalStrips: stripsPerPanel * slabsPerBoard * stock.qty,
    };
  });

  // Step 4: Resaw sequence (for display)
  const resawSequence = [];
  for (let i = 0; i < slabsPerBoard; i++) {
    const cutPosition = (i + 1) * slabThickness + i * resawSettings.kerf;
    resawSequence.push({
      cutNumber: i + 1,
      cutPosition: cutPosition,
      slabNumber: i + 1,
      slabThickness: slabThickness,
      panelTarget: resawSettings.panelTarget,
    });
  }

  return {
    input: { stock, resawSettings, stripSettings },
    stock: {
      usableThickness,
      usableWidth,
      qty: stock.qty,
    },
    slabs: {
      slabThickness,
      slabsPerBoard,
      thicknessUsed,
      thicknessWaste,
      thicknessWastePct,
    },
    stripResults,
    resawSequence,
    summary: {
      slabsTotal: slabsPerBoard * stock.qty,
      thicknessYield: 100 - thicknessWastePct,
    },
  };
}
