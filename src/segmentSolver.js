/**
 * Segmented woodturning calculator.
 *
 * A segmented bowl is a stack of rings. Each ring is n mitered trapezoids glued
 * edge to edge, and each course is brick-laid — rotated half a segment — so the
 * joints stagger. This module does the geometry for one ring, for a whole stack,
 * and for the tapered-stave alternative.
 *
 * IMPORTANT: this file must stay free of `@/` imports. The alias only resolves
 * inside Vite, so a solver that uses it cannot be loaded by node and therefore
 * cannot be checked outside the browser. Everything here returns raw numbers;
 * the view formats them.
 *
 * ── Acceptance values (n = 12, OD 8", wall 3/4") ───────────────────────────
 *   finished      miter 15.000°  outer 2.1436"  inner 1.6823"  strip 0.8607"
 *   blank         miter 15.000°  outer 2.0706"  inner 1.6823"  strip 0.7244"
 *                 blank turns down to 7.7274", not 8"
 *   finished, 5° gap             miter 12.500°  outer 1.7736"  strip 0.8270"
 *   finished, 1/8" kerf, nested: kerfAlong 0.1294", board 24.6378"
 *                                (27.102" with 10% trim; same-face 37.943")
 *   staveBevel(n, 90) === 180/n exactly;  staveBevel(n, 0) === 0 exactly
 * ───────────────────────────────────────────────────────────────────────────
 */

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

/** Diameter conventions. See `ringGeometry` for what they actually mean. */
export const MODE_FINISHED = 'finished'
export const MODE_BLANK = 'blank'

/**
 * Core ring geometry.
 *
 * A segmented ring is a polygon, and a polygon has two radii: the FLATS sit at
 * perpendicular distance `a` from the centre, and the CORNERS sit further out at
 * `a / cos(half)`. Which of those lands on the nominal circle is the whole
 * question, and it resolves in opposite directions inside and out:
 *
 *   Outside — turning cuts inward to OD/2. The nearest material is the flats,
 *             so a fully round result needs  a_out >= OD/2.
 *   Inside  — boring cuts outward to ID/2. The furthest inner material is the
 *             corners, so a clean bore needs  a_in / cos(half) <= ID/2.
 *
 * 'finished' honours both, so the ring turns to a true OD and bores to a true
 * ID. 'blank' puts the corners on both nominal circles (what blocklayer.com
 * does), which is easier to lay out but turns down to OD·cos(half) — reported
 * as `turnsTo` so the shortfall is never a surprise.
 *
 * @param {object} input
 * @param {number} input.n         segments in the ring (>= 3)
 * @param {number} input.OD        ring outside diameter
 * @param {number} input.wall      radial wall thickness
 * @param {string} [input.mode]    MODE_FINISHED (default) | MODE_BLANK
 * @param {number} [input.gapDeg]  open gap between segments, in degrees
 * @param {number} [input.marginIn]  extra stock on the inner face
 * @param {number} [input.marginOut] extra stock on the outer face
 * @returns {object} geometry, plus `error` when the ring cannot be built
 */
export function ringGeometry(input) {
  const {
    n,
    OD,
    wall,
    mode = MODE_FINISHED,
    gapDeg = 0,
    marginIn = 0,
    marginOut = 0,
  } = input

  if (!Number.isFinite(n) || n < 3) {
    return { error: 'A ring needs at least 3 segments.' }
  }
  if (!(OD > 0)) {
    return { error: 'Outside diameter must be greater than zero.' }
  }
  if (!(wall > 0)) {
    return { error: 'Wall thickness must be greater than zero.' }
  }
  if (wall >= OD / 2) {
    return { error: `A ${fmtNum(wall)}" wall leaves no opening in a ${fmtNum(OD)}" ring.` }
  }

  const segAngle = 360 / n
  const span = segAngle - gapDeg // angular span of one segment
  if (span <= 0) {
    return { error: `A ${fmtNum(gapDeg)}° gap uses up the whole ${fmtNum(segAngle)}° segment.` }
  }

  const halfDeg = span / 2
  const half = halfDeg * RAD
  const ID = OD - 2 * wall

  // Perpendicular distance from centre to the outer and inner flats.
  let aOut, aIn
  if (mode === MODE_BLANK) {
    aOut = (OD / 2) * Math.cos(half)
    aIn = (ID / 2) * Math.cos(half)
  } else {
    aOut = OD / 2 + marginOut
    aIn = (ID / 2) * Math.cos(half) - marginIn
  }

  if (aIn <= 0) {
    return {
      error:
        `${n} segments won't fit a ${fmtNum(OD)}" ring with a ${fmtNum(wall)}" wall — ` +
        'the segments meet in the middle. Use fewer segments or a thinner wall.',
    }
  }

  const outerEdge = 2 * aOut * Math.tan(half)
  const innerEdge = 2 * aIn * Math.tan(half)
  const stripWidth = aOut - aIn

  return {
    error: null,
    n,
    mode,
    segAngle,
    span,
    gapDeg,
    // The saw setting. Miter gauge / sled angle from square, per end.
    miter: halfDeg,
    OD,
    ID,
    wall,
    aOut,
    aIn,
    outerEdge,
    innerEdge,
    stripWidth,
    // What the ring actually turns down to once it's round.
    turnsTo: mode === MODE_BLANK ? OD * Math.cos(half) : OD,
    boresTo: ID,
    // Corner radii — the true extent of the glued-up blank, before turning.
    outerCorner: aOut / Math.cos(half),
    innerCorner: aIn / Math.cos(half),
  }
}

