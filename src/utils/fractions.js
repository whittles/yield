/**
 * Parse fractional inch strings to decimal
 * Handles: "1 3/4", "3/4", "1.75", "96"
 *
 * Always returns a finite, non-negative number. Anything unparseable,
 * negative, or non-finite (e.g. "1/0") collapses to 0 — callers that need
 * to tell "zero" from "garbage" apart must use validateDimension().
 */
export function parseFraction(str) {
  if (str === null || str === undefined) return 0;
  str = String(str).trim();
  if (!str) return 0;

  let value = 0;

  if (!str.includes('/')) {
    // Pure decimal
    value = parseFloat(str);
  } else {
    // Mixed number: "1 3/4"
    const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) {
      const denom = parseInt(mixed[3]);
      value = denom === 0 ? NaN : parseInt(mixed[1]) + parseInt(mixed[2]) / denom;
    } else {
      // Simple fraction: "3/4"
      const simple = str.match(/^(\d+)\/(\d+)$/);
      if (simple) {
        const denom = parseInt(simple[2]);
        value = denom === 0 ? NaN : parseInt(simple[1]) / denom;
      }
    }
  }

  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

/**
 * Validate a dimension string the way the input fields need it.
 * Returns { ok, value, error } — error is a plain-language message naming
 * both the problem and the fix, or null when ok.
 */
export function validateDimension(str, { label = 'This', allowZero = false } = {}) {
  const raw = str === null || str === undefined ? '' : String(str).trim();
  if (!raw) return { ok: false, value: 0, error: `${label} is required.` };

  const looksNumeric = /^\d+(\.\d+)?$/.test(raw)
    || /^\d+\s+\d+\/\d+$/.test(raw)
    || /^\d+\/\d+$/.test(raw);

  if (!looksNumeric) {
    // Distinguish the two ways this usually goes wrong.
    if (/^-/.test(raw)) {
      return { ok: false, value: 0, error: `${label} can't be negative.` };
    }
    return {
      ok: false,
      value: 0,
      error: `${label} must be a number like 24, 1.75, or 1 3/4.`,
    };
  }

  if (/\/0+$/.test(raw)) {
    return { ok: false, value: 0, error: `${label} has a fraction over zero — check the bottom number.` };
  }

  const value = parseFraction(raw);
  if (!Number.isFinite(value)) {
    return { ok: false, value: 0, error: `${label} isn't a valid measurement.` };
  }
  if (!allowZero && value <= 0) {
    return { ok: false, value: 0, error: `${label} must be greater than zero.` };
  }

  return { ok: true, value, error: null };
}

/**
 * Validate a whole-piece count.
 */
export function validateQty(qty, { label = 'Quantity' } = {}) {
  const n = Number(qty);
  if (qty === '' || qty === null || qty === undefined || Number.isNaN(n)) {
    return { ok: false, value: 0, error: `${label} is required.` };
  }
  if (!Number.isFinite(n)) return { ok: false, value: 0, error: `${label} isn't a valid number.` };
  if (!Number.isInteger(n)) return { ok: false, value: 0, error: `${label} must be a whole number.` };
  if (n < 1) return { ok: false, value: 0, error: `${label} must be at least 1.` };
  return { ok: true, value: n, error: null };
}

/**
 * Format a measurement for display, without a unit mark.
 *
 * The caller owns the inch mark. The previous per-solver copies of this
 * appended `"` on some branches and not others, while every template appended
 * one too, so the same sheet showed `12""` next to `0.250"`.
 *
 * Resolves to 32nds where the value lands cleanly — 0.46875 reads as "15/32",
 * which is what's written on the plywood — and falls back to three decimals
 * only for values that aren't a usable fraction.
 */
export function formatInches(val) {
  const n = Number(val)
  if (!Number.isFinite(n)) return '?'
  if (n === 0) return '0'

  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const whole = Math.floor(abs)
  const remainder = abs - whole
  const thirtySeconds = remainder * 32

  // Not a clean 32nd — show the decimal rather than lie about the fraction.
  if (Math.abs(thirtySeconds - Math.round(thirtySeconds)) > 1e-6) {
    return sign + abs.toFixed(3)
  }

  let numerator = Math.round(thirtySeconds)
  let carriedWhole = whole
  if (numerator === 32) { carriedWhole += 1; numerator = 0 }
  if (numerator === 0) return sign + String(carriedWhole)

  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
  const g = gcd(numerator, 32)
  const frac = `${numerator / g}/${32 / g}`
  return sign + (carriedWhole > 0 ? `${carriedWhole} ${frac}` : frac)
}

/**
 * Format decimal inches to a readable fraction string
 * e.g. 1.75 → "1 3/4", 0.75 → "3/4", 2.0 → "2"
 */
export function formatFraction(decimal, denominator = 16) {
  const n = Number(decimal);
  if (!Number.isFinite(n)) return '0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  const whole = Math.floor(abs);
  const remainder = abs - whole;
  const numerator = Math.round(remainder * denominator);

  if (numerator === 0) return sign + whole.toString();
  if (numerator === denominator) return sign + (whole + 1).toString();

  // Reduce fraction
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(numerator, denominator);
  const fracStr = `${numerator / g}/${denominator / g}`;
  return sign + (whole > 0 ? `${whole} ${fracStr}` : fracStr);
}
