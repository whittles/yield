<template>
  <figure class="m-0">
    <figcaption class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1.5">
      <span class="text-xs text-text-secondary">
        Board plan — length × width, viewed from the face. Grain runs left to right.
      </span>
      <span class="text-xs text-text-muted font-mono">
        {{ fmt(board.usableLength) }}" × {{ fmt(board.usableWidth) }}" usable
      </span>
    </figcaption>

    <!-- A 96" × 8" board really is a 12:1 strip; the diagram keeps that
         proportion rather than squashing it to fit a fixed height. On narrow
         screens it scrolls instead of shrinking to an illegible sliver. -->
    <div class="overflow-x-auto">
      <svg
        :viewBox="`0 0 ${SVG_W} ${totalH}`"
        class="block rounded border border-border bg-[#faf8f4]"
        :style="{ width: '100%', minWidth: `${MIN_RENDER_W}px`, height: 'auto' }"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        :aria-labelledby="`${uid}-t ${uid}-d`"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title :id="`${uid}-t`">{{ accessibleTitle }}</title>
        <desc :id="`${uid}-d`">{{ accessibleDescription }}</desc>

        <defs>
          <!-- Waste is drawn only where waste actually is, so it can be
               pointed at and measured, rather than as a wash under the parts. -->
          <pattern :id="`${uid}-hatch`" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#efece4" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="#cfc7b5" stroke-width="1.25" />
          </pattern>
          <clipPath :id="`${uid}-clip`">
            <rect x="0" :y="RULER_H" :width="SVG_W" :height="boardH" />
          </clipPath>
        </defs>

        <!-- Scale ruler: one tick per foot, so the drawing can be checked
             against a tape measure. -->
        <g :aria-hidden="true" font-family="Assistant, sans-serif">
          <line x1="0" :y1="RULER_H - 0.5" :x2="SVG_W" :y2="RULER_H - 0.5" stroke="#d8d2c4" stroke-width="1" />
          <g v-for="tick in ruler" :key="`r${tick.inches}`">
            <line :x1="tick.x" :y1="RULER_H - 5" :x2="tick.x" :y2="RULER_H - 0.5" stroke="#b3ab99" stroke-width="1" />
            <text :x="tick.x + 2" :y="RULER_H - 7" font-size="7.5" fill="#8a8271">{{ tick.inches }}"</text>
          </g>
        </g>

        <g :clip-path="`url(#${uid}-clip)`">
          <!-- Board face -->
          <rect x="0" :y="RULER_H" :width="SVG_W" :height="boardH" fill="#f0e5cd" />

          <!-- Grain. The solver already refuses to rotate parts in order to
               keep grain consistent; until now the UI never showed which way
               it runs, which is the first thing you check against real stock. -->
          <g :aria-hidden="true" stroke="#d8c39a" fill="none" stroke-linecap="round">
            <path
              v-for="(d, i) in grainLines"
              :key="`g${i}`"
              :d="d"
              :stroke-width="i % 3 === 0 ? 1.1 : 0.6"
              :stroke-opacity="i % 3 === 0 ? 0.85 : 0.55"
            />
          </g>

          <!-- Waste regions -->
          <g>
            <rect
              v-for="(w, i) in wasteRects"
              :key="`w${i}`"
              :x="w.x" :y="w.y" :width="w.w" :height="w.h"
              :fill="`url(#${uid}-hatch)`"
            />
            <!-- Anything big enough to be worth racking gets named. -->
            <g v-for="(w, i) in keepableOffcuts" :key="`k${i}`">
              <rect :x="w.x" :y="w.y" :width="w.w" :height="w.h" fill="none" stroke="#a89878" stroke-width="1" stroke-dasharray="3 2" />
              <text
                v-if="w.w > 54 && w.h > 15"
                :x="w.x + w.w / 2" :y="w.y + w.h / 2"
                text-anchor="middle" dominant-baseline="middle"
                font-size="8.5" font-family="Assistant, sans-serif" fill="#7a6f57"
              >keep {{ fmt(w.realW) }}" × {{ fmt(w.realH) }}"</text>
            </g>
          </g>

          <!-- Parts -->
          <g v-for="sc in scaledCuts" :key="sc.key">
            <rect
              :x="sc.x" :y="sc.y" :width="sc.w" :height="sc.h"
              :fill="sc.fill"
              stroke="#6f6350"
              stroke-width="0.75"
            />
            <text
              v-if="sc.w > 22 && sc.h > 14"
              :x="sc.x + sc.w / 2" :y="sc.y + sc.h / 2"
              text-anchor="middle" dominant-baseline="middle"
              font-size="9.5" font-family="Assistant, sans-serif"
              fill="#241f16" font-weight="600"
            >{{ sc.number }}</text>
          </g>
        </g>

        <!-- Board edge -->
        <rect x="0.5" :y="RULER_H + 0.5" :width="SVG_W - 1" :height="boardH - 1" fill="none" stroke="#8a7f68" stroke-width="1.25" />
      </svg>
    </div>

    <!-- The numbers on the drawing resolve here. Colour is never the only
         carrier: every part is findable by its number alone. -->
    <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 list-none p-0 m-0 text-xs">
      <li v-for="sc in legend" :key="sc.key" class="flex items-center gap-1.5">
        <span
          class="inline-flex items-center justify-center w-4 h-4 rounded-sm border border-[#6f6350] text-[9px] font-semibold text-[#241f16]"
          :style="{ backgroundColor: sc.fill }"
          aria-hidden="true"
        >{{ sc.number }}</span>
        <span class="text-text-secondary">{{ sc.label }}</span>
        <span class="text-text-muted font-mono">{{ fmt(sc.realW) }}" × {{ fmt(sc.realH) }}"</span>
      </li>
      <li v-if="keepableOffcuts.length" class="flex items-center gap-1.5">
        <span class="inline-block w-4 h-4 rounded-sm border border-dashed border-[#a89878] bg-[#efece4]" aria-hidden="true"></span>
        <span class="text-text-secondary">Usable offcut</span>
      </li>
    </ul>
  </figure>