/**
 * Ring geometry plus the stock it takes.
 *
 * Segments are crosscut from a strip ripped to `stripWidth` out of stock whose
 * THICKNESS becomes the ring's height — that's why `ringHeight` is the board-feet
 * thickness term and not a typo.
 *
 * @param {object} input  everything `ringGeometry` takes, plus:
 * @param {number} [input.ringHeight] height of the ring = thickness of the stock
 * @param {number} [input.kerf]       saw kerf, lost per crosscut
 * @param {number} [input.trimPct]    extra board length for trim/snipe, as a percent
 */
export function calcRing(input) {
  const geo = ringGeometry(input)
  if (geo.error) return geo

  const { ringHeight = 0, kerf = 0, trimPct = 0, cutMethod = 'nested' } = input

  const half = (geo.span / 2) * RAD

  // A crosscut at the miter angle eats MORE than its kerf measured along the
  // strip's long edge: the blade is skewed, so it consumes kerf / cos(miter).
  // At 15° a 1/8" blade takes 0.1294". Small per cut, real over a whole bowl.
  const kerfAlong = kerf / Math.cos(half)

  // Nested: flip the strip between cuts and consecutive trapezoids interlock,
  // so the pitch along the top edge alternates long, short, long, short. This
  // is how segments are actually cut, and it is markedly less stock than
  // squaring off every piece the same way up.
  const nested =
    Math.ceil(geo.n / 2) * geo.outerEdge +
    Math.floor(geo.n / 2) * geo.innerEdge +
    (geo.n + 1) * kerfAlong

  // Same face up: keeps grain running one way, but drops a waste triangle
  // between every segment, so each one costs 2·outer − inner along the edge.
  const sameFace = geo.n * (2 * geo.outerEdge - geo.innerEdge) + (2 * geo.n + 1) * kerfAlong

  const boardLengthBare = cutMethod === 'sameFace' ? sameFace : nested
  const boardLength = boardLengthBare * (1 + trimPct / 100)
  const boardFeet = (geo.stripWidth * boardLength * ringHeight) / 144

  return {
    ...geo,
    ringHeight,
    kerf,
    kerfAlong,
    trimPct,
    cutMethod,
    boardLengthBare,
    boardLength,
    boardLengthNested: nested * (1 + trimPct / 100),
    boardLengthSameFace: sameFace * (1 + trimPct / 100),
    boardFeet,
  }
}

/**
 * The stack: a bowl profile turned into a per-ring cut list.
 *
 * Each ring is sized at its MID-HEIGHT, so the turned cone splits its error
 * between the ring's top and bottom edge instead of piling it all at one end.
 * A sloped wall also moves radially by ringHeight/tan(α) over one course, so
 * every ring carries that much extra stock — this is the manual "extra margin
 * for angled sides" lookup on the reference site, applied automatically.
 *
 * @param {object} input
 * @param {number} input.baseOD      outside diameter at the bottom of the wall
 * @param {number} input.wallAngle   wall angle from HORIZONTAL (90 = straight sided)
 * @param {number} input.wall        finished radial wall thickness
 * @param {number} input.ringHeight  height of one course = thickness of the stock
 * @param {number} input.totalHeight overall height, base included
 * @param {number} input.n           segments per ring
 * @param {string} [input.baseStyle] 'solid' (default) | 'segmented'
 */
