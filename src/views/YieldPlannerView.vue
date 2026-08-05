<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

    <!-- ── Page heading ─────────────────────────────────────────────────── -->
    <header class="no-print">
      <h1 class="text-2xl font-bold text-text-primary m-0">Yield Planner</h1>
      <p class="mt-1 mb-0 text-sm text-text-secondary">
        Assign your parts to the boards you have, and get a cut plan you can take to the saw.
      </p>
      <div class="mt-3">
        <label for="project-name" class="block text-xs text-text-muted mb-1">Project name <span class="text-text-muted">(optional)</span></label>
        <input
          id="project-name"
          v-model="store.projectName"
          type="text"
          placeholder="Workbench, kitchen drawers…"
          class="w-full sm:max-w-xs h-11 px-3 border border-border rounded bg-surface text-sm"
        />
      </div>
    </header>

    <!-- Stock Boards -->
    <div class="no-print">
      <StockTable />
    </div>

    <!-- Required Parts -->
    <div class="no-print">
      <PartsTable />
    </div>

    <!-- Settings (collapsible) -->
    <div class="no-print">
      <Settings />
    </div>

    <!-- ── Blocking validation panel ────────────────────────────────────── -->
    <!-- Invalid values used to parse to zero and quietly drop the row from
         both the plan and the "parts placed" denominator. Now nothing solves
         until the numbers are real. -->
    <div
      v-if="store.allIssues.length"
      class="no-print bg-danger-bg border border-danger/30 rounded-lg p-4"
      role="alert"
    >
      <h2 class="flex items-center gap-2 text-sm font-semibold text-danger m-0 mb-2">
        <Icon name="alert" size="1em" />
        Fix {{ store.allIssues.length }} {{ store.allIssues.length === 1 ? 'field' : 'fields' }} before calculating
      </h2>
      <ul class="list-disc pl-5 m-0 space-y-1 text-sm text-danger">
        <li v-for="(issue, i) in store.allIssues" :key="i">
          <span class="font-semibold">{{ issue.name }}</span> — {{ issue.message }}
        </li>
      </ul>
    </div>

    <!-- ── Calculate ────────────────────────────────────────────────────── -->
    <div class="no-print flex flex-col items-center gap-2 pt-2">
      <button
        @click="handleCalculate"
        :disabled="!canCalculate"
        class="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-accent text-white font-semibold text-base rounded
               hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed
               transition-colors shadow-sm"
      >
        Calculate Cut Plan
      </button>
      <!-- A disabled control that won't say why is a dead end. -->
      <p v-if="blockedReason" class="m-0 text-sm text-text-secondary text-center">{{ blockedReason }}</p>
    </div>

    <!-- Screen-reader announcement for a result that appears below the fold. -->
    <p aria-live="polite" class="sr-only">{{ liveMessage }}</p>

    <!-- ── Results ──────────────────────────────────────────────────────── -->
    <template v-if="store.results">

      <!-- Print header: identity, date, version, project. Short by design so
           the first board sheet shares this page instead of being pushed to
           page 2 behind the accounting tables. -->
      <div class="print-only print-no-break mb-4">
        <div style="display:flex; align-items:center; gap:12pt; border-bottom:2px solid #333; padding-bottom:8pt;">
          <img src="/logo.png" style="width:36pt; height:36pt; object-fit:contain;" alt=""/>
          <div>
            <div style="font-size:13pt; font-weight:700; letter-spacing:0.5pt;">ALTHOFF WOODSHOP</div>
            <div style="font-size:10pt; color:#555;">
              Yield Planner — Cut Sheet<template v-if="store.projectName"> · {{ store.projectName }}</template>
            </div>
          </div>
          <div style="margin-left:auto; text-align:right; font-size:9pt; color:#555;">
            <div>{{ printDate }}</div>
            <div>v{{ version }}</div>
          </div>
        </div>
        <div style="font-size:8.5pt; color:#666; font-style:italic; margin-top:4pt;">
          Beta: this plan is generated algorithmically. Check every dimension against your stock before cutting.
        </div>
      </div>

      <div ref="resultsAnchor" class="no-print-border border-t border-border pt-6 space-y-6">

        <!-- Stale banner: a plan that no longer matches its inputs still looks
             authoritative, which is the dangerous failure mode here. -->
        <div
          v-if="store.resultsStale"
          class="no-print bg-warning-bg border border-warning/40 rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2"
          role="status"
        >
          <Icon name="alert" size="1.05em" class="text-warning" />
          <span class="text-sm text-warning font-medium">
            Inputs changed since this plan was calculated. The cut plan below is out of date.
          </span>
          <button
            @click="handleCalculate"
            class="ml-auto min-h-[40px] px-4 rounded border border-warning/50 text-sm font-semibold text-warning hover:bg-warning/10 transition-colors"
          >
            Recalculate
          </button>
        </div>

        <div class="no-print" :class="{ 'opacity-60': store.resultsStale }">
          <ResultsSummary :summary="store.results.summary" :boards="usedResults" />
        </div>

        <!-- Unresolved parts -->
        <div
          v-if="unresolvedGroups.length"
          class="bg-warning-bg border border-warning/30 rounded-lg p-4 print-no-break"
        >
          <h2 class="flex items-center gap-2 font-semibold text-warning m-0 mb-2 text-base">
            <Icon name="alert" size="1em" />
            {{ unresolvedCount }} {{ unresolvedCount === 1 ? 'part' : 'parts' }} could not be placed
          </h2>
          <ul class="text-sm space-y-1 list-none p-0 m-0">
            <li v-for="g in unresolvedGroups" :key="g.key" class="text-warning">
              <span class="font-semibold">{{ g.label }}</span>
              <span v-if="g.count > 1"> × {{ g.count }}</span>
              <span class="font-mono"> — {{ fmt(g.length) }}" × {{ fmt(g.width) }}" × {{ fmt(g.thickness) }}"</span>
              <span class="block text-xs">{{ g.reason }}</span>
            </li>
          </ul>
        </div>

        <!-- Per-board cut sheets. These lead the printout; the accounting
             tables follow at the end. -->
        <div
          v-for="(result, i) in usedResults"
          :key="result.stockPiece.id"
          :class="['bg-surface border border-border rounded-lg overflow-hidden', i > 0 ? 'print-break-before' : '']"
        >
          <div class="print-only print-no-break" style="font-size:11pt; font-weight:700; padding:6pt 0 4pt 0; border-bottom:1px solid #ccc; margin-bottom:4pt;">
            {{ result.stockPiece.label }} — {{ fmt(result.stockPiece.usableLength) }}" × {{ fmt(result.stockPiece.usableWidth) }}" × {{ fmt(result.stockPiece.usableThickness) }}" usable
          </div>

          <div class="no-print px-5 py-3 border-b border-border bg-surface-alt flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
            <div>
              <h2 class="font-semibold text-text-primary text-base m-0 inline">{{ result.stockPiece.label }}</h2>
              <span class="ml-2 text-sm text-text-secondary font-mono">
                {{ fmt(result.stockPiece.usableLength) }}" × {{ fmt(result.stockPiece.usableWidth) }}" × {{ fmt(result.stockPiece.usableThickness) }}"
              </span>
              <span class="text-xs text-text-muted italic ml-1">usable after conditioning</span>
              <div v-if="result.stockPiece.resawnFrom" class="text-xs mt-1 text-warning font-medium">
                Resawn from {{ result.stockPiece.resawnFromLabel }} — fence at {{ fmt(result.stockPiece.resawFenceAt) }}"
              </div>
            </div>
            <div class="text-sm font-medium whitespace-nowrap" :class="toneFor(result.utilization).text">
              {{ result.utilization }}% yield
              <span class="text-xs px-1.5 py-0.5 rounded ml-1" :class="toneFor(result.utilization).badge">
                {{ toneFor(result.utilization).label }}
              </span>
            </div>
          </div>

          <div class="no-print px-5 pt-3 pb-1">
            <div
              class="w-full h-2 bg-surface-alt rounded-full overflow-hidden"
              role="img"
              :aria-label="`${result.utilization}% of this board used`"
            >
              <div
                class="h-full rounded-full transition-all"
                :class="toneFor(result.utilization).bar"
                :style="{ width: result.utilization + '%' }"
              ></div>
            </div>
          </div>

          <div class="px-5 py-3">
            <CutDiagram :result="result" />
          </div>

          <CutPlanTable :result="result" />
        </div>

        <!-- Accounting. Useful for ordering lumber, useless at the saw, so it
             comes last on paper. -->
        <div class="print-break-before">
          <div class="print-only" style="font-size:12pt; font-weight:700; margin-bottom:6pt;">Materials summary</div>

          <div class="print-only" style="margin-bottom:8pt;">
            <div style="font-size:10pt; font-weight:600; margin-bottom:4pt;">Stock boards used</div>
            <table style="width:100%; border-collapse:collapse; font-size:10pt;">
              <thead>
                <tr style="background:#f0f0f0;">
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Board</th>
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Qty</th>
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Dimensions (L × W × T)</th>
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Condition</th>
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:right;">Board feet</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in usedStockEntries" :key="s.id">
                  <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ s.label }}</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt;">{{ s.qty }}</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace;">{{ s.lengthStr }}" × {{ s.widthStr }}" × {{ s.thicknessStr }}"</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt; text-transform:capitalize;">{{ s.condition }}</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt; text-align:right; font-family:monospace;">{{ stockBoardFeet(s) }}</td>
                </tr>
                <tr style="background:#f0f0f0; font-weight:bold;">
                  <td colspan="4" style="border:1px solid #ccc; padding:4pt 6pt; text-align:right;">Total</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt; text-align:right; font-family:monospace;">{{ totalStockBoardFeet }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="print-only">
            <div style="font-size:10pt; font-weight:600; margin-bottom:4pt;">Required parts</div>
            <table style="width:100%; border-collapse:collapse; font-size:10pt;">
              <thead>
                <tr style="background:#f0f0f0;">
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Part</th>
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Qty</th>
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Dimensions (L × W × T)</th>
                  <th scope="col" style="border:1px solid #ccc; padding:4pt 6pt; text-align:right;">Board feet</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in store.parts" :key="p.id">
                  <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ p.label }}</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt;">{{ p.qty }}</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace;">{{ p.lengthStr }}" × {{ p.widthStr }}" × {{ p.thicknessStr }}"</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt; text-align:right; font-family:monospace;">{{ partBoardFeet(p) }}</td>
                </tr>
                <tr style="background:#f0f0f0; font-weight:bold;">
                  <td colspan="3" style="border:1px solid #ccc; padding:4pt 6pt; text-align:right;">Total</td>
                  <td style="border:1px solid #ccc; padding:4pt 6pt; text-align:right; font-family:monospace;">{{ totalPartsBoardFeet }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="no-print flex flex-wrap gap-3 pt-2">
          <button
            @click="handleExport"
            class="inline-flex items-center gap-2 min-h-[44px] px-5 border border-border rounded text-sm font-medium hover:bg-surface-alt transition-colors"
          >
            <Icon name="download" size="1.05em" />
            Export JSON
          </button>
        </div>

      </div>
    </template>

    <!-- ── FAB: Print ───────────────────────────────────────────────────── -->
    <Teleport to="body">
      <button
        v-if="store.results"
        @click="printResults"
        class="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2
               bg-accent hover:bg-accent-hover active:bg-accent-hover
               text-white font-semibold min-h-[48px] px-5 rounded-full shadow-lg
               transition-colors text-sm"
      >
        <Icon name="printer" size="1.15em" />
        <span class="hidden sm:inline">Print sheet</span>
        <span class="sr-only sm:hidden">Print cut plan</span>
      </button>
    </Teleport>

  </div>

  <!-- Repeats at the bottom of every printed page. -->
  <div class="print-only print-footer">
    <span>{{ store.projectName || 'Yield Planner cut sheet' }} · althoffwoodshop.com</span>
    <span class="print-page-number" style="float:right;"></span>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useProjectStore } from '@/stores/project'
