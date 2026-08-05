import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',      redirect: '/home' },
    { path: '/home',  component: () => import('@/views/HomeView.vue'),         meta: { title: 'Woodworking Calculators' } },
    { path: '/yield', component: () => import('@/views/YieldPlannerView.vue'), meta: { title: 'Yield Planner' } },
    { path: '/resaw', component: () => import('@/views/ResawView.vue'),        meta: { title: 'Resaw Planner' } },
    { path: '/bin',   component: () => import('@/views/BinView.vue'),          meta: { title: 'Box Planner' } },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
})

// ─── Recover from a stale shell after a deploy ──────────────────────────────
// Every chunk filename carries a content hash, so a deploy deletes the old
// ones. A tab that was already open keeps running against an index.html that
// points at files which no longer exist. The shell and the current view carry
// on working, so nothing looks wrong — until the first click on a lazy route,
// which dies with "Failed to fetch dynamically imported module" and leaves the
// tab on the page it was already on. Someone who leaves this open on a bench
// for an afternoon hits exactly that.
//
// Reloading picks up the new index. The guard matters more than the reload: if
// the chunk is missing for any other reason, a blind reload would loop
// forever, so recovery is attempted once and only re-armed by a navigation
// that actually succeeds.
const RELOAD_FLAG = 'yield:chunk-reload'
const STALE_CHUNK = /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i

// Backs up sessionStorage, which throws in some privacy modes.
let reloadAttempted = false

function alreadyRecovered() {
  if (reloadAttempted) return true
  try {
    return sessionStorage.getItem(RELOAD_FLAG) === '1'
  } catch {
    return false
  }
}

function markRecovered() {
  reloadAttempted = true
  try {
    sessionStorage.setItem(RELOAD_FLAG, '1')
  } catch { /* nothing to fall back to; the in-memory flag still holds */ }
}

function clearRecovered() {
  reloadAttempted = false
  try {
    sessionStorage.removeItem(RELOAD_FLAG)
  } catch { /* ignore */ }
}

router.onError((error, to) => {
  if (!STALE_CHUNK.test(String(error?.message ?? ''))) {
    console.error(error)
    return
  }
  if (alreadyRecovered()) {
    console.error('Reload did not resolve the missing module; not retrying.', error)
    return
  }
  markRecovered()
  // Land on the route the user actually asked for, not the one they were on.
  if (to?.fullPath) window.location.hash = to.fullPath
  window.location.reload()
})

router.afterEach((to) => {
  // A navigation that completes proves this shell can still load its chunks,
  // so re-arm recovery for the next deploy.
  clearRecovered()

  // Every route used to announce itself as "Board Yield Calculator", which
  // makes tabs and screen-reader page titles useless once more than one tool
  // is open.
  const name = to.meta?.title
  document.title = name
    ? `${name} — Althoff Woodshop`
    : 'Board Yield Calculator — Althoff Woodshop'
})

const pinia = createPinia()
const app   = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