</template>

<script setup>
import { computed, useId } from 'vue'
import { formatInches } from '@/utils/fractions'
import { freeRegions, keepableOffcuts as keepable } from '@/utils/offcuts'
import { colorForPart as colorFor } from '@/utils/partColors'

const props = defineProps({
  result: { type: Object, required: true },
})

const uid = useId()
const fmt = formatInches

const SVG_W = 600
const RULER_H = 12
const MIN_RENDER_W = 520

const board = computed(() => props.result.stockPiece ?? {})

const boardH = computed(() => {
  const b = board.value
  if (!b.usableLength || !b.usableWidth) return 48
  // True proportion. This used to be clamped to 140px while the y-scale was
  // derived from the clamped value, so any board wider than ~0.23 × its
  // length was drawn out of proportion with no indication.
  return Math.max(20, (SVG_W * b.usableWidth) / b.usableLength)
})

const totalH = computed(() => boardH.value + RULER_H)
const scaleX = computed(() => (board.value.usableLength ? SVG_W / board.value.usableLength : 1))
const scaleY = computed(() => (board.value.usableWidth ? boardH.value / board.value.usableWidth : 1))

const scaledCuts = computed(() =>
  (props.result.cuts ?? []).map((cut, i) => ({
    key: `${cut.partLabel}-${i}`,
    number: i + 1,
    label: cut.partLabel,
    fill: colorFor(cut.partLabel),
    realW: cut.cutLength,
    realH: cut.cutWidth,
    x: cut.xOffset * scaleX.value,
    y: RULER_H + cut.yOffset * scaleY.value,
    w: Math.max(1.5, cut.cutLength * scaleX.value),
    h: Math.max(1.5, cut.cutWidth * scaleY.value),
  })),
)

const legend = computed(() => scaledCuts.value)

const ruler = computed(() => {
  const len = board.value.usableLength || 0
  if (!len) return []
  // Aim for roughly one label per 60px so it never crowds.
  const rough = len / (SVG_W / 60)
  const step = [1, 2, 3, 6, 12, 24, 36, 48].find(s => s >= rough) ?? 48
  const out = []
  for (let inches = 0; inches <= len + 1e-6; inches += step) {
    out.push({ inches: Math.round(inches), x: inches * scaleX.value })
  }
  return out
})

const grainLines = computed(() => {
  const h = boardH.value
  const rows = Math.max(4, Math.round(h / 6))
  const lines = []
  for (let i = 1; i < rows; i++) {
    const y = RULER_H + (h * i) / rows
    // Gentle, non-uniform undulation so it reads as figure rather than rule.
    const a = 1.1 + ((i * 7) % 5) * 0.35
    const q = SVG_W / 6
    let d = `M0 ${y.toFixed(2)}`
    for (let s = 0; s < 6; s++) {
      const dir = s % 2 === 0 ? -a : a
      d += ` q ${(q / 2).toFixed(2)} ${dir.toFixed(2)} ${q.toFixed(2)} 0`
    }
    lines.push(d)
  }
  return lines
})

const wasteRects = computed(() =>
  freeRegions(board.value, props.result.cuts ?? []).map(r => ({
    x: r.x0 * scaleX.value,
    y: RULER_H + r.y0 * scaleY.value,
    w: Math.max(0.5, (r.x1 - r.x0) * scaleX.value),
    h: Math.max(0.5, (r.y1 - r.y0) * scaleY.value),
  })),
)

const keepableOffcuts = computed(() =>
  keepable(board.value, props.result.cuts ?? [], 3).map(r => ({
    x: r.x0 * scaleX.value,
    y: RULER_H + r.y0 * scaleY.value,
    w: r.length * scaleX.value,
    h: r.width * scaleY.value,
    realW: r.length,
    realH: r.width,
  })),
)

const accessibleTitle = computed(() => {
  const b = board.value
  const n = (props.result.cuts ?? []).length
  return `Cut layout for ${b.label || 'board'}: ${n} ${n === 1 ? 'part' : 'parts'} on a ${fmt(b.usableLength)} by ${fmt(b.usableWidth)} inch usable face.`
})

const accessibleDescription = computed(() => {
  const parts = scaledCuts.value
    .map(c => `${c.number}. ${c.label}, ${fmt(c.realW)} by ${fmt(c.realH)} inches`)
    .join('. ')
  const keep = keepableOffcuts.value
    .map(k => `${fmt(k.realW)} by ${fmt(k.realH)} inches`)
    .join(', ')
  const tail = keep ? ` Usable offcuts: ${keep}.` : ' No offcuts large enough to keep.'
  return `Grain runs along the length. Parts in cut order: ${parts}.${tail}`
})
</script>
