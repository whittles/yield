/**
 * Resaw Planner Solver
 * Calculates production yield from rough lumber → finished kumiko strips
 */

export function solveResaw(input) {
  const {
    stock,            // { thickness, width, length, qty, condition }
    resawSettings,    // { kerf, slabAllowance, panelTarget }
    stripSettings,    // [{ name, sku, roughWidth, planeAllowance, finalWidth, depth, tableKerf, length }]
    crosscutSettings, // { roughBlankLength, miterKerf }
  } = input;

  // Step 0: Rough crosscut (boards → blanks)
  // n blanks per board, (n-1) kerfs
  // n × blankLen + (n-1) × kerf ≤ boardLength
  // n ≤ (boardLength + kerf) / (blankLen + kerf)
  const blanksPerBoard = Math.floor(
    (stock.length + crosscutSettings.miterKerf) /
    (crosscutSettings.roughBlankLength + crosscutSettings.miterKerf)
  );
  const roughCrosscut = {
    blanksPerBoard,
    blanksTotal: blanksPerBoard * stock.qty,
    roughBlankLength: crosscutSettings.roughBlankLength,
    lengthUsed: blanksPerBoard * crosscutSettings.roughBlankLength + (blanksPerBoard - 1) * crosscutSettings.miterKerf,
    lengthWaste: stock.length - (blanksPerBoard * crosscutSettings.roughBlankLength + (blanksPerBoard - 1) * crosscutSettings.miterKerf),
  };

  // Step 1: Usable thickness after conditioning
  const conditionLoss = {
    'rough':       0.25,
    'skip-planed': 0.125,
    's3s':         0.0625,
    's4s':         0,
  };
  const usableThickness = stock.thickness - (conditionLoss[stock.condition] || 0);
  const usableWidth = stock.width; // width not affected by skip planing in this workflow

  // Step 2: Calculate slabs per blank (same thickness calc as before)
  // Each slab needs: panelTarget + slabAllowance (for drum sanding)
  // Plus kerf between each slab
  // Formula: n slabs, (n-1) kerfs
  // n × slabThickness + (n-1) × kerf ≤ usableThickness
  // n ≤ (usableThickness + kerf) / (slabThickness + kerf)

  const slabThickness = resawSettings.panelTarget + resawSettings.slabAllowance;
  const slabsPerBlank = Math.floor(
    (usableThickness + resawSettings.kerf) / (slabThickness + resawSettings.kerf)
  );
  // Keep slabsPerBoard as alias for backward compat (same value — thickness doesn't change between blanks)
  const slabsPerBoard = slabsPerBlank;

  // Actual thickness used
  const thicknessUsed = slabsPerBlank * slabThickness + (slabsPerBlank - 1) * resawSettings.kerf;
  const thicknessWaste = usableThickness - thicknessUsed;
  const thicknessWastePct = Math.round((thicknessWaste / usableThickness) * 100);

  // Step 3: Strips per panel per SKU + Step 3.5: Finish crosscut per SKU
  const stripResults = stripSettings.map(strip => {
    // Step 3.5 — Finish crosscut: how many finished-length panels from one blank?
    const finishedPiecesPerBlank = Math.floor(
      (crosscutSettings.roughBlankLength + crosscutSettings.miterKerf) /
      (strip.length + crosscutSettings.miterKerf)
    );
    const finishCrosscutWaste = crosscutSettings.roughBlankLength -
      (finishedPiecesPerBlank * strip.length + (finishedPiecesPerBlank - 1) * crosscutSettings.miterKerf);

    // How many rough-width strips fit in the panel width?
    // n strips, (n-1) kerfs
    // n × roughWidth + (n-1) × tableKerf ≤ usableWidth
    const stripsPerPanel = Math.floor(
      (usableWidth + strip.tableKerf) / (strip.roughWidth + strip.tableKerf)
    );
    const widthUsed = stripsPerPanel * strip.roughWidth + (stripsPerPanel - 1) * strip.tableKerf;
    const widthWaste = usableWidth - widthUsed;

    // Total strips = blanksPerBoard × slabsPerBlank × finishedPiecesPerBlank × stripsPerPanel × boardQty
    return {
      ...strip,
      stripsPerPanel,
      widthUsed,
      widthWaste,
      widthWastePct: Math.round((widthWaste / usableWidth) * 100),
      finishedPiecesPerBlank,
      finishCrosscutWaste,
      finishCrosscutWastePct: Math.round((finishCrosscutWaste / crosscutSettings.roughBlankLength) * 100),
      stripsPerBoard: stripsPerPanel * finishedPiecesPerBlank * slabsPerBlank * blanksPerBoard,
      totalStrips: stripsPerPanel * finishedPiecesPerBlank * slabsPerBlank * blanksPerBoard * stock.qty,
    };
  });

  // Step 4: Resaw sequence (for display — per blank)
  const resawSequence = [];
  for (let i = 0; i < slabsPerBlank; i++) {
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
    input: { stock, resawSettings, stripSettings, crosscutSettings },
    stock: {
      usableThickness,
      usableWidth,
      qty: stock.qty,
    },
    roughCrosscut,
    slabs: {
      slabThickness,
      slabsPerBoard,
      slabsPerBlank,
      thicknessUsed,
      thicknessWaste,
      thicknessWastePct,
    },
    stripResults,
    resawSequence,
    summary: {
      slabsTotal: slabsPerBlank * blanksPerBoard * stock.qty,
      thicknessYield: 100 - thicknessWastePct,
    },
  };
}
