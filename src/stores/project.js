import { defineStore } from 'pinia'
import { ref } from 'vue'
import { solve } from '@/solver'
import { parseFraction } from '@/utils/fractions'

export const useProjectStore = defineStore('project', () => {
  // ─── Settings ──────────────────────────────────────────────────────────────
  const settings = ref({
    kerf: 0.125,
    planingAllowance: 0.0625,
    conditionAllowances: {
      'rough':       { thickness: 0.25,   width: 0.25  },
      'skip-planed': { thickness: 0.125,  width: 0.25  },
      's3s':         { thickness: 0.0625, width: 0.125 },
      's4s':         { thickness: 0,      width: 0     },
    },
  })

  // ─── Stock (sample data pre-filled) ────────────────────────────────────────
  const stock = ref([
    {
      id: 's1',
      label: 'Board 1',
      lengthStr: '96',
      widthStr: '8',
      thicknessStr: '1 1/2',
      qty: 1,
      condition: 'skip-planed',
    },
  ])

  // ─── Parts (sample data pre-filled) ────────────────────────────────────────
  const parts = ref([
    { id: 'p1', label: 'Leg',  lengthStr: '28', widthStr: '1 3/4', thicknessStr: '1 1/2', qty: 4 },
    { id: 'p2', label: 'Rail', lengthStr: '36', widthStr: '3',     thicknessStr: '3/4',   qty: 2 },
  ])

  const results  = ref(null)
  const activeTab = ref('input') // 'input' | 'results'
  const nextId   = ref(10)

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

    results.value  = solve({ stock: parsedStock, parts: parsedParts, settings: settings.value })
    activeTab.value = 'results'
  }

  // ─── Import / Export ────────────────────────────────────────────────────────
  function loadProject(data) {
    if (data.stock)    stock.value    = data.stock
    if (data.parts)    parts.value    = data.parts
    if (data.settings) settings.value = data.settings
    results.value   = null
    activeTab.value  = 'input'
  }

  return {
    settings, stock, parts, results, activeTab,
    addStock, removeStock, addPart, removePart,
    calculate, loadProject,
  }
})
