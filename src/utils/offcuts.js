/**
 * Leftover-material geometry.
 *
 * The app reported a waste percentage but never named the pieces you'd be
 * left holding, which is the question a woodworker actually asks after a cut
 * plan. These helpers subtract the placed cuts from the board face to get real
 * rectangles that can be drawn, measured, and racked.
 */

// Below this, a leftover piece is sawdust rather than stock worth keeping.
export const KEEP_MIN_LENGTH = 6
export const KEEP_MIN_WIDTH = 1.5

/**
 * Free rectangles on one board face, in board inches.
 * @param {{usableLength:number, usableWidth:number}} board
 * @param {Array<{xOffset:number,yOffset:number,cutLength:number,cutWidth:number}>} cuts
 * @returns {Array<{x0:number,x1:number,y0:number,y1:number}>}
 */
export function freeRegions(board, cuts = []) {
  const L = board?.usableLength || 0
  const W = board?.usableWidth || 0
  if (!L || !W) return []

  const boxes = cuts.map(c => ({
    x0: c.xOffset,
    x1: c.xOffset + c.cutLength,
    y0: c.yOffset,
    y1: c.yOffset + c.cutWidth,
  }))

  // Horizontal bands split at every cut edge.
  const edges = new Set([0, W])
  for (const b of boxes) {
    if (b.y0 > 0 && b.y0 < W) edges.add(b.y0)
    if (b.y1 > 0 && b.y1 < W) edges.add(b.y1)
  }
  const ys = [...edges].sort((a, z) => a - z)

  const bands = []
  for (let i = 0; i < ys.length - 1; i++) {
    const top = ys[i]
    const bottom = ys[i + 1]
    if (bottom - top < 1e-6) continue
    const mid = (top + bottom) / 2

    const spans = boxes
      .filter(b => b.y0 <= mid && b.y1 >= mid)
      .map(b => [b.x0, b.x1])
      .sort((a, z) => a[0] - z[0])

    const merged = []
    for (const [s, e] of spans) {
      const last = merged[merged.length - 1]
      if (last && s <= last[1] + 1e-6) last[1] = Math.max(last[1], e)
      else merged.push([s, e])
    }

    let cursor = 0
    for (const [s, e] of merged) {
      if (s - cursor > 1e-6) bands.push({ x0: cursor, x1: s, y0: top, y1: bottom })
      cursor = Math.max(cursor, e)
    }
    if (L - cursor > 1e-6) bands.push({ x0: cursor, x1: L, y0: top, y1: bottom })
  }

  // Merge vertically adjacent bands that share an x-extent, so one offcut
  // reads as one rectangle rather than a stack of stripes.
  bands.sort((a, z) => a.x0 - z.x0 || a.y0 - z.y0)
  const out = []
  for (const band of bands) {
    const prev = out.find(r =>
      Math.abs(r.x0 - band.x0) < 1e-6 &&
      Math.abs(r.x1 - band.x1) < 1e-6 &&
      Math.abs(r.y1 - band.y0) < 1e-6)
    if (prev) prev.y1 = band.y1
    else out.push({ ...band })
  }
  return out
}

/** Free regions big enough to be worth keeping, largest first. */
export function keepableOffcuts(board, cuts = [], limit = 3) {
  return freeRegions(board, cuts)
    .map(r => ({ ...r, length: r.x1 - r.x0, width: r.y1 - r.y0 }))
    .filter(r => r.length >= KEEP_MIN_LENGTH && r.width >= KEEP_MIN_WIDTH)
    .sort((a, z) => z.length * z.width - a.length * a.width)
    .slice(0, limit)
}

/**
 * Keepable offcuts across every board in a result set, largest first.
 * @param {Array<{stockPiece:object, cuts:Array}>} boards
 */
export function allKeepableOffcuts(boards = [], limit = 4) {
  const all = []
  for (const b of boards) {
    const board = b?.stockPiece
    if (!board) continue
    for (const o of keepableOffcuts(board, b.cuts ?? [], 3)) {
      all.push({ ...o, boardLabel: board.label ?? '' })
    }
  }
  return all
    .sort((a, z) => z.length * z.width - a.length * a.width)
    .slice(0, limit)
}
