<template>
  <section class="bg-surface border border-border rounded-lg overflow-hidden">
    <!-- Section header -->
    <div class="px-5 py-3 border-b border-border bg-surface-alt flex items-center justify-between">
      <h2 class="font-semibold text-text-primary">Stock Boards</h2>
      <span class="text-xs text-text-muted">Available lumber</span>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-text-muted text-xs uppercase tracking-wide">
            <th class="px-4 py-2 text-left font-medium">Label</th>
            <th class="px-3 py-2 text-center font-medium w-16">Qty</th>
            <th class="px-3 py-2 text-center font-medium w-28">Length (in)</th>
            <th class="px-3 py-2 text-center font-medium w-28">Width (in)</th>
            <th class="px-3 py-2 text-center font-medium w-28">Thickness (in)</th>
            <th class="px-3 py-2 text-center font-medium w-36">Condition</th>
            <th class="px-3 py-2 w-10"></th>
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
              <input
                v-model="board.label"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder="Board name"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model.number="board.qty"
                type="number" min="1"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="board.lengthStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='96'
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="board.widthStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='8'
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="board.thicknessStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='1 1/2'
              />
            </td>
            <td class="px-3 py-1.5">
              <select
                v-model="board.condition"
                class="w-full border border-transparent rounded px-2 py-1 text-sm
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
              >
                <option value="rough">Rough</option>
                <option value="skip-planed">Skip Planed</option>
                <option value="s3s">S3S</option>
                <option value="s4s">S4S</option>
              </select>
            </td>
            <td class="px-3 py-1.5 text-center">
              <button
                @click="store.removeStock(board.id)"
                class="text-text-muted hover:text-danger transition-colors text-base leading-none"
                title="Remove board"
              >×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add row -->
    <div class="px-5 py-3 border-t border-border bg-surface-alt/40">
      <button
        @click="store.addStock()"
        class="text-sm text-accent font-medium hover:underline"
      >
        + Add Board
      </button>
    </div>

    <!-- Dimension hint -->
    <div class="px-5 pb-3 text-xs text-text-muted">
      Dimensions accept fractions: <code class="bg-surface-alt px-1 rounded">1 3/4</code> or decimals: <code class="bg-surface-alt px-1 rounded">1.75</code>. Length and width are nominal (pre-milling) inches.
    </div>
  </section>
</template>

<script setup>
import { useProjectStore } from '@/stores/project'
const store = useProjectStore()
</script>
