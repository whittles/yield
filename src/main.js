import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import InputView from './views/InputView.vue'
import ResultsView from './views/ResultsView.vue'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',        component: InputView  },
    { path: '/results', component: ResultsView },
    { path: '/resaw',   component: () => import('@/views/ResawView.vue') },
    { path: '/toolbox', component: () => import('@/views/ToolboxView.vue') },
    { path: '/bin',     component: () => import('@/views/BinView.vue') },
  ],
})

const pinia = createPinia()
const app   = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