import { exportProject } from '@/utils/export'
import { formatInches, parseFraction } from '@/utils/fractions'
import StockTable      from '@/components/StockTable.vue'
import PartsTable      from '@/components/PartsTable.vue'
import Settings        from '@/components/Settings.vue'
import ResultsSummary  from '@/components/ResultsSummary.vue'
import CutDiagram      from '@/components/CutDiagram.vue'
import CutPlanTable    from '@/components/CutPlanTable.vue'
import Icon            from '@/components/Icon.vue'

const store = useProjectStore()
const resultsAnchor = ref(null)
const fmt = formatInches
const version = __APP_VERSION__
const liveMessage = ref('')

const printDate = new Date().toLocaleDateString('en-US', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
})

const canCalculate = computed(() =>
  store.stock.length > 0 && store.parts.length > 0 && store.isValid)

const blockedReason = computed(() => {
  if (store.stock.length === 0 && store.parts.length === 0) return 'Add at least one board and one part to calculate.'
  if (store.stock.length === 0) return 'Add at least one stock board to calculate.'
  if (store.parts.length === 0) return 'Add at least one part to calculate.'
  if (!store.isValid) return 'Fix the highlighted fields above to calculate.'
  return ''
})

function toneFor(pct) {
  if (pct >= 70) return { label: 'Good', text: 'text-success', badge: 'bg-success-bg text-success', bar: 'bg-success' }
  if (pct >= 40) return { label: 'Fair', text: 'text-warning', badge: 'bg-warning-bg text-warning', bar: 'bg-warning' }
  return { label: 'Poor', text: 'text-danger', badge: 'bg-danger-bg text-danger', bar: 'bg-danger' }
}

