<template>
  <section class="bg-surface border border-border rounded-lg overflow-hidden">
    <!-- Section header -->
    <div class="px-5 py-3 border-b border-border bg-surface-alt flex items-center justify-between gap-3">
      <h2 class="font-semibold text-text-primary m-0">Required parts</h2>
      <span class="text-xs text-text-muted">Finished sizes</span>
    </div>

    <div v-if="!store.parts.length" class="px-5 py-8 text-center">
      <p class="m-0 text-sm text-text-secondary">No parts yet.</p>
      <p class="mt-1 mb-4 text-xs text-text-muted">
        List what you're building — the sizes each piece must be when it's done.
      </p>
      <button
        @click="store.addPart()"
        class="inline-flex items-center gap-2 min-h-[44px] px-5 rounded border border-border bg-surface text-sm font-medium hover:bg-surface-alt transition-colors"
      >
        <Icon name="plus" size="1em" />
        Add your first part
      </button>
    </div>

    <template v-else>
      <!-- ── Mobile cards ────────────────────────────────────────────── -->
      <div class="sm:hidden space-y-3 px-4 pb-4 pt-4">
        <div
          v-for="part in store.parts"
          :key="part.id"
          class="border border-border rounded-lg p-3 bg-surface space-y-3"
        >
          <div class="flex items-center gap-2">
            <DimensionInput
              v-model="part.label"
              :id="`m-${part.id}-label`"
              :aria-label="`Name for ${rowName(part)}`"
              placeholder="Part name"
            />
            <button
              @click="store.removePart(part.id)"
              class="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded text-text-muted hover:text-danger hover:bg-danger-bg/50 transition-colors"
              :aria-label="`Remove ${rowName(part)}`"
            >
              <Icon name="close" size="1.1em" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :for="`m-${part.id}-qty`" class="block text-xs text-text-muted mb-1">Qty</label>
              <DimensionInput
                v-model="part.qty"
                :id="`m-${part.id}-qty`"
                type="number"
                :aria-label="`Quantity of ${rowName(part)}`"
                :error="store.issueFor(part.id, 'qty')"
              />
            </div>
            <div class="flex items-end justify-between text-xs text-text-muted pb-2">
              <span>Board feet</span>
              <span class="font-medium text-text-primary font-mono">{{ boardFeet(part) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div v-for="f in DIMENSIONS" :key="f.key">
              <label :for="`m-${part.id}-${f.key}`" class="block text-xs text-text-muted mb-1">{{ f.short }}</label>
              <DimensionInput
                v-model="part[f.key]"
                :id="`m-${part.id}-${f.key}`"
                :aria-label="`${f.label} of ${rowName(part)}, in inches`"
                :placeholder="f.placeholder"
                :error="store.issueFor(part.id, f.key)"
              />
            </div>
          </div>
        </div>

        <div class="text-xs text-text-muted text-right pt-1">
          Total: <span class="font-semibold text-text-primary font-mono">{{ totalBoardFeet }} bd ft</span>
        </div>

        <button
          @click="store.addPart()"
          class="w-full inline-flex items-center justify-center gap-2 min-h-[44px] border border-dashed border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
        >
          <Icon name="plus" size="1em" />
          Add part
        </button>
      </div>

      <!-- ── Desktop table ───────────────────────────────────────────── -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-sm">
          <caption class="sr-only">Required parts, at finished dimensions</caption>
          <thead>
            <tr class="border-b border-border text-text-muted text-xs uppercase tracking-wide">
              <th scope="col" class="px-4 py-2 text-left font-medium min-w-[9rem]">Label</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-24">Qty</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-32">Length (in)</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-32">Width (in)</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-32">Thickness (in)</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-20">Bd ft</th>
              <th scope="col" class="px-3 py-2 w-14"><span class="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(part, i) in store.parts"
              :key="part.id"
              :class="i % 2 === 1 ? 'bg-surface-alt/60' : ''"
              class="border-b border-border/60 last:border-0"
            >
              <td class="px-4 py-1.5">
                <DimensionInput
                  v-model="part.label"
                  :id="`${part.id}-label`"
                  :aria-label="`Name for ${rowName(part)}`"
                  placeholder="Part name"
                />
              </td>
              <td class="px-3 py-1.5">
                <DimensionInput
                  v-model="part.qty"
                  :id="`${part.id}-qty`"
                  type="number"
                  align="center"
                  :aria-label="`Quantity of ${rowName(part)}`"
                  :error="store.issueFor(part.id, 'qty')"
                />
              </td>
              <td v-for="f in DIMENSIONS" :key="f.key" class="px-3 py-1.5">
                <DimensionInput
                  v-model="part[f.key]"
                  :id="`${part.id}-${f.key}`"
                  align="center"
                  :aria-label="`${f.label} of ${rowName(part)}, in inches`"
                  :placeholder="f.placeholder"
                  :error="store.issueFor(part.id, f.key)"
                />
              </td>
              <td class="px-3 py-1.5 text-center text-sm text-text-secondary font-mono">
                {{ boardFeet(part) }}
              </td>
              <td class="px-3 py-1.5 text-center">
                <button
                  @click="store.removePart(part.id)"
                  class="inline-flex items-center justify-center w-11 h-11 rounded text-text-muted hover:text-danger hover:bg-danger-bg/50 transition-colors"
                  :aria-label="`Remove ${rowName(part)}`"
                >
                  <Icon name="close" size="1em" />
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-border font-semibold bg-surface-alt/60">
              <td class="px-4 py-2 text-right text-sm text-text-secondary" colspan="5">Total</td>
              <td class="px-3 py-2 text-center text-sm text-text-primary font-bold font-mono">{{ totalBoardFeet }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="hidden sm:block px-5 py-3 border-t border-border bg-surface-alt/40">
        <button
          @click="store.addPart()"
          class="inline-flex items-center gap-1.5 min-h-[44px] px-2 -mx-2 text-sm text-text-primary font-medium hover:underline"
        >
          <Icon name="plus" size="1em" />
          Add part
        </button>
      </div>
    </template>

    <div class="px-5 pb-3 pt-3 text-xs text-text-secondary border-t border-border/60">
      These are <strong class="text-text-primary">finished dimensions</strong> — the size each part must be
      after all milling. The solver adds kerf and planing allowances for you.
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { parseFraction } from '@/utils/fractions'
import DimensionInput from '@/components/DimensionInput.vue'
import Icon from '@/components/Icon.vue'

const store = useProjectStore()

const DIMENSIONS = [
  { key: 'lengthStr',    label: 'Length',    short: 'Length"', placeholder: '28' },
  { key: 'widthStr',     label: 'Width',     short: 'Width"',  placeholder: '1 3/4' },
  { key: 'thicknessStr', label: 'Thickness', short: 'Thick"',  placeholder: '3/4' },
]

const rowName = (part) => String(part.label || '').trim() || 'this part'

function bf(row) {
  const v = parseFraction(row.lengthStr) * parseFraction(row.widthStr) *
    parseFraction(row.thicknessStr) * (Number(row.qty) || 0) / 144
  return Number.isFinite(v) ? v : 0
}

const boardFeet = (row) => (bf(row) > 0 ? bf(row).toFixed(2) : '—')

const totalBoardFeet = computed(() => {
  const total = store.parts.reduce((sum, p) => sum + bf(p), 0)
  return total > 0 ? total.toFixed(2) : '—'
})
</script>
