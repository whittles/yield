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

// Every route used to announce itself as "Board Yield Calculator", which makes
// tabs and screen-reader page titles useless once more than one tool is open.
router.afterEach((to) => {
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
