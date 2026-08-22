<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

    <!-- ── Print header ────────────────────────────────────────────── -->
    <div class="print-only print-no-break mb-6">
      <div style="display:flex; align-items:center; gap:12pt; border-bottom:2px solid #333; padding-bottom:8pt; margin-bottom:8pt;">
        <img src="/logo.png" style="width:40pt; height:40pt; object-fit:contain;" alt="Althoff Woodshop"/>
        <div>
          <div style="font-size:14pt; font-weight:700; letter-spacing:0.5pt;">ALTHOFF WOODSHOP</div>
          <div style="font-size:10pt; color:#555;">Segment Planner</div>
        </div>
        <div style="margin-left:auto; text-align:right; font-size:9pt; color:#555;">
          <div>{{ today }}</div>
          <div>v{{ version }}</div>
        </div>
      </div>
      <div v-if="store.projectName" style="font-size:10pt; margin-bottom:4pt;">
        <strong>{{ store.projectName }}</strong>
      </div>
      <div style="font-size:9pt; color:#555;">
        Beta: this plan is generated algorithmically. Check every dimension against your stock before cutting.
      </div>
      <!-- A printed sheet outlives the screen it came from, so it has to say
           which convention produced its numbers. -->
      <div v-if="result" style="font-size:9pt; color:#555; margin-top:2pt;">
        {{ snapping ? `Lengths rounded up to the nearest ${snapLabel}` : 'Exact geometry, unrounded' }}<template
          v-if="ripWidthIn"> · one strip ripped to {{ fmt(ripWidthIn) }}"</template> · miter exact
      </div>
    </div>

    <!-- ── Page header ─────────────────────────────────────────────── -->
    <div class="no-print">
      <h1 class="text-2xl font-bold text-text-primary">Segment Planner</h1>
      <p class="text-text-muted text-sm mt-1">
        Segmented turning · Mitered rings, brick-laid courses, full-scale templates
      </p>
    </div>

    <!-- ── Inputs ──────────────────────────────────────────────────── -->
    <div class="bg-surface border border-border rounded-lg p-5 no-print space-y-5 shadow-sheet">

      <!-- What are we building -->
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm text-text-muted">Build:</span>
        <div class="flex rounded overflow-hidden border border-border text-sm">
          <button
            v-for="m in MODES" :key="m.key"
            @click="mode = m.key"
            :class="['px-4 min-h-[44px] transition-colors', mode === m.key ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >{{ m.label }}</button>
        </div>
        <span class="text-xs text-text-muted">{{ activeMode.hint }}</span>
      </div>

      <!-- Diameter convention -->
      <div class="flex flex-wrap items-center gap-3 pt-1 border-t border-border">
        <span class="text-sm text-text-muted pt-3">Diameter means:</span>
        <div class="flex rounded overflow-hidden border border-border text-sm mt-3">
          <button
            @click="diameterMode = 'finished'"
            :class="['px-4 min-h-[44px] transition-colors', diameterMode === 'finished' ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >Finished</button>
          <button
            @click="diameterMode = 'blank'"
            :class="['px-4 min-h-[44px] transition-colors', diameterMode === 'blank' ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >Blank</button>
        </div>
        <span class="text-xs text-text-muted mt-3 max-w-md">
          {{ diameterMode === 'finished'
            ? 'The size after turning. Segments are cut oversize so the ring cleans up fully round.'
            : 'The corners of the glued-up blank. Turning round loses the corners, so it finishes undersize.' }}
        </span>
      </div>

      <!-- Rounding grid -->
      <div class="flex flex-wrap items-center gap-3 pt-1 border-t border-border">
        <span class="text-sm text-text-muted pt-3">Round to:</span>
        <div class="flex rounded overflow-hidden border border-border text-sm mt-3">
          <button
            v-for="s in SNAP_CHOICES" :key="s.key"
            @click="snapDenom = s.key"
            :class="['px-4 min-h-[44px] transition-colors', snapDenom === s.key ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >{{ s.label }}</button>
        </div>
        <span class="text-xs text-text-muted mt-3 max-w-md">{{ snapHint }}</span>
      </div>

      <!-- Segments -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
        <div>
          <label for="seg-count" class="block text-xs text-text-muted mb-1">Segments per ring</label>
          <input type="text" inputmode="numeric" id="seg-count" v-model="segments"
            :aria-invalid="!!fieldErrors['Segments per ring'] || undefined"
            class="w-full min-h-[40px] border rounded px-2 text-sm bg-surface text-text-primary font-mono"
            :class="fieldErrors['Segments per ring'] ? 'border-danger bg-danger-bg/40' : 'border-border'"
            placeholder="12" />
          <p class="text-xs text-text-muted mt-1">3 to 80</p>
        </div>

        <!-- Bowl stack fields -->
        <template v-if="mode === 'stack'">
          <div>
            <label for="seg-baseod" class="block text-xs text-text-muted mb-1">Base diameter</label>
            <input type="text" id="seg-baseod" v-model="baseODStr" v-bind="fieldAttrs('Base diameter')" placeholder="4" />
            <p class="text-xs text-text-muted mt-1">Outside, at the bottom</p>
          </div>
          <div>
            <label for="seg-angle" class="block text-xs text-text-muted mb-1">Wall angle</label>
            <input type="text" id="seg-angle" v-model="wallAngleStr" v-bind="fieldAttrs('Wall angle')" placeholder="60" />
            <p class="text-xs text-text-muted mt-1">Degrees from level · 90 = straight</p>
          </div>
          <div>
            <label for="seg-total" class="block text-xs text-text-muted mb-1">Total height</label>
            <input type="text" id="seg-total" v-model="totalHeightStr" v-bind="fieldAttrs('Total height')" placeholder="6" />
            <p class="text-xs text-text-muted mt-1">Base included</p>
          </div>
          <div>
            <label for="seg-ringh" class="block text-xs text-text-muted mb-1">Ring height</label>
            <input type="text" id="seg-ringh" v-model="ringHeightStr" v-bind="fieldAttrs('Ring height')" placeholder="3/4" />
            <p class="text-xs text-text-muted mt-1">= stock thickness</p>
          </div>
          <div>
            <label for="seg-wall" class="block text-xs text-text-muted mb-1">Wall thickness</label>
            <input type="text" id="seg-wall" v-model="wallStr" v-bind="fieldAttrs('Wall thickness')" placeholder="3/4" />
            <p class="text-xs text-text-muted mt-1">Finished, radial</p>
          </div>
        </template>

        <!-- Single ring fields -->
        <template v-if="mode === 'ring'">
          <div>
            <label for="seg-od" class="block text-xs text-text-muted mb-1">Ring diameter</label>
            <input type="text" id="seg-od" v-model="ringODStr" v-bind="fieldAttrs('Ring diameter')" placeholder="8" />
            <p class="text-xs text-text-muted mt-1">Outside</p>
          </div>
          <div>
            <label for="seg-wall2" class="block text-xs text-text-muted mb-1">Wall thickness</label>
            <input type="text" id="seg-wall2" v-model="wallStr" v-bind="fieldAttrs('Wall thickness')" placeholder="3/4" />
            <p class="text-xs text-text-muted mt-1">Radial</p>
          </div>
          <div>
            <label for="seg-ringh2" class="block text-xs text-text-muted mb-1">Ring height</label>
            <input type="text" id="seg-ringh2" v-model="ringHeightStr" v-bind="fieldAttrs('Ring height')" placeholder="3/4" />
            <p class="text-xs text-text-muted mt-1">= stock thickness</p>
          </div>
        </template>

        <!-- Stave fields -->
        <template v-if="mode === 'stave'">
          <div>
            <label for="seg-sbase" class="block text-xs text-text-muted mb-1">Base diameter</label>
            <input type="text" id="seg-sbase" v-model="baseODStr" v-bind="fieldAttrs('Base diameter')" placeholder="4" />
            <p class="text-xs text-text-muted mt-1">Outside, at the bottom</p>
          </div>
          <div>
            <label for="seg-sangle" class="block text-xs text-text-muted mb-1">Side angle</label>
            <input type="text" id="seg-sangle" v-model="wallAngleStr" v-bind="fieldAttrs('Wall angle')" placeholder="70" />
            <p class="text-xs text-text-muted mt-1">Degrees from level</p>
          </div>
          <div>
            <label for="seg-sheight" class="block text-xs text-text-muted mb-1">Height</label>
            <input type="text" id="seg-sheight" v-model="staveHeightStr" v-bind="fieldAttrs('Height')" placeholder="6" />
            <p class="text-xs text-text-muted mt-1">Vertical, not along the slope</p>
          </div>
          <div>
            <label for="seg-swall" class="block text-xs text-text-muted mb-1">Wall thickness</label>
            <input type="text" id="seg-swall" v-model="wallStr" v-bind="fieldAttrs('Wall thickness')" placeholder="3/4" />
            <p class="text-xs text-text-muted mt-1">For board feet</p>
          </div>
        </template>
      </div>

      <!-- Base style, stack only -->
      <div v-if="mode === 'stack'" class="flex flex-wrap items-center gap-3">
        <span class="text-sm text-text-muted">Base:</span>
        <div class="flex rounded overflow-hidden border border-border text-sm">
          <button
            @click="baseStyle = 'solid'"
            :class="['px-4 min-h-[44px] transition-colors', baseStyle === 'solid' ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >Solid disc</button>
          <button
            @click="baseStyle = 'segmented'"
            :class="['px-4 min-h-[44px] transition-colors', baseStyle === 'segmented' ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >Segmented</button>
        </div>
        <span class="text-xs text-text-muted">
          {{ baseStyle === 'solid' ? 'A glued-up disc to screw the faceplate to' : 'Ring 1 is a normal segmented course' }}
        </span>
      </div>

      <!-- Stock on hand -->
      <div class="flex flex-wrap items-center gap-3 pt-1 border-t border-border">
        <span class="text-sm text-text-muted pt-3">Stock:</span>
        <div class="flex rounded overflow-hidden border border-border text-sm mt-3">
          <button
            @click="useStockWidth = false"
            :class="['px-4 min-h-[44px] transition-colors', !useStockWidth ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >Rip to fit</button>
          <button
            @click="useStockWidth = true"
            :class="['px-4 min-h-[44px] transition-colors', useStockWidth ? 'bg-accent text-white' : 'bg-bg text-text-muted hover:text-text-primary']"
          >I already have</button>
        </div>
        <div v-if="useStockWidth" class="mt-3 flex items-baseline gap-2">
          <div class="w-20">
            <label for="seg-stockw" class="sr-only">Stock width</label>
            <input type="text" id="seg-stockw" v-model="stockWidthStr" v-bind="fieldAttrs('Stock width')" placeholder="1" />
          </div>
          <span class="text-xs text-text-muted">
            " wide × <span class="font-mono">{{ fmt(stockThicknessIn) }}"</span> thick
            <template v-if="mode !== 'stave'">(from ring height)</template>
          </span>
        </div>
        <span v-else class="text-xs text-text-muted mt-3 max-w-md">
          {{ mode === 'stave'
            ? 'Stock has to reach the wide end of a stave — nothing to turn away here.'
            : 'One rip width for the whole build, taken from the course that needs the most.' }}
        </span>
      </div>

      <!-- Open / gapped rings + allowances -->
      <details v-if="mode !== 'stave'" class="border-t border-border pt-4">
        <summary class="text-sm text-text-primary cursor-pointer min-h-[44px] flex items-center select-none">
          Open segments and stock allowances
        </summary>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          <div>
            <label for="seg-gap" class="block text-xs text-text-muted mb-1">Open gap</label>
            <input type="text" id="seg-gap" v-model="gapDegStr" v-bind="fieldAttrs('Open gap')" placeholder="0" />
            <p class="text-xs text-text-muted mt-1">Degrees · 0 = closed ring</p>
            <div class="flex gap-1 mt-2">
              <button v-for="d in [2, 3, 4]" :key="d" @click="setGapFraction(d)"
                class="px-2 min-h-[32px] text-xs border border-border rounded text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                :title="`Set gap to 1/${d} of the segment angle`">1/{{ d }}</button>
            </div>
          </div>
          <div>
            <label for="seg-mout" class="block text-xs text-text-muted mb-1">Outer margin</label>
            <input type="text" id="seg-mout" v-model="marginOutStr" v-bind="fieldAttrs('Outer margin')" placeholder="0" />
            <p class="text-xs text-text-muted mt-1">Extra stock to turn away</p>
          </div>
          <div>
            <label for="seg-min" class="block text-xs text-text-muted mb-1">Inner margin</label>
            <input type="text" id="seg-min" v-model="marginInStr" v-bind="fieldAttrs('Inner margin')" placeholder="0" />
            <p class="text-xs text-text-muted mt-1">Extra stock to bore away</p>
          </div>
          <div>
            <label for="seg-kerf" class="block text-xs text-text-muted mb-1">Saw kerf</label>
            <input type="text" id="seg-kerf" v-model="kerfStr" v-bind="fieldAttrs('Saw kerf')" placeholder="1/8" />
            <p class="text-xs text-text-muted mt-1">Lost per crosscut</p>
          </div>
          <div>
            <label for="seg-trim" class="block text-xs text-text-muted mb-1">Trim allowance</label>
            <input type="text" id="seg-trim" v-model="trimPctStr" v-bind="fieldAttrs('Trim allowance')" placeholder="10" />
            <p class="text-xs text-text-muted mt-1">Percent, for snipe and setup</p>
          </div>
        </div>
      </details>

      <!-- Blocking validation -->
      <div v-if="!isValid" role="alert"
        class="text-sm text-danger bg-danger-bg border border-danger/30 rounded px-3 py-2">
        <p v-for="(msg, key) in fieldErrors" :key="key">{{ msg }}</p>
      </div>
      <div v-else-if="solveError" role="alert"
        class="text-sm text-danger bg-danger-bg border border-danger/30 rounded px-3 py-2">
        {{ solveError }}
      </div>

      <!-- Calculate -->
      <div class="text-center pt-1">
        <button
          @click="calculate"
          :disabled="!isValid"
          class="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-accent text-white font-semibold text-base rounded hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sheet"
        >Calculate</button>
        <p v-if="!isValid" class="text-xs text-text-muted mt-2">
          {{ blockedReason }}
        </p>
      </div>
    </div>

    <p aria-live="polite" class="sr-only">{{ liveMessage }}</p>

    <!-- ── Results ─────────────────────────────────────────────────── -->
    <template v-if="result">

      <!-- Standing beta notice: neutral ground, coloured icon only. -->
      <div class="no-print flex items-start gap-2 bg-surface border border-border rounded-lg px-4 py-3 text-sm text-text-secondary shadow-sheet">
        <Icon name="info" size="1.1em" class="text-warning mt-0.5" />
        <span>Beta: these tools are actively being developed. Results are generated algorithmically — always verify dimensions before cutting.</span>
      </div>

      <!-- Summary -->
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-3 print-no-break">
        <div v-for="tile in summaryTiles" :key="tile.label"
          class="bg-surface border border-border rounded-lg px-4 py-3 shadow-sheet">
          <dt class="text-xs uppercase tracking-wide text-text-muted">{{ tile.label }}</dt>
          <dd class="text-xl font-mono font-semibold text-text-primary mt-1 print-dimension">{{ tile.value }}</dd>
        </div>
      </dl>

      <!-- Rings that can't be built -->
      <div v-if="result.errors && result.errors.length"
        class="bg-warning-bg border border-warning/30 rounded-lg px-4 py-3 print-no-break">
        <p class="text-sm font-semibold text-warning">Some rings can't be built as specified</p>
        <ul class="mt-2 space-y-1 text-sm text-text-secondary list-disc list-inside">
          <li v-for="(e, i) in result.errors" :key="i">{{ e }}</li>
        </ul>
      </div>

      <!-- What the rounding and the stock did. Prints: it changes the result. -->
      <div v-for="a in advisories" :key="a.key"
        class="bg-warning-bg border border-warning/30 rounded-lg px-4 py-3 print-no-break">
        <p class="text-sm font-semibold text-warning">{{ a.title }}</p>
        <ul class="mt-2 space-y-1 text-sm text-text-secondary list-disc list-inside">
          <li v-for="(line, i) in a.lines" :key="i">{{ line }}</li>
        </ul>
      </div>

      <!-- ── Ring / stack drawings ─────────────────────────────────── -->
      <section v-if="result.viewMode !== 'stave' && refRing" class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet print-no-break">
        <div class="px-5 py-3 border-b border-border bg-surface-alt">
          <h2 class="text-base font-semibold text-text-primary">
            {{ result.viewMode === 'stack' ? `Ring ${refRing.index} — largest course` : 'Ring plan' }}
          </h2>
        </div>
        <div class="p-5 grid gap-6 sm:grid-cols-2">
          <!-- Ring plan -->
          <figure>
            <svg
              :viewBox="ringViewBox" role="img"
              :aria-labelledby="`${uid}-rt ${uid}-rd`"
              class="w-full h-auto" style="max-height: 320px"
            >
              <title :id="`${uid}-rt`">Plan of a {{ refRing.n }}-segment ring</title>
              <desc :id="`${uid}-rd`">{{ ringDesc }}</desc>
              <!-- Glued-up segments -->
              <polygon
                v-for="(poly, i) in ringPolys" :key="i"
                :points="poly"
                :fill="i % 2 === 0 ? '#e8d5b0' : '#d4a84b'"
                stroke="#8b6914" :stroke-width="ringStroke"
              />
              <!-- What turning takes it down to -->
              <circle cx="0" cy="0" :r="refRing.turnsTo / 2" fill="none"
                stroke="#8b6914" :stroke-width="ringStroke" stroke-dasharray="0.12 0.09" opacity="0.75" />
              <circle cx="0" cy="0" :r="refRing.boresTo / 2" fill="none"
                stroke="#8b6914" :stroke-width="ringStroke" stroke-dasharray="0.12 0.09" opacity="0.75" />
            </svg>
            <figcaption class="text-xs text-text-muted mt-2">
              Solid: the glued-up blank. Dashed: finished
              <span class="font-mono">{{ fmt(refRing.turnsTo) }}"</span> outside and
              <span class="font-mono">{{ fmt(refRing.boresTo) }}"</span> bore.
            </figcaption>
          </figure>

          <!-- Single segment, dimensioned -->
          <figure>
            <svg
              :viewBox="`0 0 ${seg.w} ${seg.h}`" role="img"
              :aria-labelledby="`${uid}-st ${uid}-sd`"
              class="w-full h-auto" style="max-height: 300px"
            >
              <title :id="`${uid}-st`">One segment with its cut dimensions</title>
              <desc :id="`${uid}-sd`">
                Outer edge {{ fmt(refRing.outerEdge) }} inches, inner edge {{ fmt(refRing.innerEdge) }} inches,
                strip width {{ fmt(refRing.stripWidth) }} inches, mitered {{ fmtDeg(refRing.miter) }} degrees each end.
              </desc>

              <polygon :points="seg.points" fill="#e8d5b0" stroke="#8b6914" :stroke-width="seg.stroke" />

              <!-- Outer edge, above -->
              <text :x="seg.w / 2" :y="seg.top - seg.gap" text-anchor="middle"
                :font-size="seg.font" fill="#121212" font-family="ui-monospace, monospace" font-weight="600">
                {{ fmt(refRing.outerEdge) }}"
              </text>
              <!-- Inner edge, below -->
              <text :x="seg.w / 2" :y="seg.bottom + seg.gap + seg.font * 0.8" text-anchor="middle"
                :font-size="seg.font" fill="#121212" font-family="ui-monospace, monospace" font-weight="600">
                {{ fmt(refRing.innerEdge) }}"
              </text>
              <!-- Strip width, to the right, with a leader between the two edges -->
              <line :x1="seg.rightEdge + seg.gap" :y1="seg.top" :x2="seg.rightEdge + seg.gap" :y2="seg.bottom"
                stroke="#8b6914" :stroke-width="seg.stroke * 0.7" />
              <line :x1="seg.rightEdge + seg.gap * 0.5" :y1="seg.top" :x2="seg.rightEdge + seg.gap * 1.5" :y2="seg.top"
                stroke="#8b6914" :stroke-width="seg.stroke * 0.7" />
              <line :x1="seg.rightEdge + seg.gap * 0.5" :y1="seg.bottom" :x2="seg.rightEdge + seg.gap * 1.5" :y2="seg.bottom"
                stroke="#8b6914" :stroke-width="seg.stroke * 0.7" />
              <text :x="seg.rightEdge + seg.gap * 2" :y="(seg.top + seg.bottom) / 2"
                text-anchor="start" dominant-baseline="middle"
                :font-size="seg.font" fill="#121212" font-family="ui-monospace, monospace" font-weight="600">
                {{ fmt(refRing.stripWidth) }}"
              </text>
              <!-- Miter callout at the left end -->
              <text :x="seg.leftEdge - seg.gap * 0.4" :y="seg.top + seg.font * 1.1"
                text-anchor="end" :font-size="seg.font * 0.85" fill="#4b5563"
                font-family="ui-monospace, monospace" font-weight="600">
                {{ fmtDeg(refRing.miter) }}°
              </text>
            </svg>
            <figcaption class="text-xs text-text-muted mt-2">
              Miter both ends at <span class="font-mono font-semibold">{{ fmtDeg(refRing.miter) }}°</span> from square.
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- ── Every segment, one shared scale (screen) ──────────────── -->
      <section v-if="gallery.length > 1" class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet no-print">
        <div class="px-5 py-3 border-b border-border bg-surface-alt">
          <h2 class="text-base font-semibold text-text-primary">Segment sizes</h2>
          <p class="text-xs text-text-muted mt-0.5">
            Every course, drawn to one shared scale so the taper is real —
            ring {{ gallery[0].index }} against ring {{ gallery[gallery.length - 1].index }}.
            All of them come off one <span class="font-mono">{{ fmt(result.totals.ripWidth) }}"</span>
            strip; only the length changes. Print the sheet for these at full size.
          </p>
        </div>
        <ul class="p-5 flex flex-wrap gap-x-5 gap-y-4 items-end">
          <li v-for="g in gallery" :key="g.index" class="shrink-0">
            <svg
              :viewBox="`0 0 ${g.vw} ${g.vh}`"
              :style="{ width: g.px + 'px', maxWidth: '100%', height: 'auto' }"
              role="img" :aria-label="`Ring ${g.index}: cut length ${fmt(g.outerEdge)} inches, strip width ${fmt(g.stripWidth)} inches`"
            >
              <polygon :points="g.points" :fill="g.fill" stroke="#8b6914" :stroke-width="g.stroke" />
            </svg>
            <div class="mt-1.5 text-xs text-text-muted">
              Ring {{ g.index }}
            </div>
            <div class="font-mono text-xs font-semibold text-text-primary">
              {{ fmt(g.outerEdge) }}"
            </div>
          </li>
        </ul>
      </section>

      <!-- ── Ring cut list (stack) ─────────────────────────────────── -->
      <section v-if="result.viewMode === 'stack' && refRing" class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet">
        <div class="px-5 py-3 border-b border-border bg-surface-alt">
          <h2 class="text-base font-semibold text-text-primary">Ring cut list</h2>
          <p class="text-xs text-text-muted mt-0.5">
            {{ result.n }} segments per ring · miter
            <span class="font-mono font-semibold">{{ fmtDeg(refRing?.miter) }}°</span> each end ·
            one strip, ripped to
            <span class="font-mono font-semibold">{{ fmt(result.totals.ripWidth) }}"</span>
          </p>
          <p v-if="snapping" class="text-xs text-text-muted mt-1">
            Every length is a round {{ snapLabel }}, so the stop can be set off a tape.
            The miter is not rounded and never should be — that angle is the whole reason
            the ring closes, and {{ result.totals.stopSettings }} stop
            {{ result.totals.stopSettings === 1 ? 'setting' : 'settings' }} covers the bowl.
          </p>
          <p v-else class="text-xs text-text-muted mt-1">
            These come off a tangent, so most land between fractions and are shown as decimals.
            Set the stop from the printed template rather than chasing the last thousandth on a rule.
          </p>
        </div>

        <!-- Desktop table -->
        <table class="w-full text-sm hidden sm:table">
          <caption class="sr-only">Cut list, one row per ring, from the bottom of the bowl up</caption>
          <thead>
            <tr class="bg-surface-alt text-xs uppercase tracking-wide text-text-muted">
              <th scope="col" class="text-left px-3 py-2 print-tick-col">Done</th>
              <th scope="col" class="text-left px-3 py-2">Ring</th>
              <!-- Cut length leads: it is the only per-ring number you set. -->
              <th scope="col" class="text-right px-3 py-2">Cut length</th>
              <th scope="col" class="text-right px-3 py-2">Blank OD</th>
              <th v-if="snapping" scope="col" class="text-right px-3 py-2">Turn away</th>
              <th scope="col" class="text-right px-3 py-2">Board</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ring in buildableRings" :key="ring.index"
              class="border-t border-border even:bg-surface-alt/50">
              <td class="px-3 py-2"><span class="print-tick"></span></td>
              <td class="px-3 py-2">
                <span class="font-semibold text-text-primary">{{ ring.index }}</span>
                <span v-if="ring.rotateBy" class="text-xs text-text-muted ml-1">· offset</span>
              </td>
              <td class="px-3 py-2 text-right font-mono font-semibold text-text-primary print-dimension">{{ fmt(ring.outerEdge) }}"</td>
              <td class="px-3 py-2 text-right font-mono">{{ fmt(ring.maxRound ?? ring.OD) }}"</td>
              <td v-if="snapping" class="px-3 py-2 text-right font-mono text-text-secondary">
                {{ ring.extraOD > 0.0005 ? `${fmt(ring.extraOD)}"` : '—' }}
              </td>
              <td class="px-3 py-2 text-right font-mono">{{ fmt(ring.boardLength) }}"</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-surface-alt border-t border-border font-semibold">
              <td class="px-3 py-2"></td>
              <td class="px-3 py-2">{{ result.totals.ringCount }} rings</td>
              <td class="px-3 py-2 text-right font-mono">{{ result.totals.segments }} cuts</td>
              <td class="px-3 py-2"></td>
              <td v-if="snapping" class="px-3 py-2"></td>
              <td class="px-3 py-2 text-right font-mono">{{ fmt(result.totals.boardLength) }}"</td>
            </tr>
          </tfoot>
        </table>

        <!-- Mobile cards: a cut list you have to swipe sideways is unusable at the saw. -->
        <ul class="sm:hidden divide-y divide-border">
          <li v-for="ring in buildableRings" :key="ring.index" class="px-4 py-3">
            <div class="flex items-baseline justify-between">
              <span class="text-xs uppercase tracking-wide text-text-muted">Ring {{ ring.index }}</span>
              <span class="font-mono font-semibold text-lg text-text-primary print-dimension">{{ fmt(ring.outerEdge) }}"</span>
            </div>
            <dl class="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-text-secondary">
              <div class="flex justify-between"><dt>Blank OD</dt><dd class="font-mono">{{ fmt(ring.maxRound ?? ring.OD) }}"</dd></div>
              <div v-if="snapping" class="flex justify-between">
                <dt>Turn away</dt>
                <dd class="font-mono">{{ ring.extraOD > 0.0005 ? `${fmt(ring.extraOD)}"` : '—' }}</dd>
              </div>
              <div class="flex justify-between"><dt>Inner edge</dt><dd class="font-mono">{{ fmt(ring.innerEdge) }}"</dd></div>
              <div class="flex justify-between"><dt>Board</dt><dd class="font-mono">{{ fmt(ring.boardLength) }}"</dd></div>
            </dl>
          </li>
        </ul>
      </section>

      <!-- ── Single ring figures ───────────────────────────────────── -->
      <section v-if="result.viewMode === 'ring'" class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet print-no-break">
        <div class="px-5 py-3 border-b border-border bg-surface-alt">
          <h2 class="text-base font-semibold text-text-primary">Cut figures</h2>
        </div>
        <dl class="divide-y divide-border">
          <div v-for="row in ringRows" :key="row.label" class="flex items-baseline justify-between px-5 py-2.5">
            <dt class="text-sm text-text-secondary">{{ row.label }}</dt>
            <dd class="font-mono font-semibold text-text-primary print-dimension">{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <!-- ── Stave drawings ────────────────────────────────────────── -->
      <section v-if="result.viewMode === 'stave' && stave" class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet print-no-break">
        <div class="px-5 py-3 border-b border-border bg-surface-alt">
          <h2 class="text-base font-semibold text-text-primary">Stave drawings</h2>
        </div>
        <div class="p-5 grid gap-6 sm:grid-cols-3">

          <!-- 1. The stave laid flat: what you mark out on the board -->
          <figure>
            <svg :viewBox="`0 0 ${stave.flat.w} ${stave.flat.h}`" role="img"
              :aria-labelledby="`${uid}-ft ${uid}-fd`"
              class="w-full h-auto" style="max-height: 300px">
              <title :id="`${uid}-ft`">One stave laid flat</title>
              <desc :id="`${uid}-fd`">
                A tapered stave {{ fmt(result.staveLength) }} inches long, {{ fmt(result.widthBase) }} inches
                wide at the base and {{ fmt(result.widthTop) }} inches at the top.
              </desc>
              <polygon :points="stave.flat.points" fill="#e8d5b0" stroke="#8b6914" :stroke-width="stave.flat.stroke" />
              <text :x="stave.flat.w / 2" :y="stave.flat.pad * 0.62" text-anchor="middle"
                :font-size="stave.flat.font" fill="#121212" font-family="ui-monospace, monospace" font-weight="600">
                {{ fmt(result.widthTop) }}"
              </text>
              <text :x="stave.flat.w / 2" :y="stave.flat.h - stave.flat.pad * 0.2" text-anchor="middle"
                :font-size="stave.flat.font" fill="#121212" font-family="ui-monospace, monospace" font-weight="600">
                {{ fmt(result.widthBase) }}"
              </text>
              <text :x="stave.flat.w" :y="stave.flat.h / 2" text-anchor="end"
                dominant-baseline="middle" :font-size="stave.flat.font" fill="#121212"
                font-family="ui-monospace, monospace" font-weight="600">
                {{ fmt(result.staveLength) }}"
              </text>
            </svg>
            <figcaption class="text-xs text-text-muted mt-2">
              One stave flat. Top of the vessel is up — the taper is
              <span class="font-mono font-semibold">{{ fmt(result.taperPerEdge) }}"</span> per edge.
            </figcaption>
          </figure>

          <!-- 2. Cross-section: what the blade tilt actually does -->
          <figure>
            <svg :viewBox="`0 0 ${stave.section.w} ${stave.section.h}`" role="img"
              :aria-labelledby="`${uid}-bt ${uid}-bd`"
              class="w-full h-auto" style="max-height: 300px">
              <title :id="`${uid}-bt`">Stave cross-section showing the edge bevel</title>
              <desc :id="`${uid}-bd`">
                Looking down the length of a stave. Both long edges are bevelled
                {{ fmtDeg(result.bevel) }} degrees so that {{ result.n }} of them close into a ring.
              </desc>
              <polygon :points="stave.section.points" fill="#e8d5b0" stroke="#8b6914" :stroke-width="stave.section.stroke" />
              <!-- square reference at one edge, so the tilt reads as a tilt -->
              <line :x1="stave.section.refX" :y1="stave.section.top" :x2="stave.section.refX" :y2="stave.section.bottom"
                stroke="#656c78" :stroke-width="stave.section.stroke * 0.6" stroke-dasharray="0.05 0.04" />
              <text :x="stave.section.w / 2" :y="stave.section.top - stave.section.pad * 0.25" text-anchor="middle"
                :font-size="stave.section.font * 0.9" fill="#4b5563" font-family="ui-monospace, monospace" font-weight="600">
                outside
              </text>
              <text :x="stave.section.w / 2" :y="(stave.section.top + stave.section.bottom) / 2"
                text-anchor="middle" dominant-baseline="middle"
                :font-size="stave.section.font" fill="#121212" font-family="ui-monospace, monospace" font-weight="600">
                {{ fmtDeg(result.bevel) }}°
              </text>
            </svg>
            <figcaption class="text-xs text-text-muted mt-2">
              <template v-if="stave.section.valid">
                Looking down the stave. Tilt the blade
                <span class="font-mono font-semibold">{{ fmtDeg(result.bevel) }}°</span> and rip both edges.
              </template>
              <template v-else>
                At <span class="font-mono font-semibold">{{ fmtDeg(result.bevel) }}°</span> a
                {{ fmt(staveWallIn) }}" wall bevels away to nothing. Thin the wall or use more staves.
              </template>
            </figcaption>
          </figure>

          <!-- 3. Elevation: did I describe the vessel I meant? -->
          <figure>
            <svg :viewBox="`0 0 ${stave.elev.w} ${stave.elev.h}`" role="img"
              :aria-labelledby="`${uid}-et ${uid}-ed`"
              class="w-full h-auto" style="max-height: 300px">
              <title :id="`${uid}-et`">Vessel elevation</title>
              <desc :id="`${uid}-ed`">
                {{ fmt(result.baseOD) }} inches across the base, {{ fmt(result.topOD) }} inches at the top,
                {{ fmt(result.height) }} inches tall, walls at {{ fmtDeg(result.wallAngle) }} degrees.
              </desc>
              <polygon :points="stave.elev.outer" fill="#e8d5b0" stroke="#8b6914" :stroke-width="stave.elev.stroke" />
              <polygon :points="stave.elev.inner" fill="#ffffff" stroke="#8b6914" :stroke-width="stave.elev.stroke" />
              <text :x="stave.elev.w / 2" :y="stave.elev.h - stave.elev.pad * 0.2" text-anchor="middle"
                :font-size="stave.elev.font" fill="#121212" font-family="ui-monospace, monospace" font-weight="600">
                {{ fmt(result.baseOD) }}"
              </text>
              <text :x="stave.elev.w / 2" :y="stave.elev.pad * 0.62" text-anchor="middle"
                :font-size="stave.elev.font" fill="#121212" font-family="ui-monospace, monospace" font-weight="600">
                {{ fmt(result.topOD) }}"
              </text>
            </svg>
            <figcaption class="text-xs text-text-muted mt-2">
              Elevation, true proportion. <span class="font-mono font-semibold">{{ fmt(result.height) }}"</span> tall
              at <span class="font-mono font-semibold">{{ fmtDeg(result.wallAngle) }}°</span>.
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- ── Stave figures ─────────────────────────────────────────── -->
      <section v-if="result.viewMode === 'stave'" class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet print-no-break">
        <div class="px-5 py-3 border-b border-border bg-surface-alt">
          <h2 class="text-base font-semibold text-text-primary">Stave figures</h2>
          <p class="text-xs text-text-muted mt-0.5">{{ result.n }} staves, edge-jointed</p>
        </div>
        <dl class="divide-y divide-border">
          <div v-for="row in staveRows" :key="row.label" class="flex items-baseline justify-between px-5 py-2.5">
            <dt class="text-sm text-text-secondary">{{ row.label }}</dt>
            <dd class="font-mono font-semibold text-text-primary print-dimension">{{ row.value }}</dd>
          </div>
        </dl>
        <p class="px-5 py-3 text-xs text-text-muted border-t border-border">
          Bevel is derived from the frustum's dihedral angle, not the
          <span class="font-mono">atan(tan(180/n)·sin α)</span> shortcut — that one is up to 1.6° out
          at shallow angles, which compounds around the glue-up.
        </p>
      </section>

      <!-- ── Stock ─────────────────────────────────────────────────── -->
      <section class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet print-no-break">
        <div class="px-5 py-3 border-b border-border bg-surface-alt">
          <h2 class="text-base font-semibold text-text-primary">Stock</h2>
        </div>
        <dl class="divide-y divide-border">
          <div v-for="row in stockRows" :key="row.label" class="flex items-baseline justify-between px-5 py-2.5">
            <dt class="text-sm text-text-secondary">{{ row.label }}</dt>
            <dd class="font-mono font-semibold text-text-primary print-dimension">{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <!-- ── Assembly notes ────────────────────────────────────────── -->
      <section class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet print-no-break">
        <div class="px-5 py-3 border-b border-border bg-surface-alt">
          <h2 class="text-base font-semibold text-text-primary">At the saw and the bench</h2>
        </div>
        <ol class="px-5 py-4 space-y-2 text-sm text-text-secondary list-decimal list-inside">
          <li v-for="(note, i) in assemblyNotes" :key="i">{{ note }}</li>
        </ol>
      </section>

      <!-- ── Full-scale templates (print only) ─────────────────────── -->
      <!--
        1:1 on paper. Each SVG is sized in INCHES and its viewBox matches the real
        geometry one-to-one, so the browser lays it out at true physical size.
        Do NOT add w-full, max-width, or any percentage width here or on anything
        wrapping it — a relative width defeats the absolute sizing and the
        template silently prints wrong, which is worse than not printing at all.
        The `fullscale` class is what escapes the generic `svg { max-width: 100% }`
        print rule in style.css.
      -->
      <div v-if="templates.length" class="print-only print-break-before">
        <div style="font-size:12pt; font-weight:700; margin-bottom:4pt;">Full-scale segment templates</div>
        <div style="font-size:9pt; color:#555; margin-bottom:8pt;">
          {{ templateCaption }}
        </div>

        <!-- Calibration bar. Print dialogs default to "Fit to page" and shrink
             everything silently, so a 1:1 template needs a way to check itself. -->
        <div style="margin-bottom:12pt;">
          <svg width="1in" height="0.28in" viewBox="0 0 1 0.28" style="display:block;">
            <line x1="0.01" y1="0.14" x2="0.99" y2="0.14" stroke="#121212" stroke-width="0.012" />
            <line x1="0.01" y1="0.04" x2="0.01" y2="0.24" stroke="#121212" stroke-width="0.012" />
            <line x1="0.99" y1="0.04" x2="0.99" y2="0.24" stroke="#121212" stroke-width="0.012" />
          </svg>
          <div style="font-size:8pt; color:#555; margin-top:2pt;">
            This bar must measure exactly 1 inch. If it doesn't, reprint at 100% / Actual Size —
            not "Fit to page". Everything below is wrong until it does.
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:14pt; align-items:flex-start;">
          <div
            v-for="t in templates" :key="t.key"
            class="fullscale print-no-break"
            :style="{ '--fs-w': `${t.w}in`, '--fs-h': `${t.h}in` }"
          >
            <div style="font-size:8pt; color:#555; margin-bottom:2pt;">
              {{ t.label }} · cut {{ t.count }} @ {{ fmt(t.length) }}" · miter {{ t.miter }}°
            </div>
            <div v-if="t.tooWide" style="font-size:8pt; color:#92400e; margin-bottom:2pt;">
              {{ fmt(t.w) }}" wide — wider than the {{ USABLE_PAGE_IN }}" of usable page.
              Print landscape or tile it.
            </div>
            <svg
              :width="`${t.w}in`" :height="`${t.h}in`"
              :viewBox="`0 0 ${t.w} ${t.h}`"
              style="display:block; overflow:visible;"
              role="img" :aria-label="`Full scale template for ${t.label}`"
            >
              <polygon :points="t.points" fill="none" stroke="#121212" stroke-width="0.01" />
              <line
                :x1="t.w / 2" y1="0.06" :x2="t.w / 2" :y2="t.h - 0.06"
                stroke="#121212" stroke-width="0.005" stroke-dasharray="0.06 0.04" opacity="0.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Print FAB ───────────────────────────────────────────────── -->
    <Teleport to="body">
      <button
        v-if="result"
        @click="printSheet"
        class="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold min-h-[48px] px-5 rounded-full shadow-lifted transition-colors text-sm"
        aria-label="Print segment sheet"
      >
        <Icon name="printer" size="1.15em" />
        <span class="hidden sm:inline">Print sheet</span>
        <span class="sr-only sm:hidden">Print sheet</span>
      </button>
    </Teleport>

  </div>
</template>

<script setup>
import Icon from '@/components/Icon.vue'
import { ref, computed, watch, useId } from 'vue'
import { parseFraction, validateDimension, formatInches } from '@/utils/fractions'
import {
  calcRing, calcStack, calcStave, ringOutlines, segmentOutline, snapUp,
} from '@/segmentSolver'
import { useProjectStore } from '@/stores/project'

const version = __APP_VERSION__
const store = useProjectStore()
const uid = useId()

// Letter minus the 12mm side margins already set in @page.
const USABLE_PAGE_IN = 7.05

const MODES = [
  { key: 'stack', label: 'Bowl stack', hint: 'A stack of mitered rings — the usual segmented bowl' },
  { key: 'ring',  label: 'Single ring', hint: 'One ring on its own, for a feature course' },
  { key: 'stave', label: 'Tapered staves', hint: 'Full-height staves instead of courses' },
]

// Stored as strings because they are button keys bound straight to the store.
const SNAP_CHOICES = [
  { key: '0',  label: 'Exact' },
  { key: '32', label: '1/32"' },
  { key: '16', label: '1/16"' },
  { key: '8',  label: '1/8"' },
]

// ── Inputs, bound onto the store so they persist and export ──────────
function bound(key) {
  return computed({
    get: () => store.segSettings[key],
    set: (v) => { store.segSettings[key] = v },
  })
}

const mode            = bound('mode')
const diameterMode    = bound('diameterMode')
const segments        = bound('segments')
const baseODStr       = bound('baseODStr')
const wallAngleStr    = bound('wallAngleStr')
const wallStr         = bound('wallStr')
const ringHeightStr   = bound('ringHeightStr')
const totalHeightStr  = bound('totalHeightStr')
const baseStyle       = bound('baseStyle')
const ringODStr       = bound('ringODStr')
const gapDegStr       = bound('gapDegStr')
const marginInStr     = bound('marginInStr')
const marginOutStr    = bound('marginOutStr')
const kerfStr         = bound('kerfStr')
const trimPctStr      = bound('trimPctStr')
const staveHeightStr  = bound('staveHeightStr')
const snapDenom       = bound('snapDenom')
const useStockWidth   = bound('useStockWidth')
const stockWidthStr   = bound('stockWidthStr')

const solveError = ref('')
const liveMessage = ref('')

const activeMode = computed(() => MODES.find((m) => m.key === mode.value) ?? MODES[0])
const today = new Date().toLocaleDateString('en-US', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
})

const fmt = formatInches
const fmtDeg = (v) => (Number.isFinite(v) ? v.toFixed(2).replace(/\.?0+$/, '') : '?')

// ── Rounding ─────────────────────────────────────────────────────────
const snapDenomNum = computed(() => Number(snapDenom.value) || 0)
const snapping = computed(() => snapDenomNum.value > 0)
const snapLabel = computed(
  () => SNAP_CHOICES.find((s) => s.key === String(snapDenom.value))?.label ?? 'Exact',
)

/** How far one grid step moves the DIAMETER.
 *
 * Cut length feeds diameter through 1/tan(180/n), so the same 1/8" step is
 * 0.30" of OD at 8 segments and 0.95" at 24. That amplification is the only
 * real cost of rounding, so it gets quoted live against the segment count the
 * user has actually typed rather than left to be discovered at the lathe.
 */
const odPerStep = computed(() => {
  const n = Number(segments.value)
  if (!snapping.value || !Number.isInteger(n) || n < 3) return 0
  return 1 / snapDenomNum.value / Math.tan(((180 / n) * Math.PI) / 180)
})

const snapHint = computed(() => {
  if (!snapping.value) {
    return 'Exact geometry, to the thousandth. Right to the last decimal, but nobody sets a sled stop to 2.1436".'
  }
  return `Cut lengths and the rip width round up to the nearest ${snapLabel.value}. At ` +
    `${segments.value} segments that puts up to ${fmt(odPerStep.value)}" on the blank diameter — ` +
    'wood you turn away, never wood you come up short of.'
})

// ── Stock on hand ────────────────────────────────────────────────────
// 0 means "we choose", which is what the solvers read as "derive the width".
const stockWidthIn = computed(() => (useStockWidth.value ? parseFraction(stockWidthStr.value) : 0))

// Thickness is never a separate question: for a ring it IS the ring height, and
// for a stave it is the wall. Asking twice would give the same number two
// sources of truth.
const stockThicknessIn = computed(() =>
  parseFraction(mode.value === 'stave' ? wallStr.value : ringHeightStr.value),
)

// ── Validation ───────────────────────────────────────────────────────
// Which fields are live depends on the mode; validating hidden fields would
// block the button over a number the user cannot see.
const activeFields = computed(() => {
  const shared = [
    { ref: wallStr, label: 'Wall thickness' },
    ...(useStockWidth.value ? [{ ref: stockWidthStr, label: 'Stock width' }] : []),
  ]
  const allowances = [
    { ref: gapDegStr,    label: 'Open gap',        allowZero: true },
    { ref: marginInStr,  label: 'Inner margin',    allowZero: true },
    { ref: marginOutStr, label: 'Outer margin',    allowZero: true },
    { ref: kerfStr,      label: 'Saw kerf',        allowZero: true },
    { ref: trimPctStr,   label: 'Trim allowance',  allowZero: true },
  ]
  if (mode.value === 'stack') {
    return [
      { ref: baseODStr,      label: 'Base diameter' },
      { ref: wallAngleStr,   label: 'Wall angle' },
      { ref: totalHeightStr, label: 'Total height' },
      { ref: ringHeightStr,  label: 'Ring height' },
      ...shared, ...allowances,
    ]
  }
  if (mode.value === 'ring') {
    return [
      { ref: ringODStr,     label: 'Ring diameter' },
      { ref: ringHeightStr, label: 'Ring height' },
      ...shared, ...allowances,
    ]
  }
  return [
    { ref: baseODStr,      label: 'Base diameter' },
    { ref: wallAngleStr,   label: 'Wall angle' },
    { ref: staveHeightStr, label: 'Height' },
    ...shared,
  ]
})

const fieldErrors = computed(() => {
  const out = {}
  const n = Number(segments.value)
  if (!Number.isInteger(n) || n < 3 || n > 80) {
    out['Segments per ring'] = 'Segments must be a whole number from 3 to 80.'
  }
  for (const f of activeFields.value) {
    const check = validateDimension(f.ref.value, { label: f.label, allowZero: !!f.allowZero })
    if (!check.ok) out[f.label] = check.error
  }
  const angle = parseFraction(wallAngleStr.value)
  if (!out['Wall angle'] && activeFields.value.some((f) => f.label === 'Wall angle') && (angle <= 0 || angle > 90)) {
    out['Wall angle'] = 'Wall angle must be over 0° and no more than 90°.'
  }
  return out
})

const isValid = computed(() => Object.keys(fieldErrors.value).length === 0)
const blockedReason = computed(() => {
  const n = Object.keys(fieldErrors.value).length
  return n === 1 ? 'Fix the highlighted field above to calculate.' : `Fix ${n} highlighted fields above to calculate.`
})

/** Shared attrs for a dimension input, so the error state is never forgotten. */
function fieldAttrs(label) {
  const err = fieldErrors.value[label]
  return {
    'aria-invalid': err ? 'true' : undefined,
    class: [
      'w-full min-h-[40px] border rounded px-2 text-sm bg-surface text-text-primary font-mono',
      err ? 'border-danger bg-danger-bg/40' : 'border-border',
    ],
  }
}

function setGapFraction(d) {
  const n = Number(segments.value)
  if (!Number.isInteger(n) || n < 3) return
  gapDegStr.value = String(Math.round((360 / n / d) * 100) / 100)
}

// ── Calculate ────────────────────────────────────────────────────────
const result = computed(() => store.segResults ?? null)

// Switching what you're building invalidates the plan on screen. Showing the
// old one is worse than showing none, because it still looks authoritative.
// The rounding grid and the stock toggle belong here for the same reason: both
// rewrite every number in the plan, so a stale sheet under a changed toggle
// reads as a sheet computed that way.
watch([mode, snapDenom, useStockWidth], () => {
  store.segResults = null
  solveError.value = ''
})

function calculate() {
  solveError.value = ''
  if (!isValid.value) {
    store.segResults = null
    return
  }
  const shared = {
    n: Number(segments.value),
    mode: diameterMode.value,
    gapDeg: parseFraction(gapDegStr.value),
    marginIn: parseFraction(marginInStr.value),
    marginOut: parseFraction(marginOutStr.value),
    kerf: parseFraction(kerfStr.value),
    trimPct: parseFraction(trimPctStr.value),
    snapDenom: snapDenomNum.value,
  }
  try {
    let out
    if (mode.value === 'stack') {
      out = calcStack({
        ...shared,
        stockWidth: stockWidthIn.value,
        baseOD: parseFraction(baseODStr.value),
        wallAngle: parseFraction(wallAngleStr.value),
        wall: parseFraction(wallStr.value),
        ringHeight: parseFraction(ringHeightStr.value),
        totalHeight: parseFraction(totalHeightStr.value),
        baseStyle: baseStyle.value,
      })
    } else if (mode.value === 'ring') {
      out = calcRing({
        ...shared,
        // A lone ring has only one strip width to begin with, so supplied stock
        // simply becomes that width.
        ripWidth: stockWidthIn.value,
        OD: parseFraction(ringODStr.value),
        wall: parseFraction(wallStr.value),
        ringHeight: parseFraction(ringHeightStr.value),
      })
    } else {
      out = calcStave({
        ...shared,
        stockWidth: stockWidthIn.value,
        baseOD: parseFraction(baseODStr.value),
        wallAngle: parseFraction(wallAngleStr.value),
        height: parseFraction(staveHeightStr.value),
        wall: parseFraction(wallStr.value),
      })
    }

    if (out.error) {
      solveError.value = out.error
      store.segResults = null
      liveMessage.value = out.error
      return
    }
    out.viewMode = mode.value
    store.segResults = out
    liveMessage.value = mode.value === 'stack'
      ? `Plan ready. ${out.totals.ringCount} rings, ${out.totals.segments} segments.`
      : 'Plan ready.'
  } catch (e) {
    solveError.value = `Couldn't build a plan: ${e.message}`
    store.segResults = null
  }
}

function printSheet() { window.print() }

// ── Derived views of the result ──────────────────────────────────────
const buildableRings = computed(() => (result.value?.rings ?? []).filter((r) => !r.error))

/** The ring the drawings and template describe.
 *
 *  This used to pick the widest STRIP, on the reasoning that it was the course
 *  most likely to run out of stock width. Every course now comes off one strip
 *  of the same width, so that test picks whichever ring happens to be first —
 *  the smallest. Longest cut length is the meaningful "biggest ring" now, and
 *  it is also still the one that most nearly runs out of board. */
const refRing = computed(() => {
  if (!result.value) return null
  if (result.value.viewMode === 'ring') return result.value
  if (result.value.viewMode === 'stack') {
    return buildableRings.value.reduce((a, b) => (!a || b.outerEdge > a.outerEdge ? b : a), null)
  }
  return null
})

const summaryTiles = computed(() => {
  const r = result.value
  if (!r) return []
  if (r.viewMode === 'stack') {
    return [
      { label: 'Rings', value: String(r.totals.ringCount) },
      { label: 'Segments', value: String(r.totals.segments) },
      // The number that used to be twenty numbers.
      { label: 'Rip to', value: `${fmt(r.totals.ripWidth)}"` },
      { label: 'Board feet', value: r.totals.boardFeet.toFixed(2) },
    ]
  }
  if (r.viewMode === 'ring') {
    return [
      { label: 'Segments', value: String(r.n) },
      { label: 'Miter', value: `${fmtDeg(r.miter)}°` },
      { label: 'Cut length', value: `${fmt(r.outerEdge)}"` },
      { label: 'Rip to', value: `${fmt(r.stripWidth)}"` },
    ]
  }
  return [
    { label: 'Staves', value: String(r.n) },
    { label: 'Edge bevel', value: `${fmtDeg(r.bevel)}°` },
    { label: 'Stave length', value: `${fmt(r.staveLength)}"` },
    { label: 'Top width', value: `${fmt(r.widthTop)}"` },
  ]
})

/** Things the rounding or the supplied stock did that the user needs told.
 *
 * All of these are advisories, not errors: a merged course still glues up and a
 * narrow board still makes a ring. What they change is the finished result, and
 * a plan that quietly changes the finished result is the one thing this sheet
 * must not do. */
const advisories = computed(() => {
  const r = result.value
  if (!r) return []
  const out = []

  const courseList = (idx) => {
    if (idx.length === 1) return `Course ${idx[0]}`
    if (idx.length === 2) return `Courses ${idx[0]} and ${idx[1]}`
    return `Courses ${idx.slice(0, -1).join(', ')} and ${idx[idx.length - 1]}`
  }

  if (r.viewMode === 'stack' && r.mergedCourses?.length) {
    out.push({
      key: 'merged',
      title: `Rounding to ${snapLabel.value} merges courses`,
      lines: [
        ...r.mergedCourses.map(
          (g) => `${courseList(g)} land on the same ${fmt(
            buildableRings.value.find((x) => x.index === g[0])?.outerEdge,
          )}" cut length.`,
        ),
        `The grid step (${fmt(r.snapStep)}") is coarser than the taper's own step ` +
          `(${fmt(r.naturalStep)}"), so the blank steps instead of tapering.`,
        'Nothing is undersize — every course rounded up — but more wood ends up as ' +
          'shavings. A finer grid keeps each course its own size.',
      ],
    })
  }

  if (r.viewMode === 'stack' && r.shortRings?.length) {
    out.push({
      key: 'short',
      title: `${fmt(r.totals.ripWidth)}" stock is narrower than ${
        r.shortRings.length === 1 ? 'one course' : `${r.shortRings.length} courses`
      } need`,
      lines: [
        `${courseList(r.shortRings)} need ${fmt(r.totals.stripNeeded)}" of width to bore out to ` +
          'the wall thickness you asked for.',
        `At ${fmt(r.totals.ripWidth)}" the inner corners stay proud of the bore, so the wall ` +
          `finishes thinner than asked at ${r.n} points around each of those rings.`,
        `Rip ${fmt(snapUp(r.totals.stripNeeded, snapDenomNum.value))}" or wider, or use more ` +
          'segments — more segments put the corners closer to the circle.',
      ],
    })
  }

  if (r.viewMode === 'ring' && r.stockShort) {
    out.push({
      key: 'short-ring',
      title: `${fmt(r.stripWidth)}" stock is narrower than this ring needs`,
      lines: [
        `The ring needs ${fmt(r.stripNeed)}" of width to bore out to a ${fmt(r.ID)}" inside.`,
        `At ${fmt(r.stripWidth)}" the smallest round bore you can cut is ${fmt(r.minBore)}".`,
      ],
    })
  }

  if (r.viewMode === 'stave' && r.stockShort) {
    out.push({
      key: 'short-stave',
      title: `${fmt(r.stockWidth)}" stock is narrower than a stave`,
      lines: [
        `The wide end of each stave is ${fmt(r.stockNeeded)}" across.`,
        'A stave is sawn to its taper, not turned to it, so the board has to be that wide.',
      ],
    })
  }

  if (r.viewMode === 'stave' && r.taperLost) {
    out.push({
      key: 'taper',
      title: `Rounding to ${snapLabel.value} flattened the taper`,
      lines: [
        'Both ends of the stave landed on the same width, so this would come out a ' +
          'cylinder rather than the flare you described.',
        'Use a finer grid, or a taller vessel where the two ends are further apart.',
      ],
    })
  }

  return out
})

const ringRows = computed(() => {
  const r = result.value
  if (!r || r.viewMode !== 'ring') return []
  const rows = [
    { label: 'Miter, each end', value: `${fmtDeg(r.miter)}°` },
    { label: 'Cut length (outer edge)', value: `${fmt(r.outerEdge)}"` },
  ]
  // Asked against got, side by side. The point of rounding is that you set the
  // rounded number, so the exact one is context, not the instruction.
  if (r.asked && Math.abs(r.asked.outerEdge - r.outerEdge) > 0.0005) {
    rows.push({ label: 'Exact length would be', value: `${fmt(r.asked.outerEdge)}"` })
  }
  rows.push(
    { label: 'Inner edge', value: `${fmt(r.innerEdge)}"` },
    { label: 'Strip width', value: `${fmt(r.stripWidth)}"` },
    { label: 'Blank corner diameter', value: `${fmt(r.outerCorner * 2)}"` },
    { label: 'Turns to', value: `${fmt(r.turnsTo)}"` },
    { label: 'Bores to', value: `${fmt(r.boresTo)}"` },
  )
  if (Number.isFinite(r.maxRound) && r.maxRound - r.turnsTo > 0.0005) {
    rows.push({ label: 'Largest round OD the blank gives', value: `${fmt(r.maxRound)}"` })
  }
  if (Number.isFinite(r.minBore) && r.boresTo - r.minBore > 0.0005) {
    rows.push({ label: 'Smallest round bore it allows', value: `${fmt(r.minBore)}"` })
  }
  if (r.mode === 'blank' && r.turnsTo < r.OD) {
    rows.push({ label: 'Lost to turning', value: `${fmt(r.OD - r.turnsTo)}"` })
  }
  return rows
})

const staveRows = computed(() => {
  const r = result.value
  if (!r || r.viewMode !== 'stave') return []
  const rows = [
    { label: 'Edge bevel, each edge', value: `${fmtDeg(r.bevel)}°` },
    { label: 'Stave length (along the slope)', value: `${fmt(r.staveLength)}"` },
    { label: 'Width at the base', value: `${fmt(r.widthBase)}"` },
    { label: 'Width at the top', value: `${fmt(r.widthTop)}"` },
    { label: 'Taper, each edge', value: `${fmt(r.taperPerEdge)}"` },
    { label: 'Base diameter', value: `${fmt(r.baseOD)}"` },
    { label: 'Top diameter', value: `${fmt(r.topOD)}"` },
  ]
  // Rounding the two end widths up moves the vessel it produces, so say which
  // vessel you actually get before someone measures theirs against the input.
  if (
    r.asked &&
    (Math.abs(r.asked.baseOD - r.baseOD) > 0.0005 || Math.abs(r.asked.topOD - r.topOD) > 0.0005)
  ) {
    rows.push({
      label: 'Asked for',
      value: `${fmt(r.asked.baseOD)}" base, ${fmt(r.asked.topOD)}" top`,
    })
  }
  return rows
})

const stockRows = computed(() => {
  const r = result.value
  if (!r) return []
  if (r.viewMode === 'stack') {
    const t = r.totals
    const rows = [
      {
        label: r.stockWidth > 0 ? 'Your stock, ripped to' : 'Rip strips to',
        value: `${fmt(t.ripWidth)}"`,
      },
      { label: 'Stock thickness', value: `${fmt(r.ringHeight)}"` },
    ]
    // Only worth a row when it differs from what you'll actually set the fence
    // to — otherwise it is the same number twice.
    if (Math.abs(t.stripNeeded - t.ripWidth) > 0.0005) {
      rows.push({ label: 'Widest course needs', value: `${fmt(t.stripNeeded)}"` })
    }
    if (t.maxExtraOD > 0.0005) {
      rows.push({ label: 'Most to turn off any course', value: `${fmt(t.maxExtraOD)}" on the OD` })
    }
    if (t.maxExtraBore > 0.0005) {
      rows.push({ label: 'Most to bore out any course', value: `${fmt(t.maxExtraBore)}" on the ID` })
    }
    rows.push({ label: 'Total strip length', value: `${fmt(t.boardLength)}"` })
    if (t.extraStrip > 0.0005) {
      rows.push({
        label: 'Of that, cost of rounding',
        value: `${fmt(t.extraStrip)}" (${((t.extraStrip / t.boardLength) * 100).toFixed(1)}%)`,
      })
    }
    if (r.base) {
      rows.push({ label: 'Solid base disc', value: `${fmt(r.base.diameter)}" × ${fmt(r.base.thickness)}"` })
    }
    rows.push({ label: 'Board feet (kerf and trim in)', value: r.totals.boardFeet.toFixed(2) })
    return rows
  }
  if (r.viewMode === 'ring') {
    const rows = [
      { label: r.stockShort ? 'Your stock' : 'Rip strip to', value: `${fmt(r.stripWidth)}"` },
      { label: 'Stock thickness', value: `${fmt(r.ringHeight)}"` },
    ]
    if (r.extraOD > 0.0005) {
      rows.push({ label: 'Extra to turn off', value: `${fmt(r.extraOD)}" on the OD` })
    }
    if (r.extraBore > 0.0005) {
      rows.push({ label: 'Extra to bore out', value: `${fmt(r.extraBore)}" on the ID` })
    }
    rows.push(
      { label: 'Strip length needed', value: `${fmt(r.boardLength)}"` },
      { label: 'Board feet', value: r.boardFeet.toFixed(3) },
    )
    return rows
  }
  return [
    { label: 'Stock length needed', value: `${fmt(r.boardLength)}"` },
    { label: 'Stock width (at least)', value: `${fmt(r.stockNeeded ?? r.widthTop)}"` },
    { label: 'Stock thickness', value: `${fmt(stockThicknessIn.value)}"` },
    { label: 'Board feet', value: r.boardFeet.toFixed(3) },
  ]
})

const assemblyNotes = computed(() => {
  const r = result.value
  if (!r) return []
  if (r.viewMode === 'stave') {
    return [
      `Rip ${r.n} staves to ${fmt(r.widthTop)}" wide and at least ${fmt(r.staveLength)}" long.`,
      `Set the blade to ${fmtDeg(r.bevel)}° and bevel both edges of every stave.`,
      'Lay the staves face down edge to edge, tape the joints, then roll it up and band it.',
      'Dry-fit the whole barrel and check the last joint before any glue goes on.',
    ]
  }
  const ripTo = r.viewMode === 'stack' ? r.totals.ripWidth : r.stripWidth
  const notes = [
    `Rip everything to one width — ${fmt(ripTo)}" — out of stock ${fmt(r.ringHeight)}" thick. ` +
      'The fence gets set once for the whole build.',
    `Set the sled to ${fmtDeg(refRing.value?.miter ?? 0)}° and cut alternating, flipping the strip between cuts.`,
    'Flip the strip between every cut so the segments nest — that is what the board length below assumes, and it saves real stock.',
    'Dry-fit each ring on a flat surface before glue — a ring that will not close needs the sled adjusted, not more clamp pressure.',
    'Sand both faces of every glued ring flat before stacking. Errors here compound up the stack.',
  ]
  if (snapping.value) {
    notes.splice(2, 0,
      `Every cut length is a round ${snapLabel.value}, so set the stop off a tape. The miter is ` +
      'not rounded and must not be: the angle is what closes the ring, the length only decides ' +
      'which diameter you land on.',
    )
  }
  if (r.viewMode === 'stack') {
    notes.push(`Rotate every other course by ${fmtDeg(180 / r.n)}° so the joints stagger like brickwork.`)
    if (r.base) notes.push(`Glue up the ${fmt(r.base.diameter)}" base disc and screw the faceplate to it.`)
    notes.push('Glue one ring at a time to the stack, turning the outside as you go if the bowl gets deep.')
  }
  if (r.gapDeg > 0) {
    notes.push(`Open ring: each segment spans ${fmtDeg(r.span)}° with a ${fmtDeg(r.gapDeg)}° gap. Use spacers to hold the gaps while the glue sets.`)
  }
  return notes
})

// ── Ring plan drawing ────────────────────────────────────────────────
// SVG y runs down, so every y is negated on the way in.
const ringPolys = computed(() => {
  const r = refRing.value
  if (!r) return []
  return ringOutlines(r, r.rotateBy ?? 0).map((poly) =>
    poly.map((p) => `${round(p.x)},${round(-p.y)}`).join(' '),
  )
})

const ringViewBox = computed(() => {
  const r = refRing.value
  if (!r) return '0 0 1 1'
  const R = r.outerCorner * 1.04
  return `${round(-R)} ${round(-R)} ${round(R * 2)} ${round(R * 2)}`
})

const ringStroke = computed(() => (refRing.value ? refRing.value.outerCorner * 0.006 : 0.01))

const ringDesc = computed(() => {
  const r = refRing.value
  if (!r) return ''
  return `${r.n} segments, each mitered ${fmtDeg(r.miter)} degrees at both ends. ` +
    `Outer edge ${fmt(r.outerEdge)} inches, inner edge ${fmt(r.innerEdge)} inches, ` +
    `cut from a strip ${fmt(r.stripWidth)} inches wide. ` +
    `The blank measures ${fmt(r.outerCorner * 2)} inches across the corners and turns to ${fmt(r.turnsTo)} inches.`
})

// ── Single segment drawing ───────────────────────────────────────────
// Laid out in its own box rather than in ring coordinates: the trapezoid is a
// couple of inches across while the ring is ten, so sharing a scale made the
// callouts either microscopic or (as shipped first) enormous.
const seg = computed(() => {
  const r = refRing.value
  if (!r) return { w: 1, h: 1, points: '', font: 0.1, stroke: 0.01, gap: 0.1, top: 0, bottom: 1, leftEdge: 0, rightEdge: 1 }

  const pts = segmentOutline(r)
  const contentW = r.outerEdge
  const contentH = r.stripWidth

  const font = contentW * 0.085
  const gap = contentW * 0.05
  // Asymmetric on purpose: the right side carries the strip-width leader and
  // its label, the left only a small miter callout. Padding both sides to the
  // wider figure would shrink the drawing for nothing.
  const padLeft = contentW * 0.2
  const padRight = contentW * 0.5
  const padY = font * 1.9

  const w = padLeft + contentW + padRight
  const h = contentH + padY * 2
  const top = padY
  const bottom = padY + contentH
  const cx = padLeft + contentW / 2

  // p.y runs aIn..aOut; SVG y runs down. Outer edge along the top.
  const points = pts
    .map((p) => `${round(p.x + cx)},${round(top + (r.aOut - p.y))}`)
    .join(' ')

  const xs = pts.map((p) => p.x + cx)
  return {
    w: round(w), h: round(h), points, top: round(top), bottom: round(bottom),
    leftEdge: round(Math.min(...xs)), rightEdge: round(Math.max(...xs)),
    font: round(font), stroke: round(contentW * 0.006), gap: round(gap),
  }
})

/** Every ring's segment at ONE shared scale, for the screen.
 *  Drawing each to fit its own tile would make them all look the same size,
 *  which is the opposite of the point — the whole reason a stack needs a
 *  per-ring cut list is that the segments are not interchangeable. */
const GALLERY_MAX_PX = 190

const gallery = computed(() => {
  const r = result.value
  if (!r || r.viewMode !== 'stack') return []
  const rings = buildableRings.value
  if (!rings.length) return []

  const widest = Math.max(...rings.map((x) => x.outerEdge))
  const pxPerInch = GALLERY_MAX_PX / widest

  return rings.map((ring) => {
    const m = ring.outerEdge * 0.03           // room for the stroke
    const vw = round(ring.outerEdge + m * 2)
    const vh = round(ring.stripWidth + m * 2)
    const points = segmentOutline(ring)
      .map((pt) => `${round(pt.x + vw / 2)},${round(m + (ring.aOut - pt.y))}`)
      .join(' ')
    return {
      index: ring.index,
      points, vw, vh,
      px: Math.round(ring.outerEdge * pxPerInch),
      outerEdge: ring.outerEdge,
      stripWidth: ring.stripWidth,
      stroke: round(ring.outerEdge * 0.012),
      // Alternate the two timber tones, matching the ring plan above.
      fill: ring.index % 2 === 1 ? '#e8d5b0' : '#d4a84b',
    }
  })
})

// ── Stave drawings ───────────────────────────────────────────────────
// Three views, each answering a different question:
//   flat    — what do I mark out on the board?
//   section — what does the blade tilt actually do to the edge?
//   elev    — is this the vessel I meant to describe?
// All three hold true proportion; none clamps an axis to fill its box.
const staveWallIn = computed(() => parseFraction(wallStr.value))

const stave = computed(() => {
  const r = result.value
  if (!r || r.viewMode !== 'stave') return null

  // 1. The stave laid flat. Narrow end down: the base is the small end.
  const L = r.staveLength
  const wide = Math.max(r.widthTop, r.widthBase)
  const fFont = wide * 0.17
  const fPad = fFont * 2.2
  // The length label sits to the right of the stave, so that side needs room
  // for six monospace characters. Padding both sides equally either clipped
  // the label or shrank the drawing to make space it did not need on the left.
  const fPadL = fFont * 0.8
  const fPadR = fFont * 4.4
  const fw = wide + fPadL + fPadR
  const fh = L + fPad * 2
  const cx = fPadL + wide / 2
  const flat = {
    w: round(fw), h: round(fh), pad: round(fPad),
    font: round(fFont), stroke: round(wide * 0.012),
    points: [
      [cx - r.widthTop / 2, fPad],
      [cx + r.widthTop / 2, fPad],
      [cx + r.widthBase / 2, fPad + L],
      [cx - r.widthBase / 2, fPad + L],
    ].map(([x, y]) => `${round(x)},${round(y)}`).join(' '),
  }

  // 2. Cross-section, looking down the stave. The outer face is the wide one;
  //    both edges lean in by the bevel so n of them close into a ring.
  const t = staveWallIn.value || wide * 0.15
  const lean = t * Math.tan(r.bevel * Math.PI / 180)
  const outW = r.widthBase
  const inW = outW - 2 * lean
  const valid = inW > outW * 0.05
  const drawInW = valid ? inW : outW * 0.05
  const sFont = outW * 0.19
  const sPad = sFont * 2.0
  const sw = outW + sPad * 2
  const sh = t + sPad * 2
  const scx = sw / 2
  const section = {
    w: round(sw), h: round(sh), pad: round(sPad), valid,
    font: round(sFont), stroke: round(outW * 0.012),
    top: round(sPad), bottom: round(sPad + t),
    refX: round(scx + outW / 2),
    points: [
      [scx - outW / 2, sPad],
      [scx + outW / 2, sPad],
      [scx + drawInW / 2, sPad + t],
      [scx - drawInW / 2, sPad + t],
    ].map(([x, y]) => `${round(x)},${round(y)}`).join(' '),
  }

  // 3. Elevation, in section. Widest dimension drives the type size so the
  //    labels stay legible whether the vessel is squat or tall.
  const eWide = Math.max(r.topOD, r.baseOD)
  const eFont = eWide * 0.1
  const ePad = eFont * 2.2
  const ew = eWide + ePad * 2
  const eh = r.height + ePad * 2
  const ecx = ew / 2
  const wallH = Math.min(t, r.baseOD / 2 * 0.6)
  const quad = (bw, tw, y0, y1) => [
    [ecx - tw / 2, y0], [ecx + tw / 2, y0], [ecx + bw / 2, y1], [ecx - bw / 2, y1],
  ].map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
  const elev = {
    w: round(ew), h: round(eh), pad: round(ePad),
    font: round(eFont), stroke: round(eWide * 0.008),
    outer: quad(r.baseOD, r.topOD, ePad, ePad + r.height),
    inner: quad(Math.max(0.01, r.baseOD - wallH * 2), Math.max(0.01, r.topOD - wallH * 2), ePad + wallH, ePad + r.height),
  }

  return { flat, section, elev }
})

// ── Full-scale template ──────────────────────────────────────────────
// Inches in, inches out. 1 user unit == 1 inch, so width="Nin" prints true size.
const TEMPLATE_MARGIN_IN = 0.18

/** One template per distinct ring, because in a tapered stack every course has
 *  its own geometry — a template for the widest ring is wrong for all the rest.
 *  They tile: at 12 segments most are only a couple of inches across. */
const templates = computed(() => {
  const r = result.value
  if (!r) return []
  const rings = r.viewMode === 'stack' ? buildableRings.value
    : r.viewMode === 'ring' ? [r]
    : []
  return rings.map((ring, i) => {
    const w = round(ring.outerEdge + TEMPLATE_MARGIN_IN * 2)
    const h = round(ring.stripWidth + TEMPLATE_MARGIN_IN * 2)
    // Re-origin into the template box: centre on x, outer edge along the top.
    // p.y runs from aIn (inner) to aOut (outer) and SVG y runs down, so
    // y = margin + (aOut - p.y) puts the outer edge at y = margin.
    const points = segmentOutline(ring)
      .map((p) => `${round(p.x + w / 2)},${round(TEMPLATE_MARGIN_IN + (ring.aOut - p.y))}`)
      .join(' ')
    return {
      key: ring.index ?? i,
      label: ring.index ? `Ring ${ring.index}` : 'Segment',
      count: ring.n,
      miter: fmtDeg(ring.miter),
      length: ring.outerEdge,
      w, h, points,
      tooWide: w > USABLE_PAGE_IN,
    }
  })
})

const templateCaption = computed(() => {
  const r = result.value
  if (!r) return ''
  const strip = ripWidthIn.value ? ` All from one ${fmt(ripWidthIn.value)}" strip.` : ''
  if (r.viewMode === 'stack') {
    return 'One template per course, bottom to top. Spray-glue it to the strip end or use it ' +
      `to set the sled stop.${strip}`
  }
  return `Cut ${r.n} of these, mitered ${fmtDeg(r.miter)}° at both ends.${strip}`
})

/** The one rip width, whichever mode produced it. Null for staves, which are
 *  sawn to a taper rather than cut off a constant-width strip. */
const ripWidthIn = computed(() => {
  const r = result.value
  if (!r) return null
  if (r.viewMode === 'stack') return r.totals.ripWidth
  if (r.viewMode === 'ring') return r.stripWidth
  return null
})

function round(v) {
  return Math.round(v * 10000) / 10000
}
</script>
