<template>
  <div class="max-w-4xl mx-auto px-4 py-10 space-y-10">

    <!-- Hero -->
    <div class="text-center space-y-3">
      <h1 class="text-3xl font-bold text-text-primary m-0">Woodworking Calculators</h1>
      <p class="text-text-secondary text-base max-w-xl mx-auto">
        Free tools for woodworkers. No login, no account — enter your dimensions and get a cut plan.
      </p>
      <p class="text-xs text-text-muted">
        By
        <a href="https://althoffwoodshop.com" target="_blank" rel="noopener"
           class="inline-block py-2 underline underline-offset-2 hover:text-text-primary transition-colors">Althoff Woodshop</a>
      </p>
    </div>

    <!-- Tool cards -->
    <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
      <li v-for="tool in tools" :key="tool.path">
        <!-- A link, not a button: it navigates, so it should open in a new tab
             on middle-click and show its target on hover like any other link. -->
        <RouterLink
          :to="tool.path"
          class="group flex flex-col h-full bg-surface border border-border rounded-xl p-5 no-underline
                 hover:border-text-muted transition-colors shadow-sheet"
        >
          <Icon :name="tool.icon" size="1.65rem" class="text-text-secondary mb-3" />
          <h2 class="text-base font-semibold text-text-primary m-0 mb-1">{{ tool.title }}</h2>
          <p class="text-xs text-text-secondary leading-relaxed m-0">{{ tool.blurb }}</p>
          <span class="mt-3 text-xs text-text-primary font-medium inline-flex items-center gap-1">
            Open
            <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </RouterLink>
      </li>
    </ul>

    <!-- Beta notice -->
    <div class="flex items-start gap-2.5 px-4 py-3 bg-surface border border-border rounded-xl shadow-sheet">
      <Icon name="alert" size="1.05em" class="mt-px shrink-0 text-warning" />
      <p class="m-0 text-xs leading-normal text-text-secondary">
        <strong class="font-semibold text-text-primary">Beta:</strong> these tools are actively being
        developed. Results are generated algorithmically — always verify dimensions before cutting.
        <a href="https://althoffwoodshop.com/pages/contact" target="_blank" rel="noopener"
           class="inline-block py-1 text-text-primary underline underline-offset-2 hover:opacity-75">Send feedback</a>
      </p>
    </div>

    <!-- Quick tips -->
    <section class="bg-surface border border-border rounded-xl p-5 shadow-sheet">
      <h2 class="text-base font-semibold text-text-primary m-0 mb-3">Quick tips</h2>
      <ul class="space-y-2 text-xs text-text-secondary list-none p-0 m-0">
        <li v-for="(tip, i) in tips" :key="i" class="flex items-start gap-2">
          <Icon name="check" size="0.95em" class="mt-0.5 shrink-0 text-text-muted" />
          <span v-html="tip"></span>
        </li>
      </ul>
    </section>

    <!-- Feedback nudge -->
    <p class="text-center text-xs text-text-secondary">
      Found a bug or have a suggestion?
      <a href="https://althoffwoodshop.com/pages/contact" target="_blank" rel="noopener"
         class="inline-block py-2 text-text-primary underline underline-offset-2 hover:opacity-80 transition-opacity ml-1">Send feedback</a>
    </p>

  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'

// Titles match the tab bar exactly. The app previously called the same tool
// "Board Yield Calculator", "Woodworking Calculators", "Board Yield Planner"
// and "Yield Planner" in four places.
const tools = [
  {
    path: '/yield',
    icon: 'grain',
    title: 'Yield Planner',
    blurb: 'Have lumber, need parts. Enter the boards you have and the parts you need — it finds the cuts with the least waste, then gives you a diagram and step-by-step instructions.',
  },
  {
    path: '/resaw',
    icon: 'slabs',
    title: 'Resaw Planner',
    blurb: 'Built for kumiko strip production. Enter rough stock and target strip sizes — it works out the whole milling sequence: crosscuts, bandsaw fence settings, sanding targets, table-saw rips, and total yield.',
  },
  {
    path: '/bin',
    icon: 'box',
    title: 'Box Planner',
    blurb: 'Open-top storage bin with a dado bottom. Enter inner or outer dimensions and a quantity — get a full cut list and the minimum sheet you can cut it from.',
  },
]

const tips = [
  'Dimension fields accept fractions — type <span class="font-mono bg-bg px-1 rounded">1 3/4</span> or <span class="font-mono bg-bg px-1 rounded">1.75</span>',
  'Print any plan for a shop-ready sheet you can hang at the machine',
  'Export your inputs as JSON to save a project and reload it later',
  'Nominal ½" plywood is usually 15/32" — measure your actual sheet',
]
</script>
