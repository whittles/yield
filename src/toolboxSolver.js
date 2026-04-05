/**
 * Japanese sliding-lid tool box planner
 * Calculates piece dimensions and packs onto plywood sheets.
 */

function formatIn(val) {
  if (!val && val !== 0) return '?'
  if (val < 0.5 && val > 0) return val.toFixed(3)
  // Format as fraction (16ths)
  const whole = Math.floor(val)
  const rem = val - whole
  const num = Math.round(rem * 16)
  if (num === 0) return `${whole}"`
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
  const g = gcd(num, 16)
  const frac = `${num / g}/${16 / g}`
  return whole > 0 ? `${whole} ${frac}"` : `${frac}"`
}

export { formatIn }

/**
 * Calculate all piece dimensions for a Japanese sliding-lid tool box.
 * Supports both inner and outer dimension input.
 */
export function calculatePieces(input) {
  const {
    mode,             // 'inner' | 'outer'
    length,           // longest dimension
    width,            // depth front-to-back
    height,           // height of box body
    matThickness,     // plywood thickness (default 0.5)
    dadoDepth,        // dado groove depth (default 0.25)
    runnerClearance,  // lid runner extra clearance (default 0.0625)
    handleHeight,     // handle strip height (default 0.75)
    overlapFraction,  // lid overlap as fraction of box length (default 1/3)
  } = input

  // Derive inner dimensions
  let iL, iW, iH
  if (mode === 'inner') {
    iL = length
    iW = width
    iH = height
  } else {
    // outer → inner
    iL = length - 2 * matThickness
    iW = width - 2 * matThickness
    iH = height - matThickness
  }

  // Derived outer dimensions
  const oL = iL + 2 * matThickness
  const oW = iW + 2 * matThickness
  const oH = iH + matThickness // height of carcass (no lid)

  // Lid runner groove depth (routed into inside top edge of front/back)
  const runnerDepth = matThickness + runnerClearance

  // Lid panel dimensions
  const lidPanelLength = iL * (0.5 + overlapFraction / 2)
  const lidPanelWidth = iW + 2 * runnerDepth

  // Carcass pieces
  const frontBackLength = oL
  const frontBackHeight = oH

  const endLength = oW
  const endHeight = oH

  const bottomLength = iL
  const bottomWidth = iW

  const handleLength = oW
  const handleHeightActual = handleHeight

  const pieces = [
    {
      id: 'front',
      label: 'Front',
      qty: 1,
      length: frontBackLength,
      width: frontBackHeight,
      grainDir: 'length',
      notes: `Dado ${dadoDepth}" deep × ${matThickness}" wide on inside bottom edge (for bottom panel). Dado ${dadoDepth}" deep on inside faces at each end (for end panels). Lid runner groove ${runnerDepth.toFixed(4)}" deep on inside top edge.`,
    },
    {
      id: 'back',
      label: 'Back',
      qty: 1,
      length: frontBackLength,
      width: frontBackHeight,
      grainDir: 'length',
      notes: 'Same as front.',
    },
    {
      id: 'end',
      label: 'End',
      qty: 2,
      length: endLength,
      width: endHeight,
      grainDir: 'length',
      notes: `Fits in dado grooves in front and back. Dado ${dadoDepth}" deep on inside bottom edge (for bottom panel).`,
    },
    {
      id: 'bottom',
      label: 'Bottom',
      qty: 1,
      length: bottomLength,
      width: bottomWidth,
      grainDir: 'length',
      notes: 'Sits in dado grooves. Grain runs length-wise.',
    },
    {
      id: 'lid',
      label: 'Lid Panel',
      qty: 2,
      length: lidPanelLength,
      width: lidPanelWidth,
      grainDir: 'length',
      notes: `Handle cutout: rectangular slot ~1" × 3" centered on each end, starting ~0.5" from end. Panels overlap ${formatIn(iL * overlapFraction)} when both closed.`,
    },
    {
      id: 'handle',
      label: 'Handle/Stop Strip',
      qty: 2,
      length: handleLength,
      width: handleHeightActual,
      grainDir: 'length',
      notes: '15° bevel on bottom inside edge for grip. Nailed to inside of end panels after carcass assembly. Acts as lid stop.',
    },
  ]

  return {
    pieces,
    dimensions: { iL, iW, iH, oL, oW, oH, lidPanelLength, lidPanelWidth, runnerDepth },
    input,
  }
}

/**
 * Pack rectangular pieces onto plywood sheets using guillotine cuts.
 * Returns sheet assignments with x,y positions for SVG rendering.
 */
