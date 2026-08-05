import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { solve, solveOptimized } from '@/solver'
import { parseFraction, validateDimension, validateQty } from '@/utils/fractions'
import { solveResaw } from '@/resawSolver'

export const useProjectStore = defineStore('project', () => {
  // What the user is building. Printed on the cut sheet and used to name the
  // export file, so a plan taped to the wall says what it's for.
  const projectName = ref('')

  // ─── Settings ──────────────────────────────────────────────────────────────
  const settings = ref({
    kerf: 0.125,
    planingAllowance: 0.0625,
    allowResaw: true,
    resawFaceAllowance: 0.0625,
    conditionAllowances: {
      'rough':       { thickness: 0.25,   width: 0.25  },
      'skip-planed': { thickness: 0.125,  width: 0.25  },
      's3s':         { thickness: 0.0625, width: 0.125 },
      's4s':         { thickness: 0,      width: 0     },
    },
  })

  // ─── Stock (sample data pre-filled) ────────────────────────────────────────
  // The shipped example used to be a single 1 1/2" board against 1 1/2" legs,
  // which cannot work once conditioning comes off the thickness — so a new
  // user's first click returned 2 of 6 parts placed and 84% waste in red. This
  // is the stock you'd actually buy for the parts below: 8/4 for the legs,
  // 4/4 for the rails, both sized close to the job.
  function defaultStock() {
    return [
      {
        id: 's1',
        label: '8/4 leg stock',
        lengthStr: '60',
        widthStr: '4',
        thicknessStr: '2',
        qty: 1,
        condition: 'skip-planed',
      },
      {
        id: 's2',
        label: '4/4 rail stock',
        lengthStr: '76',
        widthStr: '4',
        thicknessStr: '1',
        qty: 1,
        condition: 'skip-planed',
      },
    ]
  }

  const stock = ref(defaultStock())

  // ─── Parts (sample data pre-filled) ────────────────────────────────────────
  const parts = ref([
    { id: 'p1', label: 'Leg',  lengthStr: '28', widthStr: '1 3/4', thicknessStr: '1 1/2', qty: 4 },
    { id: 'p2', label: 'Rail', lengthStr: '36', widthStr: '3',     thicknessStr: '3/4',   qty: 2 },
  ])

  const results = ref(null)
  const nextId  = ref(10)

  // True once an input changes after a solve, so the view can say the plan on
  // screen no longer matches the numbers above it.
  const resultsStale = ref(false)

  // ─── Validation ────────────────────────────────────────────────────────────
  // Every dimension field is checked here rather than at solve time. Invalid
  // values used to parse to 0 and drop the row from both the plan and the
  // "parts placed" denominator, so the summary reported success on a cut list
  // that had silently lost work.
  const DIMENSION_FIELDS = [
    { key: 'lengthStr',    label: 'Length' },
    { key: 'widthStr',     label: 'Width' },
    { key: 'thicknessStr', label: 'Thickness' },
  ]

  function issuesForRows(rows, kind) {
    const found = []
    rows.forEach((row, index) => {
      const name = String(row.label || '').trim() || `${kind} ${index + 1}`
      for (const field of DIMENSION_FIELDS) {
        const check = validateDimension(row[field.key], { label: field.label })
        if (!check.ok) found.push({ id: row.id, field: field.key, name, message: check.error })
      }
      const qtyCheck = validateQty(row.qty)
      if (!qtyCheck.ok) found.push({ id: row.id, field: 'qty', name, message: qtyCheck.error })
    })
    return found
  }

  const stockIssues = computed(() => issuesForRows(stock.value, 'Board'))
  const partIssues  = computed(() => issuesForRows(parts.value, 'Part'))
  const allIssues   = computed(() => [...stockIssues.value, ...partIssues.value])
  const isValid     = computed(() => allIssues.value.length === 0)

  /** Look up the message for one field, for inline display. */
  function issueFor(id, field) {
    return allIssues.value.find(i => i.id === id && i.field === field)?.message ?? null
  }

  // ─── Stock management ──────────────────────────────────────────────────────
  function addStock() {
    stock.value.push({
      id: `s${nextId.value++}`,
      label: `Board ${stock.value.length + 1}`,
      lengthStr: '96',
      widthStr: '8',
      thicknessStr: '1 1/2',
      qty: 1,
      condition: 'skip-planed',
    })
  }

  function removeStock(id) {
    stock.value = stock.value.filter(s => s.id !== id)
  }

  // ─── Parts management ──────────────────────────────────────────────────────
  function addPart() {
    parts.value.push({
      id: `p${nextId.value++}`,
      label: `Part ${parts.value.length + 1}`,
      lengthStr: '24',
      widthStr: '3',
      thicknessStr: '3/4',
      qty: 1,
    })
  }

  function removePart(id) {
    parts.value = parts.value.filter(p => p.id !== id)
  }

  // ─── Calculate ─────────────────────────────────────────────────────────────
  function calculate() {
    // Refuse rather than silently drop rows. The view surfaces allIssues.
    if (!isValid.value) {
      results.value = null
      resultsStale.value = false
      return false
    }

    const parsedStock = stock.value.map(s => ({
      ...s,
      length:    parseFraction(s.lengthStr),
      width:     parseFraction(s.widthStr),
      thickness: parseFraction(s.thicknessStr),
    }))

    const parsedParts = parts.value.map(p => ({
      ...p,
      length:    parseFraction(p.lengthStr),
      width:     parseFraction(p.widthStr),
      thickness: parseFraction(p.thicknessStr),
    }))

    results.value = solveOptimized({ stock: parsedStock, parts: parsedParts, settings: settings.value })
    resultsStale.value = false
    return true
  }

  // ─── Import / Export / Persistence ─────────────────────────────────────────
  // A file can be valid JSON and still be the wrong shape — an older export, a
  // hand-edited file, or another app's data. Assigning those straight into the
  // refs used to crash the render, and the save watcher then persisted the
  // broken state, so the next load was broken too. Everything below is checked
  // before it is assigned, and anything unrecognised is skipped.
  const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

  /** Keep only array entries that are objects; drop the rest. */
  const objectRows = (v) => (Array.isArray(v) ? v.filter(isPlainObject) : null)

  function loadProject(data) {
    if (!isPlainObject(data)) {
      throw new Error("That file doesn't look like a Yield project.")
    }

    if (typeof data.projectName === 'string') projectName.value = data.projectName

    const importedStock = objectRows(data.stock)
    const importedParts = objectRows(data.parts)
    const importedSkus  = objectRows(data.resawSkus)

    if (importedStock) stock.value = importedStock
    if (importedParts) parts.value = importedParts
    if (isPlainObject(data.settings)) {
      settings.value = { ...settings.value, ...data.settings }
    }
    if (isPlainObject(data.resawStock)) {
      resawStock.value = { ...resawStock.value, ...data.resawStock }
    }
    if (isPlainObject(data.resawSettings)) {
      resawSettings.value = { ...resawSettings.value, ...data.resawSettings }
    }
    if (importedSkus) resawSkus.value = importedSkus
    if (isPlainObject(data.binSettings)) {
      binSettings.value = { ...binSettings.value, ...data.binSettings }
    }
    if (isPlainObject(data.crosscutSettings)) {
      const lengths = data.crosscutSettings.blankLengths
      crosscutSettings.value = {
        blankLengths:   Array.isArray(lengths) ? lengths.map(String) : ['36'],
        miterKerfStr:   String(data.crosscutSettings.miterKerfStr   ?? '1/8'),
        snipeBufferStr: String(data.crosscutSettings.snipeBufferStr ?? '0'),
      }
    }
    results.value      = null
    resawResults.value = null
    resawError.value   = null
    binResults.value   = null
  }

  // ─── Persistence (localStorage) ────────────────────────────────────────────
  const STORAGE_KEY = 'yieldProjectState'

  function saveToLocalStorage() {
    const state = {
      projectName: projectName.value,
      settings: settings.value,
      stock: stock.value,
      parts: parts.value,
      resawStock: resawStock.value,
      resawSettings: resawSettings.value,
      crosscutSettings: crosscutSettings.value,
      resawSkus: resawSkus.value,
      binSettings: binSettings.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      // Private browsing or a full quota — losing autosave is survivable,
      // taking the app down with it is not.
      console.warn('Could not save project locally', e)
    }
  }

  function loadFromLocalStorage() {
    let saved = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
    if (!saved) return false

    try {
      loadProject(JSON.parse(saved))
      return true
    } catch (e) {
      // The saved state is unusable. Drop it so the next load starts clean
      // instead of rehydrating the same broken data forever.
      console.error('Discarding unreadable saved project', e)
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* nothing to do */ }
      return false
    }
  }

  function resetToDefaults() {
    if (!confirm('Reset all inputs to defaults? This cannot be undone.')) return

    projectName.value = ''

    settings.value = {
      kerf: 0.125,
      planingAllowance: 0.0625,
      allowResaw: true,
      resawFaceAllowance: 0.0625,
      conditionAllowances: {
        'rough':       { thickness: 0.25,   width: 0.25  },
        'skip-planed': { thickness: 0.125,  width: 0.25  },
        's3s':         { thickness: 0.0625, width: 0.125 },
        's4s':         { thickness: 0,      width: 0     },
      },
    }

    stock.value = defaultStock()

    parts.value = [
      { id: 'p1', label: 'Leg',  lengthStr: '28', widthStr: '1 3/4', thicknessStr: '1 1/2', qty: 4 },
      { id: 'p2', label: 'Rail', lengthStr: '36', widthStr: '3',     thicknessStr: '3/4',   qty: 2 },
    ]

    resawStock.value = {
      qty: 5,
      thicknessStr: '1 15/16',
      widthStr: '7',
      lengthStr: '120',
      condition: 'skip-planed',
    }

    resawSettings.value = {
      kerfStr: '1/16',
      panelTargetStr: '3/8',
      slabAllowanceStr: '0.010',
    }

    crosscutSettings.value = {
      blankLengths: ['36', '24'],
      miterKerfStr: '1/8',
      snipeBufferStr: '2',
    }

    resawSkus.value = [...defaultSkus]
    binSettings.value = defaultBinSettings()
    binResults.value = null

    results.value = null
    resultsStale.value = false
    resawResults.value = null
    resawError.value = null
    nextId.value = 10

    localStorage.removeItem(STORAGE_KEY)
  }

  // Watch for changes and debounce save (300ms)
  let saveTimeout = null
  const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveToLocalStorage, 300)
  }

  // ─── Resaw Planner ─────────────────────────────────────────────────────────
  const resawStock = ref({
    qty: 5,
    thicknessStr: '1 15/16',
    widthStr: '7',
    lengthStr: '120',
    condition: 'skip-planed',
  })

  const resawSettings = ref({
    kerfStr: '1/16',
    panelTargetStr: '3/8',
    slabAllowanceStr: '0.010',
  })

  const crosscutSettings = ref({
    blankLengths: ['36', '24'],  // multiple acceptable blank lengths for optimizer
    miterKerfStr: '1/8',
    snipeBufferStr: '2',          // extra length per blank to account for planer snipe / safety
  })

  const defaultSkus = [
    { id: 'sku1', name: 'Standard 12\"', roughWidthStr: '0.150', planeAllowance: 0.010, sanderAllowance: 0.010, finalWidthStr: '0.130', length: 12, tableKerfStr: '1/8', panelDepthStr: '3/8' },
    { id: 'sku2', name: 'Wide 12\"',     roughWidthStr: '0.150', planeAllowance: 0.010, sanderAllowance: 0.010, finalWidthStr: '0.130', length: 12, tableKerfStr: '1/8', panelDepthStr: '3/4' },
    { id: 'sku3', name: 'Standard 24\"', roughWidthStr: '0.150', planeAllowance: 0.010, sanderAllowance: 0.010, finalWidthStr: '0.130', length: 24, tableKerfStr: '1/8', panelDepthStr: '3/8' },
    { id: 'sku4', name: 'Wide 24\"',     roughWidthStr: '0.150', planeAllowance: 0.010, sanderAllowance: 0.010, finalWidthStr: '0.130', length: 24, tableKerfStr: '1/8', panelDepthStr: '3/4' },
  ]

  const resawSkus = ref([...defaultSkus])
  const resawResults = ref(null)
  const resawError = ref(null)

  // ─── Box Planner ───────────────────────────────────────────────────────────
  // Lives in the store so it inherits persistence, Export, and Reset like the
  // other two tools. As component-local refs it was silently disposable.
  function defaultBinSettings() {
    return {
      mode: 'inner',
      widthStr: '12',
      depthStr: '8',
      heightStr: '6',
      qty: 1,
      matThicknessStr: '15/32',
      dadoDepthStr: '1/4',
      kerfStr: '1/8',
      availableSheets: [{ w: '48', h: '96' }],
    }
  }

  const binSettings = ref(defaultBinSettings())
  const binResults = ref(null)

  // Watch all reactive state (deep). Must come after every ref above is
  // declared — a watch registered earlier reads them in the temporal dead zone.
  watch(
    [projectName, settings, stock, parts, resawStock, resawSettings, crosscutSettings, resawSkus, binSettings],
    debouncedSave,
    { deep: true },
  )

  // A plan on screen that no longer matches the inputs above it is worse than
  // no plan, because it still looks authoritative. Mark it rather than clear it.
  watch([settings, stock, parts], () => {
    if (results.value) resultsStale.value = true
  }, { deep: true })

  // Hydrate on store creation (runs once)
  loadFromLocalStorage()

  function addBlankLength() {
    crosscutSettings.value.blankLengths.push('24')
  }

  function removeBlankLength(index) {
    crosscutSettings.value.blankLengths.splice(index, 1)
  }

  function addResawSku() {
    resawSkus.value.push({
      id: `rsku${nextId.value++}`,
      name: 'New SKU',
      roughWidthStr: '0.150',
      planeAllowance: 0.010,
      sanderAllowance: 0.010,
      finalWidthStr: '0.130',
      length: 12,
      tableKerfStr: '1/8',
      panelDepthStr: '3/8',
    })
  }

  function removeResawSku(id) {
    resawSkus.value = resawSkus.value.filter(s => s.id !== id)
  }

  function calculateResaw() {
    resawError.value = null
    // Validate SKU geometry
    for (const s of resawSkus.value) {
      const rough = parseFraction(s.roughWidthStr)
      const final = parseFraction(s.finalWidthStr)
      if (final >= rough) {
        resawError.value = `SKU \"${s.name}\": Final face (${final}\") must be less than rough rip face (${rough}\"). Check plane and sander allowances.`
        resawResults.value = null
        return
      }
    }
    try {
    resawResults.value = solveResaw({
      stock: {
        thickness: parseFraction(resawStock.value.thicknessStr),
        width:     parseFraction(resawStock.value.widthStr),
        length:    parseFraction(resawStock.value.lengthStr),
        qty:       resawStock.value.qty,
        condition: resawStock.value.condition,
      },
      resawSettings: {
        kerf:          parseFraction(resawSettings.value.kerfStr),
        panelTarget:   parseFraction(resawSettings.value.panelTargetStr),
        slabAllowance: parseFraction(resawSettings.value.slabAllowanceStr),
      },
      crosscutSettings: {
        // Add snipe buffer to each blank length before optimizer runs
        blankLengths: crosscutSettings.value.blankLengths
          .map(s => parseFraction(s) + parseFraction(crosscutSettings.value.snipeBufferStr))
          .filter(l => l > 0),
        blankTargetLengths: crosscutSettings.value.blankLengths.map(s => parseFraction(s)).filter(l => l > 0), // nominal (without buffer)
        snipeBuffer: parseFraction(crosscutSettings.value.snipeBufferStr),
        miterKerf:    parseFraction(crosscutSettings.value.miterKerfStr),
      },
      stripSettings: resawSkus.value.map(s => ({
        ...s,
        roughWidth:  parseFraction(s.roughWidthStr),
        finalWidth:  parseFraction(s.finalWidthStr),
        tableKerf:   parseFraction(s.tableKerfStr),
        panelDepth:  parseFraction(s.panelDepthStr ?? resawSettings.value.panelTargetStr),
        depth:       parseFraction(s.panelDepthStr ?? resawSettings.value.panelTargetStr),
      })),
    })
    } catch(e) {
      console.error('[calculateResaw]', e)
      resawResults.value = null
      resawError.value = e.message || 'Unknown error'
    }
  }

  return {
    projectName,
    settings, stock, parts, results, resultsStale,
    addStock, removeStock, addPart, removePart,
    calculate, loadProject, resetToDefaults,
    // Validation
    stockIssues, partIssues, allIssues, isValid, issueFor,
    // Resaw Planner
    resawStock, resawSettings, crosscutSettings, resawSkus, resawResults, resawError,
    addBlankLength, removeBlankLength,
    addResawSku, removeResawSku, calculateResaw,
    // Box Planner
    binSettings, binResults,
  }
})