const usedResults = computed(() =>
  (store.results?.results ?? []).filter(r => r.cuts.length > 0)
)

/**
 * Unresolved parts, collapsed by identity and diagnosed honestly.
 * "Insufficient stock" was printed for every failure, including parts that no
 * quantity of the given stock could ever hold — a different problem needing a
 * different fix.
 */
const unresolvedGroups = computed(() => {
  const rs = store.results
  if (!rs?.unresolved?.length) return []

  const boards = (rs.results ?? []).map(r => r.stockPiece).filter(Boolean)
  const groups = new Map()

  for (const p of rs.unresolved) {
    const key = `${p.label}|${p.length}|${p.width}|${p.thickness}`
    if (!groups.has(key)) {
      const fitsSomewhere = boards.some(b =>
        b.usableLength >= p.length &&
        b.usableWidth >= p.width &&
        b.usableThickness >= p.thickness)
      groups.set(key, {
        key,
        label: p.label,
        length: p.length,
        width: p.width,
        thickness: p.thickness,
        count: 0,
        reason: fitsSomewhere
          ? 'Fits your stock, but the boards ran out before this one.'
          : 'Larger than every board once conditioning allowances come off. Add thicker or longer stock.',
      })
    }
    groups.get(key).count++
  }

  return [...groups.values()]
})

