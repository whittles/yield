<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

    <!-- ── Print header ────────────────────────────────────────────── -->
    <div class="print-only print-no-break mb-6">
      <div style="display:flex; align-items:center; gap:12pt; border-bottom:2px solid #333; padding-bottom:8pt; margin-bottom:8pt;">
        <img src="/logo.png" style="width:40pt; height:40pt; object-fit:contain;" alt="Althoff Woodshop"/>
        <div>
          <div style="font-size:14pt; font-weight:700; letter-spacing:0.5pt;">ALTHOFF WOODSHOP</div>
          <div style="font-size:10pt; color:#555;">Japanese Tool Box Planner</div>
        </div>
        <div style="margin-left:auto; text-align:right; font-size:9pt; color:#555;">
          <div>{{ new Date().toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' }) }}</div>
          <div>v{{ version }}</div>
        </div>
      </div>
      <div v-if="result" style="font-size:10pt; margin-bottom:6pt;">
        <strong>Box Dimensions:</strong>
        Inner: {{ fmtIn(result.dimensions.iL) }}" × {{ fmtIn(result.dimensions.iW) }}" × {{ fmtIn(result.dimensions.iH) }}" (L × W × H) &nbsp;|&nbsp;
        Outer: {{ fmtIn(result.dimensions.oL) }}" × {{ fmtIn(result.dimensions.oW) }}" × {{ fmtIn(result.dimensions.oH) }}"
      </div>
    </div>

    <!-- ── Page header ─────────────────────────────────────────────── -->
    <div class="no-print">
      <h1 class="text-2xl font-bold text-text-primary">Japanese Tool Box Planner</h1>
      <p class="text-text-muted text-sm mt-1">Sliding lid · Plywood construction</p>
    </div>

    <!-- ── Input card ──────────────────────────────────────────────── -->
    <div class="bg-surface border border-border rounded-lg p-5 no-print space-y-5">

      <!-- Dimension mode toggle -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-text-muted">Dimensions:</span>
        <div class="flex rounded overflow-hidden border border-border text-sm">
          <button
            @click="mode = 'inner'"
            :class="['px-4 py-1.5 transition-colors', mode === 'inner' ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >Inner</button>
          <button
            @click="mode = 'outer'"
            :class="['px-4 py-1.5 transition-colors', mode === 'outer' ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >Outer</button>
        </div>
        <span class="text-xs text-text-muted">{{ mode === 'inner' ? 'Interior usable space' : 'Outside box footprint' }}</span>
      </div>

      <!-- Main dimensions -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-text-muted mb-1">Length (longest)</label>
          <input type="text" v-model="lengthStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='24' />
          <p class="text-xs text-text-muted mt-1">e.g. "24" or "23 1/2"</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Width (front-to-back)</label>
          <input type="text" v-model="widthStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='10' />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Height (box body)</label>
          <input type="text" v-model="heightStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='8' />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Material thickness</label>
          <input type="text" v-model="matThicknessStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='15/32' />
          <p class="text-xs text-text-muted mt-1">Measure your actual sheet — nominal ½" is typically 15/32" (0.469")</p>
        </div>
      </div>

      <!-- Advanced settings -->
      <details class="border border-border rounded-lg overflow-hidden">
        <summary class="px-4 py-2.5 text-sm font-medium text-text-primary cursor-pointer hover:bg-bg/50 transition-colors select-none bg-bg/30">
          Advanced settings ▾
        </summary>
        <div class="px-4 pb-4 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-border">
          <div>
            <label class="block text-xs text-text-muted mb-1">Dado depth</label>
            <input type="text" v-model="dadoDepthStr"
              class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
              placeholder='1/4' />
            <p class="text-xs text-text-muted mt-1">Groove depth for bottom & ends</p>
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Runner clearance</label>
            <input type="text" v-model="runnerClearanceStr"
              class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
              placeholder='1/16' />
            <p class="text-xs text-text-muted mt-1">Extra lid runner groove depth</p>
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Handle strip height</label>
            <input type="text" v-model="handleHeightStr"
              class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
              placeholder='3/4' />
            <p class="text-xs text-text-muted mt-1">Height of stop/handle strips</p>
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Lid overlap fraction</label>
            <input type="text" v-model="overlapFractionStr"
              class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
              placeholder='1/3' />
            <p class="text-xs text-text-muted mt-1">Fraction of inner length each lid overlaps (e.g. 1/3)</p>
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Available plywood sheets</label>
            <div class="space-y-1">
              <div v-for="(sheet, i) in availableSheets" :key="i" class="flex items-center gap-1">
                <input type="text" v-model="sheet.w"
                  class="w-16 border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                  placeholder='48' />
                <span class="text-text-muted text-xs">×</span>
                <input type="text" v-model="sheet.h"
                  class="w-16 border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                  placeholder='96' />
                <span class="text-xs text-text-muted">in</span>
                <button v-if="availableSheets.length > 1" @click="availableSheets.splice(i,1)"
                  class="text-text-muted hover:text-danger text-sm px-1">×</button>
              </div>
              <button @click="availableSheets.push({w:'48',h:'96'})"
                class="text-xs text-accent hover:opacity-80">
                + Add sheet
              </button>
            </div>
            <p class="text-xs text-text-muted mt-1">Partial sheets welcome — solver tries each in order</p>
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Saw kerf</label>
            <input type="text" v-model="kerfStr"
              class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
              placeholder='1/8' />
            <p class="text-xs text-text-muted mt-1">Width lost per cut</p>
          </div>
        </div>
      </details>

      <!-- Error -->
      <div v-if="inputError" class="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
        ⚠ {{ inputError }}
      </div>

      <!-- Calculate button -->
      <div class="flex justify-center pt-1">
        <button
          @click="calculate"
          class="px-8 py-3 font-semibold rounded-lg bg-header text-white hover:opacity-90 transition-opacity text-base"
        >
          Calculate
        </button>
      </div>
    </div>

    <!-- ── Results ─────────────────────────────────────────────────── -->
    <template v-if="result">

      <!-- Summary -->
      <div class="bg-surface border border-border rounded-lg p-5">
        <h2 class="text-base font-semibold text-text-primary mb-3">Box Summary</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div class="bg-bg border border-border rounded p-3">
            <div class="text-xs text-text-muted mb-1">Inner dimensions</div>
            <div class="font-mono font-semibold text-text-primary">
              {{ fmtIn(result.dimensions.iL) }}" × {{ fmtIn(result.dimensions.iW) }}" × {{ fmtIn(result.dimensions.iH) }}"
            </div>
            <div class="text-xs text-text-muted mt-0.5">L × W × H (usable space)</div>
          </div>
          <div class="bg-bg border border-accent/30 rounded p-3">
            <div class="text-xs text-text-muted mb-1">Outer dimensions</div>
            <div class="font-mono font-semibold text-accent">
              {{ fmtIn(result.dimensions.oL) }}" × {{ fmtIn(result.dimensions.oW) }}" × {{ fmtIn(result.dimensions.oH) }}"
            </div>
            <div class="text-xs text-text-muted mt-0.5">L × W × H (footprint)</div>
          </div>
          <div class="bg-bg border border-border rounded p-3">
            <div class="text-xs text-text-muted mb-1">Lid runner groove depth</div>
            <div class="font-mono font-semibold text-text-primary">{{ result.dimensions.runnerDepth.toFixed(4) }}"</div>
            <div class="text-xs text-text-muted mt-0.5">Routed into top inside edge of front &amp; back</div>
          </div>
          <div class="bg-bg border border-border rounded p-3">
            <div class="text-xs text-text-muted mb-1">Lid panel</div>
            <div class="font-mono font-semibold text-text-primary">
              {{ fmtIn(result.dimensions.lidPanelLength) }}" × {{ fmtIn(result.dimensions.lidPanelWidth) }}"
            </div>
            <div class="text-xs text-text-muted mt-0.5">Each panel (2 total) fits in runner grooves</div>
          </div>
          <div class="bg-bg border border-border rounded p-3">
            <div class="text-xs text-text-muted mb-1">Dado depth</div>
            <div class="font-mono font-semibold text-text-primary">{{ fmtIn(dadoDepth) }}"</div>
            <div class="text-xs text-text-muted mt-0.5">Bottom &amp; end panel grooves</div>
          </div>
          <div class="bg-bg border border-border rounded p-3">
            <div class="text-xs text-text-muted mb-1">Material thickness</div>
            <div class="font-mono font-semibold text-text-primary">{{ fmtIn(matThickness) }}"</div>
            <div class="text-xs text-text-muted mt-0.5">Plywood</div>
          </div>
        </div>
      </div>

      <!-- Cut list table -->
      <div class="bg-surface border border-border rounded-lg p-5">
        <h2 class="text-base font-semibold text-text-primary mb-3">Cut List</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-text-muted border-b border-border">
                <th class="pb-2 pr-4">Part</th>
                <th class="pb-2 pr-4">Qty</th>
                <th class="pb-2 pr-4">Length</th>
                <th class="pb-2 pr-4">Width</th>
                <th class="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="piece in result.pieces"
                :key="piece.id"
                :class="[
                  'border-b border-border/50',
                  (piece.id === 'end' || piece.id === 'lid')
                    ? 'border-l-2 border-l-accent/50'
                    : ''
                ]"
              >
                <td class="py-2 pr-4 font-medium text-text-primary pl-2">{{ piece.label }}</td>
                <td class="py-2 pr-4 text-text-muted">{{ piece.qty }}</td>
                <td class="py-2 pr-4 font-mono text-text-primary">{{ fmtIn(piece.length) }}"</td>
                <td class="py-2 pr-4 font-mono text-text-primary">{{ fmtIn(piece.width) }}"</td>
                <td class="py-2 text-xs text-text-muted max-w-sm">{{ piece.notes }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-text-muted mt-3">Highlighted rows (End ×2, Lid Panel ×2) use accented border. All dimensions in inches.</p>
      </div>

      <!-- 3D Isometric Preview -->
      <div v-if="result && isoBoxData" class="bg-surface border border-border rounded-lg p-5">
        <h2 class="text-base font-semibold text-text-primary mb-1">3D Preview</h2>
        <p class="text-xs text-text-muted mb-3">Isometric view — lid partially open to show interior</p>

        <svg viewBox="0 0 500 420" class="w-full max-w-lg mx-auto" style="font-family: monospace;">
          <!-- Ground shadow -->
          <ellipse
            :cx="isoBoxData.groundCenter[0]"
            :cy="isoBoxData.groundCenter[1]"
            :rx="isoBoxData.groundRx"
            :ry="isoBoxData.groundRy"
            fill="#000" opacity="0.12"
          />

          <!-- Box front face -->
          <polygon :points="isoBoxData.frontFace" fill="#c8a96e" stroke="#8B6914" stroke-width="0.8"/>

          <!-- Box right face (in shadow) -->
          <polygon :points="isoBoxData.rightFace" fill="#b8955a" stroke="#8B6914" stroke-width="0.8"/>

          <!-- Interior top (exposed where lid is open) -->
          <polygon :points="isoBoxData.interiorTop" fill="#2a1f0e" stroke="#1a0f00" stroke-width="0.5"/>

          <!-- Box top face (partially hidden behind lid panels) -->
          <polygon :points="isoBoxData.topFace" fill="#c8a96e" stroke="#8B6914" stroke-width="0.5" opacity="0.3"/>

          <!-- Handle strips -->
          <polygon :points="isoBoxData.leftHandle"  fill="#8B6914" stroke="#5a4000" stroke-width="0.6" opacity="0.8"/>
          <polygon :points="isoBoxData.rightHandle" fill="#8B6914" stroke="#5a4000" stroke-width="0.6" opacity="0.8"/>

          <!-- Lid B (closed, right side) — front edge then top face -->
          <polygon :points="isoBoxData.lidBTopFace" fill="#b8955a" stroke="#8B6914" stroke-width="0.8"/>
          <polygon :points="isoBoxData.lidBTop"     fill="#d4a84b" stroke="#8B6914" stroke-width="0.8"/>

          <!-- Lid A (open, slid left) — front edge then top face -->
          <polygon :points="isoBoxData.lidATopFace" fill="#b8955a" stroke="#8B6914" stroke-width="0.8"/>
          <polygon :points="isoBoxData.lidATop"     fill="#d4a84b" stroke="#8B6914" stroke-width="0.8"/>

          <!-- Dimension label -->
          <text x="20" y="410" font-size="9" fill="#64748b">
            {{ fmtIn(result.dimensions.oL) }}" L × {{ fmtIn(result.dimensions.oW) }}" W × {{ fmtIn(result.dimensions.oH) }}" H (outer)
          </text>
        </svg>

        <!-- Dimension callouts -->
        <div class="grid grid-cols-3 gap-3 mt-3 text-center text-xs">
          <div>
            <div class="text-text-muted">Outer length</div>
            <div class="font-semibold text-text-primary font-mono">{{ fmtIn(result.dimensions.oL) }}"</div>
          </div>
          <div>
            <div class="text-text-muted">Outer width</div>
            <div class="font-semibold text-text-primary font-mono">{{ fmtIn(result.dimensions.oW) }}"</div>
          </div>
          <div>
            <div class="text-text-muted">Outer height</div>
            <div class="font-semibold text-text-primary font-mono">{{ fmtIn(result.dimensions.oH) }}"</div>
          </div>
        </div>
      </div>

      <!-- Sheet layout SVGs -->
      <div class="space-y-4">
        <h2 class="text-base font-semibold text-text-primary">Sheet Layout</h2>
        <div v-for="(sheet, si) in sheets" :key="'sheet-' + si" class="bg-surface border border-border rounded-lg p-5">
          <!-- Sheet label -->
          <p class="text-xs text-text-muted mb-2 no-print">
            Sheet {{ si + 1 }}: {{ sheet.sheetW || (parseFraction(availableSheets[0]?.w)||48) }}" × {{ sheet.sheetH || (parseFraction(availableSheets[0]?.h)||96) }}"
          </p>
          <!-- SVG layout -->
          <svg
            :viewBox="`0 0 ${Math.round((sheet.sheetW||48) * (SVG_DISPLAY_W/(sheet.sheetW||48)))} ${Math.round((sheet.sheetH||96) * (SVG_DISPLAY_W/(sheet.sheetW||48)))}`"
            class="w-full"
            style="max-width: 100%; font-family: monospace;"
          >
            <defs>
              <pattern :id="`hatch-${si}`" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#888" stroke-width="0.8" opacity="0.25"/>
              </pattern>
            </defs>

            <!-- Sheet background (waste = hatch) -->
            <rect x="0" y="0"
              :width="Math.round((sheet.sheetW||48) * (SVG_DISPLAY_W/(sheet.sheetW||48)))"
              :height="Math.round((sheet.sheetH||96) * (SVG_DISPLAY_W/(sheet.sheetW||48)))"
              :fill="`url(#hatch-${si})`" stroke="#555" stroke-width="1"/>

            <!-- Placed pieces -->
            <g v-for="p in sheet.placed" :key="p.instanceId">
              <rect
                :x="Math.round(p.x * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10"
                :y="Math.round(p.y * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10"
                :width="Math.max(1, Math.round(p.placedW * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10)"
                :height="Math.max(1, Math.round(p.placedH * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10)"
                :fill="PIECE_COLORS[p.id] || '#888'"
                fill-opacity="0.75"
                :stroke="darken(PIECE_COLORS[p.id] || '#888')"
                stroke-width="0.8"
              />
              <text
                :x="Math.round(p.x * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10 + Math.max(1, Math.round(p.placedW * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10) / 2"
                :y="Math.round(p.y * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10 + Math.max(1, Math.round(p.placedH * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10) / 2 - 5"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="9"
                fill="#fff"
                font-weight="600"
              >{{ p.label }}</text>
              <text
                v-if="Math.round(p.placedH * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10 > 18"
                :x="Math.round(p.x * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10 + Math.max(1, Math.round(p.placedW * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10) / 2"
                :y="Math.round(p.y * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10 + Math.max(1, Math.round(p.placedH * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10) / 2 + 7"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="7"
                fill="#ffffffcc"
              >{{ fmtIn(p.placedW) }}" × {{ fmtIn(p.placedH) }}"</text>
            </g>
          </svg>

          <!-- Sheet utilization -->
          <div class="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>Sheet {{ si + 1 }} of {{ sheets.length }}</span>
            <span class="font-semibold text-text-primary">{{ sheetUtilization(sheet, si) }}% utilization</span>
          </div>
        </div>
      </div>

      <!-- Assembly notes -->
      <div class="bg-surface border border-border rounded-lg p-5">
        <h2 class="text-base font-semibold text-text-primary mb-3">Assembly Notes</h2>

        <!-- Key dimensions callout -->
        <div class="bg-bg border border-accent/30 rounded p-3 mb-4 text-sm font-mono space-y-1">
          <div><span class="text-text-muted">Bottom dado:</span> <span class="text-text-primary font-semibold">{{ fmtIn(dadoDepth) }}" deep × {{ fmtIn(matThickness) }}" wide</span> — in front, back, and ends</div>
          <div><span class="text-text-muted">End dados:</span> <span class="text-text-primary font-semibold">{{ fmtIn(dadoDepth) }}" deep × {{ fmtIn(matThickness) }}" wide</span> — in front and back</div>
          <div><span class="text-text-muted">Lid runner groove:</span> <span class="text-text-primary font-semibold">{{ result.dimensions.runnerDepth.toFixed(4) }}" deep × {{ fmtIn(matThickness) }}" wide</span> — top inside edge of front &amp; back</div>
        </div>

        <ol class="space-y-2 text-sm text-text-muted list-decimal ml-5">
          <li>Cut all dados <strong class="text-text-primary">BEFORE</strong> assembly (bottom dado in front/back/ends, end dados in front/back, lid runner groove in front/back)</li>
          <li>Dry fit all pieces before gluing/nailing</li>
          <li>Assemble: nail ends into front/back dadoes</li>
          <li>Drop bottom into dado grooves — <strong class="text-text-primary">no glue needed</strong> (allows wood movement)</li>
          <li>Check square, nail through front/back into ends</li>
          <li>Cut lid panels to size, test fit in runner grooves</li>
          <li>Cut handle cutouts (1" × 3" slot, ½" from each end)</li>
          <li>Nail handle/stop strips inside ends after confirming lid slides freely</li>
          <li>15° bevel on inside bottom edge of handle strips</li>
        </ol>
      </div>

    </template>

    <!-- ── FAB: Print ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <button
        v-if="result"
        @click="window.print()"
        class="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent hover:bg-indigo-600 text-white font-semibold px-5 py-3 rounded-full shadow-lg transition-all text-sm"
        aria-label="Print tool box sheet"
      >
        🖨 <span class="hidden sm:inline">Print Sheet</span>
      </button>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { parseFraction } from '@/utils/fractions'
import { calculatePieces, packSheets, packMultipleSheets, formatIn } from '@/toolboxSolver'

const version = __APP_VERSION__

// ── Inputs ───────────────────────────────────────────────────────────
const mode = ref('inner')
const lengthStr = ref('24')
const widthStr = ref('10')
const heightStr = ref('8')
const matThicknessStr = ref('15/32')
const dadoDepthStr = ref('1/4')
const runnerClearanceStr = ref('1/16')
const handleHeightStr = ref('3/4')
const overlapFractionStr = ref('1/3')
const availableSheets = ref([{ w: '48', h: '96' }])
const kerfStr = ref('1/8')

// ── State ────────────────────────────────────────────────────────────
const result = ref(null)
const sheets = ref([])
const inputError = ref('')

// ── Parsed values ────────────────────────────────────────────────────
const matThickness = computed(() => parseFraction(matThicknessStr.value) || 0.5)
const dadoDepth = computed(() => parseFraction(dadoDepthStr.value) || 0.25)

// ── Piece colors ─────────────────────────────────────────────────────
const PIECE_COLORS = {
  front:  '#6366f1',
  back:   '#6366f1',
  end:    '#22c55e',
  bottom: '#f59e0b',
  lid:    '#0ea5e9',
  handle: '#a78bfa',
}

function darken(hex) {
  // Simple darkening: parse hex and reduce each channel by ~20%
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const d = (v) => Math.max(0, Math.floor(v * 0.7)).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

// ── SVG scaling ───────────────────────────────────────────────────────
// Target SVG display: max 480×240 for a 4×8 sheet
const SVG_DISPLAY_W = 480
// SVG scale based on first sheet (for display proportions)
const svgScaleFactor = computed(() => {
  const sheetW = parseFraction(availableSheets.value[0]?.w) || 48
  return SVG_DISPLAY_W / sheetW
})
const svgW = computed(() => {
  const sheetW = parseFraction(availableSheets.value[0]?.w) || 48
  return Math.round(sheetW * svgScaleFactor.value)
})
const svgH = computed(() => {
  const sheetH = parseFraction(availableSheets.value[0]?.h) || 96
  return Math.round(sheetH * svgScaleFactor.value)
})

function toSvgX(x) { return Math.round(x * svgScaleFactor.value * 10) / 10 }
function toSvgY(y) { return Math.round(y * svgScaleFactor.value * 10) / 10 }
function toSvgLen(l) { return Math.max(1, Math.round(l * svgScaleFactor.value * 10) / 10) }

function sheetUtilization(sheet, sheetIndex) {
  const s = availableSheets.value[sheetIndex] ?? availableSheets.value[availableSheets.value.length - 1]
  const sheetW = parseFraction(s?.w) || 48
  const sheetH = parseFraction(s?.h) || 96
  const total = sheetW * sheetH
  const used = sheet.placed.reduce((sum, p) => sum + p.placedW * p.placedH, 0)
  return Math.round((used / total) * 100)
}

// ── Isometric 3D preview ────────────────────────────────────────────────
const isoBoxData = computed(() => {
  if (!result.value) return null
  const d = result.value.dimensions
  const { oL, oW, oH, lidPanelLength } = d
  // matThickness and handleHeight live in result.input
  const matThickness = result.value.input.matThickness
  const handleHeight = result.value.input.handleHeight

  // Scale to fit in viewBox 500×400
  // The isometric projection of oL along x spans oL*cos(30)*scale horizontally
  // and oH spans oH*scale vertically, oW adds (oW*sin(30)*scale) diagonally
  // Target: total width ~380px, total height ~300px
  const isoW = (oL + oW) * Math.cos(Math.PI / 6) // projected width in units
  const isoH = oH + (oL + oW) * Math.sin(Math.PI / 6) // projected height in units
  const scale = Math.min(380 / isoW, 260 / isoH)
  const ox = 60 + oW * Math.cos(Math.PI / 6) * scale // left margin + depth offset
  const oy = 340 - (oL + oW) * Math.sin(Math.PI / 6) * scale / 2 // bottom margin

  function iso(x, y, z) {
    const sx = ox + (x - z) * Math.cos(Math.PI / 6) * scale
    const sy = oy - y * scale + (x + z) * Math.sin(Math.PI / 6) * scale
    return [Math.round(sx * 10) / 10, Math.round(sy * 10) / 10]
  }

  function pts(...coords) {
    return coords.map(([x, y]) => `${x},${y}`).join(' ')
  }

  // Box body faces
  const frontFace = pts(iso(0, 0, 0), iso(oL, 0, 0), iso(oL, oH, 0), iso(0, oH, 0))
  const rightFace = pts(iso(oL, 0, 0), iso(oL, 0, oW), iso(oL, oH, oW), iso(oL, oH, 0))
  const topFace   = pts(iso(0, oH, 0), iso(oL, oH, 0), iso(oL, oH, oW), iso(0, oH, oW))

  // Lid panel thickness
  const lt = matThickness

  // Lid panel B (closed, right half)
  const lidBx = oL - lidPanelLength
  const lidBTopFace = pts(iso(lidBx, oH, 0), iso(oL, oH, 0), iso(oL, oH + lt, 0), iso(lidBx, oH + lt, 0))
  const lidBTop     = pts(iso(lidBx, oH + lt, 0), iso(oL, oH + lt, 0), iso(oL, oH + lt, oW), iso(lidBx, oH + lt, oW))

  // Lid panel A (open, slid left ~1/4)
  const lidAoffset  = -oL * 0.25
  const lidATopFace = pts(iso(lidAoffset, oH, 0), iso(lidAoffset + lidPanelLength, oH, 0), iso(lidAoffset + lidPanelLength, oH + lt, 0), iso(lidAoffset, oH + lt, 0))
  const lidATop     = pts(iso(lidAoffset, oH + lt, 0), iso(lidAoffset + lidPanelLength, oH + lt, 0), iso(lidAoffset + lidPanelLength, oH + lt, oW), iso(lidAoffset, oH + lt, oW))

  // Interior visible (gap between lid A right edge and lid B left edge)
  const exposedX   = lidAoffset + lidPanelLength
  const interiorTop = pts(iso(exposedX, oH, 0), iso(lidBx, oH, 0), iso(lidBx, oH, oW), iso(exposedX, oH, oW))

  // Handle strips (left and right end faces, at top)
  const hb = handleHeight || 0.75
  const leftHandle  = pts(iso(0, oH - hb, 0), iso(0, oH, 0), iso(0, oH, oW), iso(0, oH - hb, oW))
  const rightHandle = pts(iso(oL, oH - hb, 0), iso(oL, oH, 0), iso(oL, oH, oW), iso(oL, oH - hb, oW))

  // Ground shadow ellipse
  const [cx, cy] = iso(oL / 2, 0, oW / 2)

  return {
    frontFace, rightFace, topFace,
    lidBTop, lidBTopFace,
    lidATop, lidATopFace,
    interiorTop,
    leftHandle, rightHandle,
    groundCenter: [cx, cy + 8],
    groundRx: oL * scale * 0.6,
    groundRy: oW * scale * 0.2,
  }
})

// ── Format helper ─────────────────────────────────────────────────────
function fmtIn(val) {
  return formatIn(val)
}

// ── Calculate ────────────────────────────────────────────────────────
function calculate() {
  inputError.value = ''
  try {
    const length = parseFraction(lengthStr.value)
    const width = parseFraction(widthStr.value)
    const height = parseFraction(heightStr.value)
    const mat = parseFraction(matThicknessStr.value) || 0.5
    const dado = parseFraction(dadoDepthStr.value) || 0.25
    const runner = parseFraction(runnerClearanceStr.value) || 0.0625
    const handle = parseFraction(handleHeightStr.value) || 0.75
    const overlap = parseFraction(overlapFractionStr.value) || (1 / 3)
    const kerf = parseFraction(kerfStr.value) || 0.125

    if (!length || !width || !height) {
      inputError.value = 'Please enter valid length, width, and height dimensions.'
      return
    }

    const r = calculatePieces({
      mode: mode.value,
      length,
      width,
      height,
      matThickness: mat,
      dadoDepth: dado,
      runnerClearance: runner,
      handleHeight: handle,
      overlapFraction: overlap,
    })

    result.value = r

    // Pack across all available sheets in order
    const allSheetsSizes = availableSheets.value.map(s => ({
      w: parseFraction(s.w) || 48,
      h: parseFraction(s.h) || 96,
    }))

    // Use multi-sheet packing: try each sheet in sequence
    sheets.value = packMultipleSheets(r.pieces, allSheetsSizes, kerf)
  } catch (e) {
    inputError.value = `Calculation error: ${e.message}`
  }
}
</script>
