# 3D Thickness Optimization — Build Plan
_Drafted: 2026-04-12_

## Goal
When a stock board is significantly thicker than the parts needed from it, the solver should suggest resawing it into multiple slabs rather than planing away the excess. Each slab is then treated as an independent board for part assignment.

---

## New Settings (add to `settings` in `project.js` and expose in `Settings.vue`)

| Setting | Default | Label in UI |
|---|---|---|
| `allowResaw` | `true` | "Allow thickness resawing" (checkbox) |
| `resawFaceAllowance` | `0.0625"` | "Resaw face planing allowance" (input, decimal inches) |

`resawFaceAllowance` is distinct from `planingAllowance` (which is for rough → S4S conditioning). Resawn faces need a cleanup pass regardless of the board's original condition.

---

## Algorithm: `expandStockWithResaw(stock, parts, settings)`

Called inside `solveOptimized` **before** board ordering. Returns a new stock array where thick boards have been split into virtual slabs where beneficial.

### For each stock piece:
1. Compute `usableThickness = nominalThickness - conditionAllowance.thickness`
2. Find all unique part thicknesses needed (from unresolved or all parts)
3. For each part thickness `T`:
   - `slabThickness = T + settings.resawFaceAllowance` (what to set the fence to)
   - `slabsAvailable = floor(usableThickness / (slabThickness + kerf))`
   - If `slabsAvailable >= 2`: this board is a resaw candidate for thickness `T`
4. Pick the part thickness that maximises `slabsAvailable × partsNeededAtThatThickness` (greedy best-fit)
5. Generate virtual slab stock pieces:
   - Each slab: same length, same width, `thickness = slabThickness`, `condition = 's4s'` (faces already accounted for via resawFaceAllowance)
   - Tag each with `resawnFrom: originalBoard.id`, `resawFenceAt: slabThickness`, `resawSlabIndex: i`
   - Remainder slab (the offcut): recursively check if it's thick enough to yield another slab — if yes, include it too; if not, discard (it becomes waste)
6. Replace the original stock piece with the virtual slabs in the candidate stock array

### When NOT to resaw:
- `settings.allowResaw === false`
- `slabsAvailable < 2` (can't get more than one useful slab)
- The remainder after slabbing is < `minUsableThickness` (suggest 0.5" as a reasonable floor — not worth a slab)

### Run both and compare:
`solveOptimized` generates candidates **with** and **without** resaw expansion and scores them the same way (unresolved parts → waste % → boards opened). Best score wins.

---

## Solver changes (`solver.js`)

### `solve()` — no changes to core logic

Virtual slab stock pieces look exactly like real stock pieces to `solve()`. The only addition: carry `resawnFrom` and `resawFenceAt` through to the result so instruction generation can use them.

### Instruction generation (Step 5)

When a stock piece has `resawnFrom` set, prepend a board-level resaw step **once per original board** (not per slab):

```
Step 0 — Resaw (Board X):
  Set bandsaw fence to 0.8125"
  Resaw to yield 2 slabs
  Plane each resawn face — remove ~1/16" to clean up blade marks
  (Fence setting includes 1/16" planing allowance per face)
```

Group slab instructions under their parent board in the output.

### `solveOptimized` wrapper

```js
// Generate candidates both with and without resaw expansion
const baseStock = input.stock
const resawStock = settings.allowResaw
  ? expandStockWithResaw(baseStock, input.parts, settings)
  : baseStock

// Add resaw-expanded candidates to the pool
// (base candidates still included — optimizer picks the best)
```

---

## UI Changes

### `Settings.vue`
- Add "Allow thickness resawing" checkbox (`settings.allowResaw`)
- Add "Resaw face planing allowance" number input (`settings.resawFaceAllowance`), shown only when `allowResaw === true`
- Group these under a "Thickness / Resaw" section heading

### `YieldPlannerView.vue` — per-board result cards
- If `result.stockPiece.resawnFrom` is set, show a small badge:
  `Resawn from [original board label] — fence at X"`
- Show this in both screen and print views

### `ResultsSummary.vue`
- Add "N resaw operations" stat if any resawing was done (count unique `resawnFrom` source boards)

### `CutPlanTable.vue`
- If the stock piece was resawn, show the resaw step as the first row in the instruction table, styled distinctly (e.g. amber/warning background), before the normal rip/crosscut steps

---

## Out of scope (for now)
- Mixed-thickness resaw (e.g. one 0.75" slab + one 1.0" slab from the same board) — too complex, low value
- Width resawing (ripping narrow strips from wide stock) — different operation, already partially handled by normal rip assignments
- Resaw diagram in the SVG cut diagram — each slab shows as its own board, which is correct and sufficient

---

## Files to touch
| File | Change |
|---|---|
| `src/solver.js` | Add `expandStockWithResaw()`, update instruction generator, update `solveOptimized` |
| `src/stores/project.js` | Add `allowResaw` and `resawFaceAllowance` to settings defaults |
| `src/components/Settings.vue` | Add two new settings fields |
| `src/views/YieldPlannerView.vue` | Add resawn-from badge to board result cards |
| `src/components/ResultsSummary.vue` | Add resaw count stat |
| `src/components/CutPlanTable.vue` | Add resaw step as first instruction row |

---

## Open questions (resolved)
- ✅ User opt-out: checkbox in Settings, on by default
- ✅ Resawn face allowance: separate from `planingAllowance`, user-configurable, default 1/16"
- ✅ Recursive remainder: yes — if remainder is thick enough, it becomes another slab candidate
