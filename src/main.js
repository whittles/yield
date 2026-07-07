import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('@/views/HomeView.vue') },
    { path: '/yield', component: () => import('@/views/YieldPlannerView.vue') },
    { path: '/resaw',   component: () => import('@/views/ResawView.vue') },
    { path: '/bin',     component: () => import('@/views/BinView.vue') },
    { path: '/home',    component: () => import('@/views/HomeView.vue') },
  ],
})

const pinia = createPinia()
const app   = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