export function calcStack(input) {
  const {
    baseOD,
    wallAngle,
    wall,
    ringHeight,
    totalHeight,
    n,
    baseStyle = 'solid',
    mode = MODE_FINISHED,
    gapDeg = 0,
    marginIn = 0,
    marginOut = 0,
    kerf = 0,
    trimPct = 0,
    cutMethod = 'nested',
  } = input

  if (!(ringHeight > 0)) {
    return { error: 'Ring height must be greater than zero.', rings: [] }
  }
  if (!(totalHeight > 0)) {
    return { error: 'Total height must be greater than zero.', rings: [] }
  }
  if (!(wallAngle > 0) || wallAngle > 90) {
    return { error: 'Wall angle must be between 0° and 90°.', rings: [] }
  }

  // A solid base takes the first course of height; rings stack above it.
  const solidBase = baseStyle === 'solid'
  const baseOffset = solidBase ? ringHeight : 0
  const wallHeight = totalHeight - baseOffset

  if (wallHeight < ringHeight) {
    return {
      error: `A ${fmtNum(totalHeight)}" bowl with a ${fmtNum(ringHeight)}" base leaves no room for rings.`,
      rings: [],
    }
  }

  // At 90° the wall is vertical and every ring is the same diameter. Special-case
  // it rather than leaning on tan(90°), which is 1.6e16 rather than Infinity.
  const vertical = wallAngle >= 90
  const flarePerInch = vertical ? 0 : 1 / Math.tan(wallAngle * RAD)
  const angleMargin = ringHeight * flarePerInch // total, split across both faces

  const ringCount = Math.ceil(wallHeight / ringHeight)
  const rings = []
  const errors = []

  for (let i = 0; i < ringCount; i++) {
    const midHeight = baseOffset + (i + 0.5) * ringHeight
    const finishOD = baseOD + 2 * midHeight * flarePerInch
    // Extra stock so the ring can be turned to the slope at both its edges.
    const blankOD = finishOD + angleMargin

    const ring = calcRing({
      n,
      OD: blankOD,
      // The bore must reach the ring's bottom edge, which is angleMargin
      // narrower than its top. Half of it leaves the inside proud.
      wall: wall + angleMargin,
      mode,
      gapDeg,
      marginIn,
      marginOut,
      ringHeight,
      kerf,
      trimPct,
      cutMethod,
    })

    if (ring.error) {
      errors.push(`Ring ${i + 1}: ${ring.error}`)
      rings.push({ index: i + 1, error: ring.error, finishOD, blankOD, midHeight })
      continue
    }

    rings.push({
      ...ring,
      index: i + 1,
      midHeight,
      finishOD,
      blankOD,
      // Every other course rotates half a segment so the joints stagger.
      rotateBy: i % 2 === 1 ? 180 / n : 0,
    })
  }

  const good = rings.filter((r) => !r.error)
  const base = solidBase
    ? { diameter: baseOD, thickness: ringHeight, boardFeet: (Math.PI * (baseOD / 2) ** 2 * ringHeight) / 144 }
    : null

  return {
    error: null,
    rings,
    errors,
    base,
    baseStyle,
    n,
    wallAngle,
    ringHeight,
    totalHeight,
    angleMargin,
    gapDeg,
    span: 360 / n - gapDeg,
    totals: {
      ringCount: good.length,
      segments: good.length * n,
      boardLength: good.reduce((s, r) => s + r.boardLength, 0),
      boardFeet: good.reduce((s, r) => s + r.boardFeet, 0) + (base ? base.boardFeet : 0),
      // Rip everything to the widest strip and one setup does the whole bowl.
      widestStrip: good.reduce((s, r) => Math.max(s, r.stripWidth), 0),
      boardLengthSameFace: good.reduce((s, r) => s + r.boardLengthSameFace, 0),
      boardLengthNested: good.reduce((s, r) => s + r.boardLengthNested, 0),
    },
  }
}

/**
 * Edge bevel for tapered staves, exactly.
 *
 * The formula that circulates in woodworking references —
 *     atan( tan(180/n) · sin α )
 * — is WRONG. It happens to be exact at both endpoints (180/n for a cylinder,
 * 0 for a flat disc), which is why it survives, but it drifts in between:
 * 0.11° off at n=12/α=60°, and 1.62° off at n=6/α=30°, which is nearly 10° of
 * accumulated gap around a six-stave glue-up.
 *
 * Derive it instead. Face k of the frustum has outward normal
 *     (sin α·cos φ, sin α·sin φ, cos α),  φ = 360k/n
 * and the bevel on each edge is half the angle between adjacent normals.
 *
 * @param {number} n         staves
 * @param {number} alphaDeg  side angle from HORIZONTAL (90 = a cylinder)
 * @returns {number} bevel in degrees, measured from square
 */
