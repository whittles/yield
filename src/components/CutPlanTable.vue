<template>
  <div class="px-5 pb-4">
    <h3 class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Cut instructions</h3>

    <!-- Resaw is a setup change for the whole board, not a per-part step. -->
    <p
      v-if="result.stockPiece.resawnFrom"
      class="mb-3 rounded border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning print-no-break"
    >
      <strong>Resaw first.</strong>
      Set bandsaw fence to <strong>{{ fmt(result.stockPiece.resawFenceAt) }}"</strong>
      ({{ fmt(result.stockPiece.resawFenceAt - faceAllowance) }}" part + {{ fmt(faceAllowance) }}" face allowance).
      Plane the resawn face to clean up.
      Yields {{ result.stockPiece.resawTotalSlabs }} slabs from {{ result.stockPiece.resawnFromLabel }}.
    </p>

    <!-- ── Desktop / print table ──────────────────────────────────────── -->
    <table class="w-full text-sm hidden sm:table">
      <caption class="sr-only">
        Cut instructions for {{ result.stockPiece.label }}, in cut order.
      </caption>
      <thead style="display: table-header-group">
        <tr class="text-xs text-text-muted uppercase tracking-wide border-b border-border">
          <th scope="col" class="text-center py-1 pr-2 font-medium w-8 print-tick-col">Done</th>
          <th scope="col" class="text-left py-1 pr-2 font-medium w-8">#</th>
          <th scope="col" class="text-left py-1 pr-4 font-medium w-32">Part</th>
          <th scope="col" class="text-left py-1 pr-4 font-medium">Steps</th>
          <th scope="col" class="text-right py-1 font-medium">Final size</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(cut, i) in result.cuts"
          :key="`${cut.partId}-${i}`"
          :class="['border-b border-border/40 last:border-0 print-no-break', i % 2 === 1 ? 'bg-surface-alt/50' : '']"
        >
          <td class="py-2 pr-2 text-center align-top">
            <span class="print-tick" aria-hidden="true"></span>
          </td>
          <td class="py-2 pr-2 align-top">
            <span
              class="inline-flex items-center justify-center w-5 h-5 rounded-sm border border-[#6f6350] text-[10px] font-semibold text-[#241f16]"
              :style="{ backgroundColor: colorFor(cut.partLabel) }"
            >{{ i + 1 }}</span>
          </td>
          <td class="py-2 pr-4 font-medium text-text-primary align-top">{{ cut.partLabel }}</td>
          <td class="py-2 pr-4 text-text-secondary align-top">
            <span v-if="!hasSteps(cut)" class="italic">Use as-is — no cuts needed</span>
            <ol v-else class="list-decimal list-inside space-y-0.5 m-0">
              <li v-if="cut.needsResaw">
                Resaw to <strong>{{ fmt(cut.cutThickness + planingAllowance * 2) }}"</strong>
                → plane to <strong>{{ fmt(cut.cutThickness) }}"</strong>
              </li>
              <li v-if="cut.needsRip">Rip to <strong>{{ fmt(cut.cutWidth) }}"</strong></li>
              <li v-if="cut.needsCrosscut">Crosscut to <strong>{{ fmt(cut.cutLength) }}"</strong></li>
            </ol>
          </td>
          <!-- The number you actually cut to. It was the faintest text on the
               sheet; it is now the heaviest cell in the row. -->
          <td class="py-2 text-right align-top whitespace-nowrap">
            <span class="font-mono text-sm font-semibold text-text-primary print-dimension">
              {{ fmt(cut.cutLength) }}" × {{ fmt(cut.cutWidth) }}" × {{ fmt(cut.cutThickness) }}"
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ── Mobile cards ───────────────────────────────────────────────── -->
    <!-- This table had no responsive treatment at all, unlike its siblings,
         so on a phone the Steps column wrapped to five lines a step and the
         dimension ran off the card. -->
    <ul class="sm:hidden no-print list-none p-0 m-0 space-y-2">
      <li
        v-for="(cut, i) in result.cuts"
        :key="`m-${cut.partId}-${i}`"
        class="rounded border border-border bg-surface p-3"
      >
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center justify-center w-6 h-6 rounded-sm border border-[#6f6350] text-[11px] font-semibold text-[#241f16] shrink-0"
            :style="{ backgroundColor: colorFor(cut.partLabel) }"
          >{{ i + 1 }}</span>
          <span class="font-medium text-text-primary">{{ cut.partLabel }}</span>
        </div>

        <p class="mt-2 mb-0 font-mono text-base font-bold text-text-primary">
          {{ fmt(cut.cutLength) }}" × {{ fmt(cut.cutWidth) }}" × {{ fmt(cut.cutThickness) }}"
        </p>
        <p class="mt-0.5 mb-0 text-xs text-text-muted">length × width × thickness</p>

        <div class="mt-2 text-sm text-text-secondary">
          <span v-if="!hasSteps(cut)" class="italic">Use as-is — no cuts needed</span>
          <ol v-else class="list-decimal list-inside space-y-0.5 m-0">
            <li v-if="cut.needsResaw">
              Resaw to <strong>{{ fmt(cut.cutThickness + planingAllowance * 2) }}"</strong>
              → plane to <strong>{{ fmt(cut.cutThickness) }}"</strong>
            </li>
            <li v-if="cut.needsRip">Rip to <strong>{{ fmt(cut.cutWidth) }}"</strong></li>
            <li v-if="cut.needsCrosscut">Crosscut to <strong>{{ fmt(cut.cutLength) }}"</strong></li>
          </ol>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useProjectStore } from '@/stores/project'
import { formatInches } from '@/utils/fractions'
import { colorForPart as colorFor } from '@/utils/partColors'

defineProps({ result: { type: Object, required: true } })

const store = useProjectStore()
const fmt = formatInches
const planingAllowance = store.settings.planingAllowance
const faceAllowance = store.settings.resawFaceAllowance ?? 0.0625

const hasSteps = (cut) => cut.needsResaw || cut.needsRip || cut.needsCrosscut
</script>
