import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: () => {
      const auth = useAuthStore()
      if (!auth.user) return '/login'
      return auth.isPatron ? '/patron' : '/agent'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/agent',
    name: 'Agent',
    component: () => import('@/views/AgentView.vue'),
    meta: { requiresAuth: true, role: 'agent' }
  },
  {
    path: '/patron',
    name: 'Patron',
    component: () => import('@/views/PatronView.vue'),
    meta: { requiresAuth: true, role: 'patron' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.loading) {
    await new Promise(resolve => {
      const unwatch = setInterval(() => {
        if (!auth.loading) { clearInterval(unwatch); resolve() }
      }, 50)
    })
  }

  if (to.meta.requiresAuth && !auth.user) return '/login'
  if (to.path === '/login' && auth.user) {
    return auth.isPatron ? '/patron' : '/agent'
  }
})

export default router