export function packSheets(pieces, sheetW, sheetH, kerf) {
  // Expand pieces by qty into individual items
  const items = []
  for (const p of pieces) {
    for (let i = 0; i < p.qty; i++) {
      items.push({
        ...p,
        instanceId: `${p.id}-${i}`,
        w: p.length + kerf,
        h: p.width + kerf,
      })
    }
  }

  // Sort by area descending (largest first)
  items.sort((a, b) => (b.w * b.h) - (a.w * a.h))

  const sheets = []

  function newSheet() {
    return {
      sheetIndex: sheets.length,
      placed: [],
      freeRects: [{ x: 0, y: 0, w: sheetW, h: sheetH }],
    }
  }

  function tryPlace(sheet, item) {
    for (const [iw, ih, rotated] of [
      [item.w, item.h, false],
      [item.h, item.w, true],
    ]) {
      for (let ri = 0; ri < sheet.freeRects.length; ri++) {
        const r = sheet.freeRects[ri]
        if (iw <= r.w && ih <= r.h) {
          sheet.placed.push({
            ...item,
            x: r.x,
            y: r.y,
            placedW: iw - kerf,
            placedH: ih - kerf,
            rotated,
          })
          const newRects = []
          if (r.w - iw > kerf) newRects.push({ x: r.x + iw, y: r.y, w: r.w - iw, h: ih })
          if (r.h - ih > kerf) newRects.push({ x: r.x, y: r.y + ih, w: r.w, h: r.h - ih })
          sheet.freeRects.splice(ri, 1, ...newRects)
          return true
        }
      }
    }
    return false
  }

  let currentSheet = newSheet()
  sheets.push(currentSheet)

  for (const item of items) {
    if (!tryPlace(currentSheet, item)) {
      currentSheet = newSheet()
      sheets.push(currentSheet)
      tryPlace(currentSheet, item)
    }
  }

  return sheets
}

/**
 * Pack pieces across multiple sheets of potentially different sizes.
 * Tries each sheet in order — useful for partial sheets.
 * @param {Array} pieces
 * @param {Array<{w,h}>} sheetSizes - array of available sheets in order
 * @param {number} kerf
 */
export function packMultipleSheets(pieces, sheetSizes, kerf) {
  if (!sheetSizes.length) return packSheets(pieces, 48, 96, kerf);

  // Expand pieces by qty
  const items = [];
  for (const p of pieces) {
    for (let i = 0; i < p.qty; i++) {
      items.push({ ...p, instanceId: `${p.id}-${i}`, w: p.length + kerf, h: p.width + kerf });
    }
  }
  items.sort((a, b) => (b.w * b.h) - (a.w * a.h));

  const sheets = [];
  let remaining = [...items];

  for (const size of sheetSizes) {
    if (!remaining.length) break;
    // Try to fit as many remaining items as possible on this sheet
    const sheet = {
      sheetIndex: sheets.length,
      sheetW: size.w,
      sheetH: size.h,
      placed: [],
      freeRects: [{ x: 0, y: 0, w: size.w, h: size.h }],
    };
    const stillRemaining = [];
    for (const item of remaining) {
      if (!_tryPlace(sheet, item, kerf)) stillRemaining.push(item);
    }
    sheets.push(sheet);
    remaining = stillRemaining;
  }

  // If anything still left, overflow onto additional full sheets (last size)
  const lastSize = sheetSizes[sheetSizes.length - 1];
  while (remaining.length) {
    const sheet = {
      sheetIndex: sheets.length,
      sheetW: lastSize.w,
      sheetH: lastSize.h,
      placed: [],
      freeRects: [{ x: 0, y: 0, w: lastSize.w, h: lastSize.h }],
    };
    const stillRemaining = [];
    for (const item of remaining) {
      if (!_tryPlace(sheet, item, kerf)) stillRemaining.push(item);
    }
    sheets.push(sheet);
    if (stillRemaining.length === remaining.length) break; // safety
    remaining = stillRemaining;
  }

  return sheets;
}

function _tryPlace(sheet, item, kerf) {
  for (const [iw, ih, rotated] of [
    [item.w, item.h, false],
    [item.h, item.w, true],
  ]) {
    for (let ri = 0; ri < sheet.freeRects.length; ri++) {
      const r = sheet.freeRects[ri];
      if (iw <= r.w && ih <= r.h) {
        sheet.placed.push({ ...item, x: r.x, y: r.y, placedW: iw - kerf, placedH: ih - kerf, rotated });
        const newRects = [];
        if (r.w - iw > kerf) newRects.push({ x: r.x + iw, y: r.y, w: r.w - iw, h: ih });
        if (r.h - ih > kerf) newRects.push({ x: r.x, y: r.y + ih, w: r.w, h: r.h - ih });
        sheet.freeRects.splice(ri, 1, ...newRects);
        return true;
      }
    }
  }
  return false;
}
