/**
 * Colour for a part, keyed on its label.
 *
 * The diagram used to index the palette by cut order, so the two pieces both
 * called "Rail" came out different colours while unrelated parts could share
 * one. Colour that doesn't track identity is worse than no colour, especially
 * on a drawing you cut from. Keying on the label makes the numbered chip in
 * the cut table and the numbered rectangle in the diagram agree.
 *
 * Muted timber tones, chosen to stay legible under a dark numeral and to
 * survive a mono laser as distinguishable greys.
 */
export const PART_COLORS = [
  '#c9b183', '#a9bfa2', '#a7b6c9', '#cbb0a1',
  '#b9c2a0', '#c3a9b6', '#a6c1bd', '#d0c3a0',
]

export function colorForPart(label) {
  const key = String(label ?? '')
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return PART_COLORS[hash % PART_COLORS.length]
}
