<template>
  <div class="min-h-screen flex flex-col bg-bg">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <header class="bg-header text-white no-print">
      <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <!-- Brand -->
        <div class="flex items-center gap-3">
          <img
            src="https://althoffwoodshop.com/cdn/shop/files/aws_logo.png"
            alt="Althoff Woodshop logo"
            class="w-8 h-8 object-contain"
          />
          <div>
            <div class="font-semibold text-base leading-tight tracking-wide">Althoff Woodshop</div>
            <div class="text-xs text-gray-400 leading-tight">Board Yield Calculator</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="handleExport"
            class="text-sm px-3 py-1.5 border border-white/20 rounded hover:bg-white/10 transition-colors"
            title="Export project as JSON"
          >
            Export
          </button>
          <button
            @click="handleImport"
            class="text-sm px-3 py-1.5 border border-white/20 rounded hover:bg-white/10 transition-colors"
            title="Import project from JSON"
          >
            Import
          </button>
        </div>
      </div>

      <!-- ── Tab bar ──────────────────────────────────────────── -->
      <div class="border-t border-white/10">
        <div class="max-w-5xl mx-auto px-4 flex gap-0">
          <button
            @click="goToInput"
            :class="[
              'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'input'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/40'
            ]"
          >
            Input
          </button>
          <button
            @click="goToResults"
            :disabled="!hasResults"
            :class="[
              'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              !hasResults ? 'border-transparent text-gray-600 cursor-not-allowed' :
              activeTab === 'results'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/40'
            ]"
          >
            Results
            <span
              v-if="hasResults"
              class="ml-1.5 text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full"
            >
              {{ store.results?.summary?.placedParts }}/{{ store.results?.summary?.totalParts }}
            </span>
          </button>
        </div>
      </div>
    </header>

    <!-- ── Print header (only visible on print) ───────────────── -->
    <div class="print-only p-6 border-b border-border">
      <h1 class="text-2xl font-bold">Althoff Woodshop — Cut Plan</h1>
      <p class="text-text-muted text-sm mt-1">Generated {{ new Date().toLocaleDateString() }}</p>
    </div>

    <!-- ── Main content ───────────────────────────────────────── -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- ── Footer ─────────────────────────────────────────────── -->
    <footer class="no-print border-t border-border mt-8 py-4 text-center text-xs text-text-muted">
      <a href="https://althoffwoodshop.com" target="_blank" rel="noopener"
         class="hover:text-text-primary transition-colors">
        althoffwoodshop.com
      </a>
      <span class="mx-2">·</span>
      Board Yield Calculator
    </footer>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { exportProject, importProject } from '@/utils/export'

const store  = useProjectStore()
const router = useRouter()

const hasResults = computed(() => !!store.results)
const activeTab  = computed(() => store.activeTab)

function goToInput() {
  store.activeTab = 'input'
  router.push('/')
}

function goToResults() {
  if (!hasResults.value) return
  store.activeTab = 'results'
  router.push('/results')
}

function handleExport() {
  exportProject(store)
}

function handleImport() {
  importProject((data) => store.loadProject(data))
}
</script>
