<template>
  <section class="bg-surface border border-border rounded-lg overflow-hidden">
    <!-- Section header -->
    <div class="px-5 py-3 border-b border-border bg-surface-alt flex items-center justify-between">
      <h2 class="font-semibold text-text-primary">Required Parts</h2>
      <span class="text-xs text-text-muted">Finished dimensions</span>
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
            <th class="px-3 py-2 w-10"></th>
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
              <input
                v-model="part.label"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder="Part name"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model.number="part.qty"
                type="number" min="1"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="part.lengthStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='24'
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="part.widthStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='3'
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="part.thicknessStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='3/4'
              />
            </td>
            <td class="px-3 py-1.5 text-center">
              <button
                @click="store.removePart(part.id)"
                class="text-text-muted hover:text-danger transition-colors text-base leading-none"
                title="Remove part"
              >×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add row -->
    <div class="px-5 py-3 border-t border-border bg-surface-alt/40">
      <button
        @click="store.addPart()"
        class="text-sm text-accent font-medium hover:underline"
      >
        + Add Part
      </button>
    </div>

    <!-- Hint -->
    <div class="px-5 pb-3 text-xs text-text-muted">
      These are <strong>finished dimensions</strong> — the size the part must be after all milling. The solver accounts for kerf and planing allowances automatically.
    </div>
  </section>
</template>

<script setup>
import { useProjectStore } from '@/stores/project'
const store = useProjectStore()
</script>
