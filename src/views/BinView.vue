<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

    <!-- ── Print header ────────────────────────────────────────────── -->
    <div class="print-only print-no-break mb-6">
      <div style="display:flex; align-items:center; gap:12pt; border-bottom:2px solid #333; padding-bottom:8pt; margin-bottom:8pt;">
        <img src="/logo.png" style="width:40pt; height:40pt; object-fit:contain;" alt="Althoff Woodshop"/>
        <div>
          <div style="font-size:14pt; font-weight:700; letter-spacing:0.5pt;">ALTHOFF WOODSHOP</div>
          <div style="font-size:10pt; color:#555;">Simple Bin Planner</div>
        </div>
        <div style="margin-left:auto; text-align:right; font-size:9pt; color:#555;">
          <div>{{ new Date().toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' }) }}</div>
          <div>v{{ version }}</div>
        </div>
      </div>
      <div v-if="result" style="font-size:10pt; margin-bottom:6pt;">
        <strong>Box Dimensions:</strong>
        Inner: {{ fmtIn(result.dimensions.iW) }}" × {{ fmtIn(result.dimensions.iD) }}" × {{ fmtIn(result.dimensions.iH) }}" (W × D × H) &nbsp;|&nbsp;
        Outer: {{ fmtIn(result.dimensions.oW) }}" × {{ fmtIn(result.dimensions.oD) }}" × {{ fmtIn(result.dimensions.oH) }}"
      </div>
    </div>

    <!-- ── Page header ─────────────────────────────────────────────── -->
    <div class="no-print">
      <h1 class="text-2xl font-bold text-text-primary">Simple Bin Planner</h1>
      <p class="text-text-muted text-sm mt-1">Open-top box · Dado bottom joint</p>
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
          <label class="block text-xs text-text-muted mb-1">Width (left-to-right)</label>
          <input type="text" v-model="widthStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='12' />
          <p class="text-xs text-text-muted mt-1">e.g. "12" or "11 1/2"</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Depth (front-to-back)</label>
          <input type="text" v-model="depthStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='8' />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Height</label>
          <input type="text" v-model="heightStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='6' />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Qty (number of bins)</label>
          <input type="number" v-model.number="qty" min="1"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='1' />
        </div>
      </div>

      <!-- Material & dado -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs text-text-muted mb-1">Material thickness</label>
          <input type="text" v-model="matThicknessStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='15/32' />
          <p class="text-xs text-text-muted mt-1">Measure your actual sheet — nominal ½" is typically 15/32" (0.469")</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Dado depth</label>
          <input type="text" v-model="dadoDepthStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='1/4' />
          <p class="text-xs text-text-muted mt-1">Groove depth for bottom panel</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Saw kerf</label>
          <input type="text" v-model="kerfStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
            placeholder='1/8' />
          <p class="text-xs text-text-muted mt-1">Width lost per cut</p>
        </div>
      </div>

      <!-- Sheet sizes -->
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
              {{ fmtIn(result.dimensions.iW) }}" × {{ fmtIn(result.dimensions.iD) }}" × {{ fmtIn(result.dimensions.iH) }}"
            </div>
            <div class="text-xs text-text-muted mt-0.5">W × D × H (usable space)</div>
          </div>
          <div class="bg-bg border border-accent/30 rounded p-3">
            <div class="text-xs text-text-muted mb-1">Outer dimensions</div>
            <div class="font-mono font-semibold text-accent">
              {{ fmtIn(result.dimensions.oW) }}" × {{ fmtIn(result.dimensions.oD) }}" × {{ fmtIn(result.dimensions.oH) }}"
            </div>
            <div class="text-xs text-text-muted mt-0.5">W × D × H (footprint)</div>
          </div>
          <div class="bg-bg border border-border rounded p-3">
            <div class="text-xs text-text-muted mb-1">Material</div>
            <div class="font-mono font-semibold text-text-primary">
              {{ fmtIn(result.dimensions.matThickness) }}" ply · {{ fmtIn(result.dimensions.dadoDepth) }}" dado
            </div>
            <div class="text-xs text-text-muted mt-0.5">{{ qty }} bin{{ qty !== 1 ? 's' : '' }}</div>
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
                class="border-b border-border/50"
              >
                <td class="py-2 pr-4 font-medium text-text-primary pl-2">
                  <span class="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" :style="{ backgroundColor: PIECE_COLORS[piece.id] || '#888' }"></span>
                  {{ piece.label }}
                </td>
                <td class="py-2 pr-4 text-text-muted">{{ piece.qty }}</td>
                <td class="py-2 pr-4 font-mono text-text-primary">{{ fmtIn(piece.length) }}"</td>
                <td class="py-2 pr-4 font-mono text-text-primary">{{ fmtIn(piece.width) }}"</td>
                <td class="py-2 text-xs text-text-muted max-w-sm">{{ piece.notes }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-text-muted mt-3">All dimensions in inches. Length = horizontal cut, Width = vertical cut.</p>
      </div>

      <!-- Minimum sheet size -->
      <div v-if="minSheet" class="bg-surface border border-accent/30 rounded-lg p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h2 class="text-base font-semibold text-text-primary">Minimum Sheet Required</h2>
            <p class="text-xs text-text-muted mt-0.5">Smallest piece of stock that fits all parts — look for an offcut this size or larger</p>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold text-accent font-mono">{{ fmtIn(minSheet.w) }}" × {{ fmtIn(minSheet.h) }}"</div>
            <div class="text-xs text-text-muted">{{ minSheet.wastePct }}% waste</div>
          </div>
        </div>
        <svg
          :viewBox="`0 0 ${Math.round(minSheet.w * (SVG_DISPLAY_W / minSheet.w))} ${Math.round(minSheet.h * (SVG_DISPLAY_W / minSheet.w))}`"
          class="w-full"
          style="max-width: 100%; font-family: monospace;"
        >
          <defs>
            <pattern id="hatch-min" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#888" stroke-width="0.8" opacity="0.25"/>
            </pattern>
          </defs>
          <rect x="0" y="0"
            :width="Math.round(minSheet.w * (SVG_DISPLAY_W / minSheet.w))"
            :height="Math.round(minSheet.h * (SVG_DISPLAY_W / minSheet.w))"
            fill="url(#hatch-min)" stroke="#555" stroke-width="1"/>
          <g v-for="p in minSheet.placed" :key="p.instanceId">
            <rect
              :x="Math.round(p.x * (SVG_DISPLAY_W / minSheet.w) * 10) / 10"
              :y="Math.round(p.y * (SVG_DISPLAY_W / minSheet.w) * 10) / 10"
              :width="Math.max(1, Math.round(p.placedW * (SVG_DISPLAY_W / minSheet.w) * 10) / 10)"
              :height="Math.max(1, Math.round(p.placedH * (SVG_DISPLAY_W / minSheet.w) * 10) / 10)"
              :fill="PIECE_COLORS[p.id] || '#888'"
              fill-opacity="0.75"
              :stroke="darken(PIECE_COLORS[p.id] || '#888')"
              stroke-width="0.8"
            />
            <text
              :x="Math.round(p.x * (SVG_DISPLAY_W / minSheet.w) * 10) / 10 + Math.max(1, Math.round(p.placedW * (SVG_DISPLAY_W / minSheet.w) * 10) / 10) / 2"
              :y="Math.round(p.y * (SVG_DISPLAY_W / minSheet.w) * 10) / 10 + Math.max(1, Math.round(p.placedH * (SVG_DISPLAY_W / minSheet.w) * 10) / 10) / 2"
              text-anchor="middle" dominant-baseline="middle"
              font-size="9" fill="#fff" font-weight="600"
            >{{ p.label }}</text>
          </g>
        </svg>
      </div>

      <!-- Sheet layout SVGs -->
      <div class="space-y-4">
        <h2 class="text-base font-semibold text-text-primary">Sheet Layout</h2>
        <p class="text-xs text-text-muted -mt-2">How pieces nest on your available stock (defined in settings above)</p>
        <div v-for="(sheet, si) in sheets" :key="'sheet-' + si" class="bg-surface border border-border rounded-lg p-5">
          <p class="text-xs text-text-muted mb-2 no-print">
            Sheet {{ si + 1 }}: {{ sheet.sheetW || (parseFraction(availableSheets[0]?.w) || 48) }}" × {{ sheet.sheetH || (parseFraction(availableSheets[0]?.h) || 96) }}"
          </p>
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
            <rect x="0" y="0"
              :width="Math.round((sheet.sheetW||48) * (SVG_DISPLAY_W/(sheet.sheetW||48)))"
              :height="Math.round((sheet.sheetH||96) * (SVG_DISPLAY_W/(sheet.sheetW||48)))"
              :fill="`url(#hatch-${si})`" stroke="#555" stroke-width="1"/>
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
                text-anchor="middle" dominant-baseline="middle"
                font-size="9" fill="#fff" font-weight="600"
              >{{ p.label }}</text>
              <text
                v-if="Math.round(p.placedH * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10 > 18"
                :x="Math.round(p.x * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10 + Math.max(1, Math.round(p.placedW * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10) / 2"
                :y="Math.round(p.y * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10 + Math.max(1, Math.round(p.placedH * (SVG_DISPLAY_W/(sheet.sheetW||48)) * 10)/10) / 2 + 7"
                text-anchor="middle" dominant-baseline="middle"
                font-size="7" fill="#ffffffcc"
              >{{ fmtIn(p.placedW) }}" × {{ fmtIn(p.placedH) }}"</text>
            </g>
          </svg>
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
          <div><span class="text-text-muted">Dado:</span> <span class="text-text-primary font-semibold">{{ fmtIn(result.dimensions.dadoDepth) }}" deep × {{ fmtIn(result.dimensions.matThickness) }}" wide</span> — on inside bottom edge of all four walls</div>
          <div><span class="text-text-muted">Outer box:</span> <span class="text-text-primary font-semibold">{{ fmtIn(result.dimensions.oW) }}" W × {{ fmtIn(result.dimensions.oD) }}" D × {{ fmtIn(result.dimensions.oH) }}" H</span></div>
          <div><span class="text-text-muted">Inner space:</span> <span class="text-text-primary font-semibold">{{ fmtIn(result.dimensions.iW) }}" W × {{ fmtIn(result.dimensions.iD) }}" D × {{ fmtIn(result.dimensions.iH) }}" H</span></div>
        </div>

        <ol class="space-y-2 text-sm text-text-muted list-decimal ml-5">
          <li>Cut all dados <strong class="text-text-primary">BEFORE</strong> assembly — dado on inside bottom edge of all four walls</li>
          <li>Dry fit all pieces before gluing/nailing</li>
          <li>Assemble: nail/glue sides into front and back</li>
          <li>Drop bottom into dado grooves — <strong class="text-text-primary">no glue needed</strong> (allows wood movement)</li>
          <li>Check square, nail through front/back into sides</li>
          <li>Optional: add a chamfer or roundover to top edges</li>
        </ol>
      </div>

    </template>

    <!-- ── FAB: Print ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <button
        v-if="result"
        @click="window.print()"
        class="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent hover:bg-indigo-600 text-white font-semibold px-5 py-3 rounded-full shadow-lg transition-all text-sm"
        aria-label="Print bin sheet"
      >
        🖨 <span class="hidden sm:inline">Print Sheet</span>
      </button>
    </Teleport>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { parseFraction } from '@/utils/fractions'
import { calculateBin, formatIn } from '@/binSolver'
import { packMultipleSheets, minimumSheet } from '@/toolboxSolver'

const version = __APP_VERSION__

// ── Inputs ───────────────────────────────────────────────────────────
const mode = ref('inner')
const widthStr = ref('12')
const depthStr = ref('8')
const heightStr = ref('6')
const qty = ref(1)
const matThicknessStr = ref('15/32')
const dadoDepthStr = ref('1/4')
const kerfStr = ref('1/8')
const availableSheets = ref([{ w: '48', h: '96' }])

// ── State ────────────────────────────────────────────────────────────
const result = ref(null)
const sheets = ref([])
const minSheet = ref(null)
const inputError = ref('')

// ── Piece colors ─────────────────────────────────────────────────────
const PIECE_COLORS = {
  front:  '#6366f1',  // indigo
  back:   '#6366f1',
  side:   '#22c55e',  // green
  bottom: '#f59e0b',  // amber
}

const SVG_DISPLAY_W = 480

function darken(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const d = (v) => Math.max(0, Math.floor(v * 0.7)).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

function fmtIn(val) {
  return formatIn(val)
}

function sheetUtilization(sheet, sheetIndex) {
  const s = availableSheets.value[sheetIndex] ?? availableSheets.value[availableSheets.value.length - 1]
  const sheetW = parseFraction(s?.w) || 48
  const sheetH = parseFraction(s?.h) || 96
  const total = sheetW * sheetH
  const used = sheet.placed.reduce((sum, p) => sum + p.placedW * p.placedH, 0)
  return Math.round((used / total) * 100)
}

// ── Calculate ────────────────────────────────────────────────────────
function calculate() {
  inputError.value = ''
  try {
    const width = parseFraction(widthStr.value)
    const depth = parseFraction(depthStr.value)
    const height = parseFraction(heightStr.value)
    const mat = parseFraction(matThicknessStr.value) || 0.469
    const dado = parseFraction(dadoDepthStr.value) || 0.25
    const kerf = parseFraction(kerfStr.value) || 0.125
    const binQty = Math.max(1, qty.value || 1)

    if (!width || !depth || !height) {
      inputError.value = 'Please enter valid width, depth, and height dimensions.'
      return
    }

    const r = calculateBin({
      mode: mode.value,
      width,
      depth,
      height,
      matThickness: mat,
      dadoDepth: dado,
      qty: binQty,
    })

    result.value = r

    const allSheetsSizes = availableSheets.value.map(s => ({
      w: parseFraction(s.w) || 48,
      h: parseFraction(s.h) || 96,
    }))

    sheets.value = packMultipleSheets(r.pieces, allSheetsSizes, kerf)
    minSheet.value = minimumSheet(r.pieces, kerf)
  } catch (e) {
    inputError.value = `Calculation error: ${e.message}`
  }
}
</script>
