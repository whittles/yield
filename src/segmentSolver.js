/**
 * Segmented woodturning calculator.
 *
 * A segmented bowl is a stack of rings. Each ring is n mitered trapezoids glued
 * edge to edge, and each course is brick-laid — rotated half a segment — so the
 * joints stagger. This module does the geometry for one ring, for a whole stack,
 * and for the tapered-stave alternative.
 *
 * Exact geometry lands cut lengths on numbers like 2.1436", which no one sets on
 * a sled, and it wants a different rip width for every course, which no one
 * bothers to do. So the shop-facing path rounds the two dimensions a turner
 * actually sets — the cut length and the rip width — UP onto a 1/8, 1/16 or
 * 1/32 grid, and takes one rip width for the whole stack. `snapRing` carries the
 * argument for why up is the only safe direction and why the miter must not be
 * touched. Exact output is still available and unchanged.
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
 *
 *   snapped to 1/16   outer 2.1875" (2 3/16)  strip 1.0000"  turnsTo 8.0000"
 *                     maxRound 8.1639"  extraOD 0.1639"
 *   miter is NEVER snapped, at any grid: 15.000° at every denominator.
 *
 * ── Acceptance values, stack (n = 12, base 4", 60° wall, 3/4" rings, 6" tall)
 *   exact       rip 1.3289" (the widest course, unrounded)
 *   1/16        rip 1.4375" (1 7/16), stripNeeded 1.4146", 7 stop settings
 *               cut lengths 1.5625 1.8125 2.0000 2.2500 2.5000 2.7500 2.9375
 *   1/16 note   ring 6 drives the rip width, NOT the widest ring 7 — snapping
 *               ring 6's length up costs it 0.1004" of strip against ring 7's
 *               0.0174". This is the whole reason `calcStack` measures strips
 *               only after lengths are rounded.
 *   n=24 @ 1/8  natural step 0.1140" < snap step 0.1250" → courses 1 and 2
 *               merge onto one length. Reported, not silently absorbed.
 *   90° wall    every course identical BY DESIGN, so mergedCourses is empty —
 *               rounding did not do that and must not be blamed for it.
 *   stockWidth 1"    → rings flagged short (bore cannot reach the wall asked)
 *   stockWidth 1.5"  → nothing short, surplus goes to the bore
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

/** Snap grids offered to the user. 0 means exact — no rounding at all. */
export const SNAP_DENOMS = [0, 8, 16, 32]

/**
 * Round UP to the next 1/denom. `denom` of 0 (or anything not positive and
 * finite) passes the value through untouched.
 *
 * Up, never to-nearest, and that direction is the whole safety argument — see
 * `snapRing`. The epsilon stops a value already sitting on the grid from
 * jumping a full step: 2.0 at 1/16 must stay 2.0, not become 2 1/16.
 */
export function snapUp(v, denom) {
  if (!denom || !Number.isFinite(denom) || denom <= 0) return v
  if (!Number.isFinite(v)) return v
  return Math.ceil(v * denom - 1e-9) / denom
}

