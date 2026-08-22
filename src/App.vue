<template>
  <div class="min-h-screen flex flex-col bg-bg">

    <a href="#main" class="skip-link">Skip to content</a>

    <!-- ── Header ─────────────────────────────────────────────── -->
    <header class="bg-header text-white no-print">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <!-- Brand -->
        <a href="https://althoffwoodshop.com" class="flex items-center gap-3 no-underline hover:opacity-80 transition-opacity py-1">
          <img
            src="/logo.png"
            alt="Althoff Woodshop logo"
            width="40"
            height="40"
            class="w-10 h-10 object-contain"
          />
          <div>
            <div class="font-semibold text-base leading-tight tracking-wide">Althoff Woodshop</div>
            <div class="text-xs text-header-muted leading-tight">Woodworking Calculators</div>
          </div>
        </a>

        <!-- Actions -->
        <div class="flex items-center gap-1 sm:gap-2">
          <button
            @click="handleExport"
            class="header-action"
          >
            <Icon name="download" size="1.15em" />
            <span class="hidden sm:inline">Export</span>
            <span class="sr-only sm:hidden">Export project</span>
          </button>
          <button
            @click="handleImport"
            class="header-action"
          >
            <Icon name="upload" size="1.15em" />
            <span class="hidden sm:inline">Import</span>
            <span class="sr-only sm:hidden">Import project</span>
          </button>
          <button
            @click="store.resetToDefaults()"
            class="header-action header-action--danger"
          >
            <Icon name="reset" size="1.15em" />
            <span class="hidden sm:inline">Reset</span>
            <span class="sr-only sm:hidden">Reset to defaults</span>
          </button>
        </div>
      </div>

      <!-- ── Tab bar ──────────────────────────────────────────── -->
      <nav aria-label="Calculators" class="border-t border-white/10">
        <ul class="max-w-5xl mx-auto px-2 flex overflow-x-auto list-none m-0">
          <li v-for="tab in tabs" :key="tab.path">
            <RouterLink
              :to="tab.path"
              :aria-current="activeTab === tab.key ? 'page' : undefined"
              :class="[
                'flex items-center h-11 px-3 sm:px-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap no-underline',
                activeTab === tab.key
                  ? 'border-white text-white'
                  : 'border-transparent text-header-muted hover:text-white hover:border-white/40'
              ]"
            >
              {{ tab.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </header>

    <!-- ── Main content ───────────────────────────────────────── -->
    <main id="main" class="flex-1">
      <router-view />
    </main>

    <!-- ── Footer ─────────────────────────────────────────────── -->
    <footer class="no-print border-t border-border mt-8 py-5 text-center text-xs text-text-secondary">
      <p class="m-0 leading-relaxed">
        © {{ new Date().getFullYear() }}
        <a href="https://althoffwoodshop.com" target="_blank" rel="noopener" class="footer-link">
          Althoff Woodshop
        </a>
        <span class="mx-2" aria-hidden="true">·</span>
        Woodworking Calculators
        <span class="mx-2" aria-hidden="true">·</span>
        v{{ version }}
        <span class="mx-2" aria-hidden="true">·</span>
        <a href="https://althoffwoodshop.com/pages/contact" target="_blank" rel="noopener" class="footer-link">
          Feedback
        </a>
      </p>
    </footer>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { exportProject, importProject } from '@/utils/export'
import Icon from '@/components/Icon.vue'

const store = useProjectStore()
const route = useRoute()
const version = __APP_VERSION__

const tabs = [
  { key: 'home',  path: '/home',  label: 'Home' },
  { key: 'yield', path: '/yield', label: 'Yield Planner' },
  { key: 'resaw', path: '/resaw', label: 'Resaw Planner' },
  { key: 'bin',   path: '/bin',   label: 'Box Planner' },
  { key: 'segment', path: '/segment', label: 'Segment Planner' },
]

// Derive active tab from the URL so it survives refresh and deep links.
// `/` now redirects to `/home`, so every tab has exactly one reachable path
// and each one can actually light up.
const activeTab = computed(() => {
  const match = tabs.find(t => t.path === route.path)
  return match ? match.key : 'home'
})

function handleExport() {
  exportProject(store)
}

function handleImport() {
  importProject(
    (data) => store.loadProject(data),
    (message) => window.alert(message),
  )
}
</script>

<style scoped>
.header-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 44px;
  min-width: 44px;
  padding: 0 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid rgb(255 255 255 / 0.25);
  border-radius: 0.25rem;
  transition: background-color 0.15s, border-color 0.15s;
}
@media (min-width: 640px) {
  .header-action { padding: 0 0.75rem; font-size: 0.875rem; }
}
.header-action:hover { background-color: rgb(255 255 255 / 0.12); }
.header-action--danger {
  border-color: rgb(252 165 165 / 0.45);
  color: #fca5a5;
}
.header-action--danger:hover { background-color: rgb(239 68 68 / 0.22); }

.footer-link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: rgb(0 0 0 / 0.25);
  padding: 0.6rem 0.25rem;
  display: inline-block;
}
.footer-link:hover { color: var(--text-primary, #121212); }
</style>