const unresolvedCount = computed(() =>
  unresolvedGroups.value.reduce((n, g) => n + g.count, 0))

const usedStockEntries = computed(() => {
  if (!store.results) return []
  const usedStockIds = new Set(usedResults.value.map(r => r.stockPiece.stockId))
  return store.stock.filter(s => usedStockIds.has(s.id))
})

function boardFeet(row) {
  const bf = (parseFraction(row.lengthStr) * parseFraction(row.widthStr) *
    parseFraction(row.thicknessStr) * (row.qty || 1)) / 144
  return Number.isFinite(bf) ? bf : 0
}

const stockBoardFeet = (s) => `${boardFeet(s).toFixed(2)} bf`
const partBoardFeet  = (p) => `${boardFeet(p).toFixed(2)} bf`

const totalStockBoardFeet = computed(() => {
  const total = usedStockEntries.value.reduce((sum, s) => sum + boardFeet(s), 0)
  return total > 0 ? `${total.toFixed(2)} bf` : '—'
})

const totalPartsBoardFeet = computed(() => {
  const total = store.parts.reduce((sum, p) => sum + boardFeet(p), 0)
  return total > 0 ? `${total.toFixed(2)} bf` : '—'
})

async function handleCalculate() {
  const ok = store.calculate()
  await nextTick()

  if (!ok) {
    liveMessage.value = `Cannot calculate. ${store.allIssues.length} fields need fixing.`
    return
  }

  const s = store.results.summary
  liveMessage.value =
    `Cut plan ready. ${s.placedParts} of ${s.totalParts} parts placed across ` +
    `${s.stockUsed} ${s.stockUsed === 1 ? 'board' : 'boards'}, ${100 - s.overallWaste}% yield.` +
    (unresolvedCount.value ? ` ${unresolvedCount.value} parts could not be placed.` : '')

  resultsAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function printResults() { window.print() }
function handleExport() { exportProject(store) }
</script>