export function staveBevel(n, alphaDeg) {
  const a = alphaDeg * RAD
  const dot = Math.sin(a) ** 2 * Math.cos((360 / n) * RAD) + Math.cos(a) ** 2
  // Guard the domain: rounding can push dot a hair past ±1.
  return (Math.acos(Math.min(1, Math.max(-1, dot))) * DEG) / 2
}

/**
 * Tapered staves — the alternative to a ring stack for a straight-walled,
 * flaring vessel. One full-height piece per side, edge-jointed, no courses.
 *
 * @param {object} input
 * @param {number} input.n          number of staves
 * @param {number} input.baseOD     outside diameter at the bottom
 * @param {number} input.wallAngle  side angle from horizontal
 * @param {number} input.height     vertical height of the vessel
 * @param {number} [input.wall]     wall thickness, for board feet
 * @param {string} [input.mode]     diameter convention
 */
export function calcStave(input) {
  const { n, baseOD, wallAngle, height, wall = 0, mode = MODE_FINISHED, kerf = 0, trimPct = 0 } = input

  if (!Number.isFinite(n) || n < 3) {
    return { error: 'A stave vessel needs at least 3 staves.' }
  }
  if (!(wallAngle > 0) || wallAngle > 90) {
    return { error: 'Side angle must be between 0° and 90°.' }
  }
  if (!(height > 0)) {
    return { error: 'Height must be greater than zero.' }
  }
  if (!(baseOD > 0)) {
    return { error: 'Base diameter must be greater than zero.' }
  }

  const a = wallAngle * RAD
  const half = (180 / n) * RAD
  const vertical = wallAngle >= 90

  const rBase = baseOD / 2
  const rTop = rBase + (vertical ? 0 : height / Math.tan(a))
  const topOD = rTop * 2

  // Perpendicular distance to the flats, per the chosen convention.
  const aBase = mode === MODE_BLANK ? rBase * Math.cos(half) : rBase
  const aTop = mode === MODE_BLANK ? rTop * Math.cos(half) : rTop

  const widthBase = 2 * aBase * Math.tan(half)
  const widthTop = 2 * aTop * Math.tan(half)
  // Length along the slope, which is what you cut — not the vertical height.
  const staveLength = vertical ? height : height / Math.sin(a)

  const boardLength = n * (staveLength + kerf) * (1 + trimPct / 100)

  return {
    error: null,
    n,
    wallAngle,
    height,
    baseOD,
    topOD,
    bevel: staveBevel(n, wallAngle),
    // Taper per edge, so it can be laid out with a straightedge.
    taperPerEdge: (widthTop - widthBase) / 2,
    widthBase,
    widthTop,
    staveLength,
    boardLength,
    boardFeet: (Math.max(widthTop, widthBase) * boardLength * wall) / 144,
  }
}

/**
 * The four corners of one segment, in inches, for drawing.
 * Bisector runs up +Y; the ring centre is the origin.
 * Order is outer-left, outer-right, inner-right, inner-left.
 */
export function segmentOutline(geo) {
  if (!geo || geo.error) return []
  const half = (geo.span / 2) * RAD
  const t = Math.tan(half)
  return [
    { x: -geo.aOut * t, y: geo.aOut },
    { x: geo.aOut * t, y: geo.aOut },
    { x: geo.aIn * t, y: geo.aIn },
    { x: -geo.aIn * t, y: geo.aIn },
  ]
}

/** Every segment of a ring, each rotated into place. `rotateBy` in degrees. */
export function ringOutlines(geo, rotateBy = 0) {
  if (!geo || geo.error) return []
  const base = segmentOutline(geo)
  const out = []
  for (let i = 0; i < geo.n; i++) {
    const th = (i * geo.segAngle + rotateBy) * RAD
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    out.push(base.map((p) => ({ x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos })))
  }
  return out
}

/** Compact number for error copy — trims trailing zeros without pulling in the fraction utils. */
function fmtNum(v) {
  if (!Number.isFinite(v)) return '?'
  return String(Math.round(v * 1000) / 1000)
}
