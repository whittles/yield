<template>
  <div>
    <dl class="grid grid-cols-2 sm:grid-cols-3 gap-3 m-0">
      <div class="bg-surface border border-border rounded-lg px-4 py-3">
        <dt class="text-xs text-text-muted uppercase tracking-wide mb-1">Parts placed</dt>
        <dd class="m-0 text-2xl font-bold text-text-primary leading-none">
          {{ summary.placedParts }}<span class="text-sm font-normal text-text-muted"> / {{ summary.totalParts }}</span>
        </dd>
      </div>

      <div class="bg-surface border border-border rounded-lg px-4 py-3">
        <dt class="text-xs text-text-muted uppercase tracking-wide mb-1">Boards used</dt>
        <dd class="m-0 text-2xl font-bold text-text-primary leading-none">
          {{ summary.stockUsed }}<span v-if="summary.stockUnused > 0" class="text-sm font-normal text-text-muted"> of {{ summary.stockUsed + summary.stockUnused }}</span>
        </dd>
      </div>

      <!-- Yield and waste are 100 − x of each other; showing both as headline
           tiles spent half the row on one fact. Waste is now the sub-line. -->
      <div class="bg-surface border border-border rounded-lg px-4 py-3 col-span-2 sm:col-span-1">
        <dt class="text-xs text-text-muted uppercase tracking-wide mb-1">Yield</dt>
        <dd class="m-0 flex items-baseline gap-2">
          <span class="text-2xl font-bold leading-none" :class="yieldTone.text">{{ yieldPct }}%</span>
          <!-- Never colour alone: the band is named in words too. -->
          <span class="text-xs font-medium px-1.5 py-0.5 rounded" :class="yieldTone.badge">{{ yieldTone.label }}</span>
        </dd>
        <p class="m-0 mt-1 text-xs text-text-muted">{{ summary.overallWaste }}% waste</p>
      </div>
    </dl>

    <div v-if="summary.resawCount > 0" class="mt-3 text-sm text-text-secondary">
      <span class="font-semibold text-text-primary">{{ summary.resawCount }}</span>
      resaw {{ summary.resawCount === 1 ? 'operation' : 'operations' }} in this plan
    </div>

    <!-- What you keep, not just what you lose. -->
    <div v-if="offcuts.length" class="mt-3 bg-surface border border-border rounded-lg px-4 py-3">
      <h3 class="text-xs text-text-muted uppercase tracking-wide m-0 mb-1.5">Usable offcuts</h3>
      <ul class="list-none p-0 m-0 flex flex-wrap gap-x-5 gap-y-1">
        <li v-for="(o, i) in offcuts" :key="i" class="text-sm">
          <span class="font-mono font-semibold text-text-primary">{{ fmt(o.length) }}" × {{ fmt(o.width) }}"</span>
          <span v-if="o.boardLabel" class="text-text-muted text-xs"> from {{ o.boardLabel }}</span>
        </li>
      </ul>
      <p class="m-0 mt-1.5 text-xs text-text-muted">Rack these before they become firewood.</p>
    </div>

    <p v-if="summary.optimized" class="mt-2 mb-0 text-xs text-text-muted flex items-center gap-1">
      <Icon name="check" size="0.9em" />
      Best of {{ summary.orderingsTried }} board orderings
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatInches } from '@/utils/fractions'
import { allKeepableOffcuts } from '@/utils/offcuts'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  summary: { type: Object, required: true },
  boards: { type: Array, default: () => [] },
})

const fmt = formatInches
const yieldPct = computed(() => 100 - props.summary.overallWaste)

const yieldTone = computed(() => {
  const y = yieldPct.value
  if (y >= 80) return { label: 'Good', text: 'text-success', badge: 'bg-success-bg text-success' }
  if (y >= 60) return { label: 'Fair', text: 'text-warning', badge: 'bg-warning-bg text-warning' }
  return { label: 'Poor', text: 'text-danger', badge: 'bg-danger-bg text-danger' }
})

const offcuts = computed(() => allKeepableOffcuts(props.boards, 4))
</script>