/**
 * Re-cut a ring's geometry to numbers a person can actually set on a saw.
 *
 * Two things get fixed here, and they are the two things a turner controls:
 * the LENGTH the sled stop is set to, and the WIDTH the fence is set to. Both
 * round up. Nothing else moves — in particular the miter does not, because the
 * miter is what makes the ring close.
 *
 * Why rounding cannot break the ring: n identical trapezoids mitered 180/n at
 * both ends close into a regular polygon at ANY edge length. Closure is the
 * angle's job. Edge length only decides which diameter you land on. So the
 * risk of rounding is never a gappy glue-up, only a different size.
 *
 * Why rounding UP is safe, whereas to-nearest is not. The two radii carry
 * opposite requirements:
 *
 *   aOut is a MINIMUM — the outer flats must reach OD/2 or the ring cannot be
 *                       turned fully round.
 *   aIn  is a MAXIMUM — the inner corners must clear ID/2 or the bore cannot
 *                       be cut round.
 *
 * Rounding the length up only raises aOut. Rounding the strip width up only
 * lowers aIn. Both move away from their limit, so a snapped ring is always
 * still buildable, with more wood to remove rather than less. Rounding to
 * nearest would push some courses under the required diameter, and stock that
 * finishes undersize cannot be fixed at the lathe.
 *
 * In 'finished' mode the target never moves: you still turn to the diameter you
 * asked for, the snap is margin. In 'blank' mode the nominal circle is the
 * blank itself, so a bigger blank does finish bigger — reported, not hidden.
 *
 * @param {object} geo  a `ringGeometry` result
 * @param {object} [opts]
 * @param {number} [opts.snapDenom] round lengths up to 1/denom; 0 = exact
 * @param {number} [opts.ripWidth]  force the strip width (one fence setting for
 *                                  a whole stack, or the stock the user owns)
 */
