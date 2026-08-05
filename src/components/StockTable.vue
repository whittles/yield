<template>
  <section class="bg-surface border border-border rounded-lg overflow-hidden">
    <!-- Section header -->
    <div class="px-5 py-3 border-b border-border bg-surface-alt flex items-center justify-between gap-3">
      <h2 class="font-semibold text-text-primary m-0">Stock boards</h2>
      <span class="text-xs text-text-muted">The lumber you have</span>
    </div>

    <!-- Nothing to work with yet: say what to do, don't show naked headers. -->
    <div v-if="!store.stock.length" class="px-5 py-8 text-center">
      <p class="m-0 text-sm text-text-secondary">No boards yet.</p>
      <p class="mt-1 mb-4 text-xs text-text-muted">
        Add the lumber you have on hand — rough or milled, one row per size.
      </p>
      <button
        @click="store.addStock()"
        class="inline-flex items-center gap-2 min-h-[44px] px-5 rounded border border-border bg-surface text-sm font-medium hover:bg-surface-alt transition-colors"
      >
        <Icon name="plus" size="1em" />
        Add your first board
      </button>
    </div>

    <template v-else>
      <!-- ── Mobile cards ────────────────────────────────────────────── -->
      <div class="sm:hidden space-y-3 px-4 pb-4 pt-4">
        <div
          v-for="board in store.stock"
          :key="board.id"
          class="border border-border rounded-lg p-3 bg-surface space-y-3"
        >
          <div class="flex items-center gap-2">
            <DimensionInput
              v-model="board.label"
              :id="`m-${board.id}-label`"
              :aria-label="`Name for ${rowName(board)}`"
              placeholder="Board name"
            />
            <button
              @click="store.removeStock(board.id)"
              class="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded text-text-muted hover:text-danger hover:bg-danger-bg/50 transition-colors"
              :aria-label="`Remove ${rowName(board)}`"
            >
              <Icon name="close" size="1.1em" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :for="`m-${board.id}-qty`" class="block text-xs text-text-muted mb-1">Qty</label>
              <DimensionInput
                v-model="board.qty"
                :id="`m-${board.id}-qty`"
                type="number"
                :aria-label="`Quantity of ${rowName(board)}`"
                :error="store.issueFor(board.id, 'qty')"
              />
            </div>
            <div>
              <label :for="`m-${board.id}-cond`" class="block text-xs text-text-muted mb-1">Condition</label>
              <select
                :id="`m-${board.id}-cond`"
                v-model="board.condition"
                class="w-full min-h-[40px] border border-border rounded px-2 text-sm bg-surface text-text-primary"
              >
                <option v-for="c in CONDITIONS" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div v-for="f in DIMENSIONS" :key="f.key">
              <label :for="`m-${board.id}-${f.key}`" class="block text-xs text-text-muted mb-1">{{ f.short }}</label>
              <DimensionInput
                v-model="board[f.key]"
                :id="`m-${board.id}-${f.key}`"
                :aria-label="`${f.label} of ${rowName(board)}, in inches`"
                :placeholder="f.placeholder"
                :error="store.issueFor(board.id, f.key)"
              />
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-text-muted">
            <span>Board feet</span>
            <span class="font-medium text-text-primary font-mono">{{ boardFeet(board) }}</span>
          </div>
        </div>

        <div class="text-xs text-text-muted text-right pt-1">
          Total: <span class="font-semibold text-text-primary font-mono">{{ totalBoardFeet }} bd ft</span>
        </div>

        <button
          @click="store.addStock()"
          class="w-full inline-flex items-center justify-center gap-2 min-h-[44px] border border-dashed border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
        >
          <Icon name="plus" size="1em" />
          Add board
        </button>
      </div>

      <!-- ── Desktop table ───────────────────────────────────────────── -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-sm">
          <caption class="sr-only">Stock boards, with dimensions and board feet</caption>
          <thead>
            <tr class="border-b border-border text-text-muted text-xs uppercase tracking-wide">
              <th scope="col" class="px-4 py-2 text-left font-medium min-w-[9rem]">Label</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-24">Qty</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-32">Length (in)</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-32">Width (in)</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-32">Thickness (in)</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-20">Bd ft</th>
              <th scope="col" class="px-3 py-2 text-center font-medium w-40">Condition</th>
              <th scope="col" class="px-3 py-2 w-14"><span class="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(board, i) in store.stock"
              :key="board.id"
              :class="i % 2 === 1 ? 'bg-surface-alt/60' : ''"
              class="border-b border-border/60 last:border-0"
            >
              <td class="px-4 py-1.5">
                <DimensionInput
                  v-model="board.label"
                  :id="`${board.id}-label`"
                  :aria-label="`Name for ${rowName(board)}`"
                  placeholder="Board name"
                />
              </td>
              <td class="px-3 py-1.5">
                <DimensionInput
                  v-model="board.qty"
                  :id="`${board.id}-qty`"
                  type="number"
                  align="center"
                  :aria-label="`Quantity of ${rowName(board)}`"
                  :error="store.issueFor(board.id, 'qty')"
                />
              </td>
              <td v-for="f in DIMENSIONS" :key="f.key" class="px-3 py-1.5">
                <DimensionInput
                  v-model="board[f.key]"
                  :id="`${board.id}-${f.key}`"
                  align="center"
                  :aria-label="`${f.label} of ${rowName(board)}, in inches`"
                  :placeholder="f.placeholder"
                  :error="store.issueFor(board.id, f.key)"
                />
              </td>
              <td class="px-3 py-1.5 text-center text-sm text-text-secondary font-mono">
                {{ boardFeet(board) }}
              </td>
              <td class="px-3 py-1.5">
                <select
                  v-model="board.condition"
                  :aria-label="`Surface condition of ${rowName(board)}`"
                  class="w-full min-h-[36px] border border-border rounded px-2 text-sm bg-surface text-text-primary hover:border-text-muted transition-colors"
                >
                  <option v-for="c in CONDITIONS" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </td>
              <td class="px-3 py-1.5 text-center">
                <button
                  @click="store.removeStock(board.id)"
                  class="inline-flex items-center justify-center w-11 h-11 rounded text-text-muted hover:text-danger hover:bg-danger-bg/50 transition-colors"
                  :aria-label="`Remove ${rowName(board)}`"
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
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="hidden sm:block px-5 py-3 border-t border-border bg-surface-alt/40">
        <button
          @click="store.addStock()"
          class="inline-flex items-center gap-1.5 min-h-[44px] px-2 -mx-2 text-sm text-text-primary font-medium hover:underline"
        >
          <Icon name="plus" size="1em" />
          Add board
        </button>
      </div>
    </template>

    <div class="px-5 pb-3 pt-3 text-xs text-text-secondary border-t border-border/60">
      Dimensions accept fractions —
      <code class="bg-surface-alt px-1 rounded">1 3/4</code> — or decimals —
      <code class="bg-surface-alt px-1 rounded">1.75</code>.
      Length and width are nominal, before milling.
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
  { key: 'lengthStr',    label: 'Length',    short: 'Length"', placeholder: '96' },
  { key: 'widthStr',     label: 'Width',     short: 'Width"',  placeholder: '8' },
  { key: 'thicknessStr', label: 'Thickness', short: 'Thick"',  placeholder: '1 1/2' },
]

const CONDITIONS = [
  { value: 'rough',       label: 'Rough' },
  { value: 'skip-planed', label: 'Skip planed' },
  { value: 's3s',         label: 'S3S' },
  { value: 's4s',         label: 'S4S' },
]

const rowName = (board) => String(board.label || '').trim() || 'this board'

function bf(row) {
  const v = parseFraction(row.lengthStr) * parseFraction(row.widthStr) *
    parseFraction(row.thicknessStr) * (Number(row.qty) || 0) / 144
  return Number.isFinite(v) ? v : 0
}

const boardFeet = (row) => (bf(row) > 0 ? bf(row).toFixed(2) : '—')

const totalBoardFeet = computed(() => {
  const total = store.stock.reduce((sum, b) => sum + bf(b), 0)
  return total > 0 ? total.toFixed(2) : '—'
})
</script>