export function snapRing(geo, { snapDenom = 0, ripWidth = 0 } = {}) {
  if (!geo || geo.error) return geo

  const half = (geo.span / 2) * RAD
  const t = Math.tan(half)

  // What exact geometry asked for, kept so the view can show asked against got.
  const asked = {
    outerEdge: geo.outerEdge,
    innerEdge: geo.innerEdge,
    stripWidth: geo.stripWidth,
    aOut: geo.aOut,
    aIn: geo.aIn,
    blankDia: geo.aOut * 2,
    cornerDia: geo.outerCorner * 2,
  }

  const outerEdge = snapUp(geo.outerEdge, snapDenom)
  const aOut = outerEdge / (2 * t)

  // How wide this course needs the strip once its length has been rounded up.
  // Rounding the length up pushes the outer flats out without moving the bore,
  // so the strip has to grow by exactly that much.
  const stripNeed = aOut - geo.aIn
  const stripWidth = ripWidth > 0 ? ripWidth : snapUp(stripNeed, snapDenom)
  const aIn = aOut - stripWidth

  if (aIn <= 0) {
    return {
      ...geo,
      error:
        `A ${fmtNum(stripWidth)}" strip is too wide for a ${fmtNum(geo.OD)}" ring in ` +
        `${geo.n} segments — the segments would meet in the middle. Rip narrower stock.`,
    }
  }

  const innerEdge = 2 * aIn * t
  const outerCorner = aOut / Math.cos(half)
  const innerCorner = aIn / Math.cos(half)

  return {
    ...geo,
    snapDenom,
    snapped: true,
    asked,
    aOut,
    aIn,
    outerEdge,
    innerEdge,
    stripWidth,
    outerCorner,
    innerCorner,
    turnsTo: geo.mode === MODE_BLANK ? 2 * aOut : geo.OD,
    // The honest limits of the blank that actually gets glued up: the largest
    // round outside it can give, and the smallest round bore it can take.
    maxRound: 2 * aOut,
    minBore: 2 * innerCorner,
    // Extra material the rounding added, as diameter, which is how a turner
    // reads a caliper.
    extraOD: 2 * (aOut - asked.aOut),
    extraBore: 2 * (asked.aIn - aIn),
    // A strip NARROWER than the course needs — only reachable by supplying
    // stock by hand — leaves the inner corners proud of the bore, so the wall
    // finishes thinner than asked at n points. Buildable, but not as drawn.
    stockShort: aIn > asked.aIn + 1e-9,
    stripNeed,
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
 * @param {number} [input.snapDenom]  round cut length and rip width up to 1/denom
 * @param {number} [input.ripWidth]   force the strip width instead of deriving it
 */
export function calcRing(input) {
  const geo0 = ringGeometry(input)
  if (geo0.error) return geo0

  const {
    ringHeight = 0,
    kerf = 0,
    trimPct = 0,
    cutMethod = 'nested',
    snapDenom = 0,
    ripWidth = 0,
  } = input

  // One fence setting is the physical reality even when nothing is rounded, so
  // a forced rip width goes through the same path as a snapped one.
  const geo = snapDenom > 0 || ripWidth > 0
    ? snapRing(geo0, { snapDenom, ripWidth })
    : geo0
  if (geo.error) return geo

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
    snapDenom,
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
    // Strip length the rounding cost this course, across all n segments.
    extraStrip: geo.asked ? (geo.outerEdge - geo.asked.outerEdge) * geo.n : 0,
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
    snapDenom = 0,
    stockWidth = 0,
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

  // Every course is a different diameter, so exact geometry wants a different
  // rip width for each one. Nobody rips twenty widths: the fence gets set once
  // and the whole bowl comes off one strip. That makes the rip width a
  // stack-wide decision, and a stack-wide decision cannot be made until every
  // course has been sized — hence two passes.
  const ringSpecs = []
  for (let i = 0; i < ringCount; i++) {
    const midHeight = baseOffset + (i + 0.5) * ringHeight
    const finishOD = baseOD + 2 * midHeight * flarePerInch
    // Extra stock so the ring can be turned to the slope at both its edges.
    const blankOD = finishOD + angleMargin
    ringSpecs.push({
      index: i + 1,
      midHeight,
      finishOD,
      blankOD,
      input: {
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
        snapDenom,
      },
    })
  }

  // ── Pass 1: the widest strip any course needs, AFTER its length is rounded.
  // Order matters — rounding a length up pushes the outer flats out, which
  // widens the strip. Measuring the strips first would under-size the rip.
  let stripNeeded = 0
  for (const spec of ringSpecs) {
    const g = ringGeometry(spec.input)
    if (g.error) continue
    const s = snapRing(g, { snapDenom })
    if (s.error) continue
    stripNeeded = Math.max(stripNeeded, s.stripNeed)
  }

  // Stock the user actually owns wins over what we would have chosen, even when
  // it is too narrow — being told the 1" board won't reach is the useful answer.
  const ripWidth = stockWidth > 0 ? stockWidth : snapUp(stripNeeded, snapDenom)

  // ── Pass 2: build every course against that one rip width.
  const rings = []
  const errors = []
  for (const spec of ringSpecs) {
    const ring = calcRing({ ...spec.input, ripWidth })

    if (ring.error) {
      errors.push(`Ring ${spec.index}: ${ring.error}`)
      rings.push({
        index: spec.index,
        error: ring.error,
        finishOD: spec.finishOD,
        blankOD: spec.blankOD,
        midHeight: spec.midHeight,
      })
      continue
    }

    rings.push({
      ...ring,
      index: spec.index,
      midHeight: spec.midHeight,
      finishOD: spec.finishOD,
      blankOD: spec.blankOD,
      // Every other course rotates half a segment so the joints stagger.
      rotateBy: spec.index % 2 === 0 ? 180 / n : 0,
    })
  }

  const good = rings.filter((r) => !r.error)

  // Rounding merges two courses whenever the snap step is coarser than the
  // taper's own step. The blank then steps instead of tapering. It is still
  // turnable — every course was rounded UP, so the material is there — but more
  // of it ends up as shavings, and the user should hear that from us rather
  // than notice it at the lathe.
  const exactEdge = (r) => r.asked?.outerEdge ?? r.outerEdge

  const byLength = new Map()
  for (const r of good) {
    const key = r.outerEdge.toFixed(4)
    if (!byLength.has(key)) byLength.set(key, [])
    byLength.get(key).push(r)
  }

  const mergedCourses = [...byLength.values()]
    .filter((g) => g.length > 1)
    // A straight-sided bowl has identical courses by design, and rounding did
    // not do that to it. Reporting those as merged would send someone looking
    // for a problem they don't have, so only groups whose EXACT lengths
    // actually differed count as something the rounding caused.
    .filter((g) => {
      const exact = g.map(exactEdge)
      return Math.max(...exact) - Math.min(...exact) > 1e-9
    })
    .map((g) => g.map((r) => r.index))

  const naturalStep = good.length > 1 ? Math.abs(exactEdge(good[1]) - exactEdge(good[0])) : 0
  const snapStep = snapDenom > 0 ? 1 / snapDenom : 0

  // Courses the supplied stock cannot bore out to the wall thickness asked for.
  const shortRings = good.filter((r) => r.stockShort).map((r) => r.index)
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
    snapDenom,
    stockWidth,
    // Rounding diagnostics the view turns into plain-language warnings.
    mergedCourses,
    naturalStep,
    snapStep,
    shortRings,
    totals: {
      ringCount: good.length,
      segments: good.length * n,
      boardLength: good.reduce((s, r) => s + r.boardLength, 0),
      boardFeet: good.reduce((s, r) => s + r.boardFeet, 0) + (base ? base.boardFeet : 0),
      // One fence setting for the whole bowl. `stripNeeded` is what the widest
      // course actually requires; `ripWidth` is that rounded up, or the stock
      // the user said they have.
      ripWidth,
      stripNeeded,
      // Kept under its old name: every consumer means "the one rip width".
      widestStrip: ripWidth,
      // What the rounding cost, so the trade is visible rather than asserted.
      extraStrip: good.reduce((s, r) => s + (r.extraStrip ?? 0), 0),
      maxExtraOD: good.reduce((s, r) => Math.max(s, r.extraOD ?? 0), 0),
      maxExtraBore: good.reduce((s, r) => Math.max(s, r.extraBore ?? 0), 0),
      // Distinct sled stop settings — the number of times you touch the stop.
      stopSettings: byLength.size,
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
  const {
    n, baseOD, wallAngle, height, wall = 0, mode = MODE_FINISHED,
    kerf = 0, trimPct = 0, snapDenom = 0, stockWidth = 0,
  } = input

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

  const t = Math.tan(half)
  const asked = {
    widthBase: 2 * aBase * t,
    widthTop: 2 * aTop * t,
    // Length along the slope, which is what you cut — not the vertical height.
    staveLength: vertical ? height : height / Math.sin(a),
    baseOD,
    topOD,
  }

  // Same rule as a ring: the layout dimensions round UP, so a snapped stave is
  // always big enough to turn down to the vessel that was asked for. Here the
  // two end widths are what get marked on the board, so both of them round,
  // along with the length.
  const widthBase = snapUp(asked.widthBase, snapDenom)
  const widthTop = snapUp(asked.widthTop, snapDenom)
  const staveLength = snapUp(asked.staveLength, snapDenom)

  // Back out the vessel those rounded widths actually produce.
  const diaFor = (w) => {
    const aFlat = w / (2 * t)
    return mode === MODE_BLANK ? (2 * aFlat) / Math.cos(half) : 2 * aFlat
  }

  const boardLength = n * (staveLength + kerf) * (1 + trimPct / 100)
  const widest = Math.max(widthTop, widthBase)

  return {
    error: null,
    n,
    wallAngle,
    height,
    snapDenom,
    asked: snapDenom > 0 ? asked : null,
    baseOD: diaFor(widthBase),
    topOD: diaFor(widthTop),
    bevel: staveBevel(n, wallAngle),
    // Taper per edge, so it can be laid out with a straightedge.
    taperPerEdge: (widthTop - widthBase) / 2,
    widthBase,
    widthTop,
    staveLength,
    boardLength,
    // Rounding both ends onto the same grid line flattens the taper into a
    // cylinder. Cheap to detect and badly wrong to ship silently.
    taperLost: widthTop === widthBase && asked.widthTop !== asked.widthBase,
    // A stave is marked out and sawn to its taper, so stock only has to be wide
    // enough for the wider end — there is nothing to turn away here.
    stockWidth,
    stockShort: stockWidth > 0 && stockWidth < widest - 1e-9,
    stockNeeded: widest,
    boardFeet: (widest * boardLength * wall) / 144,
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
