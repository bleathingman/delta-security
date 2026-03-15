import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export function usernameToEmail(username) {
  return `${username.toLowerCase().trim().replace(/\s+/g, '_')}@deltasecurity.internal`
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  const isPatron = computed(() => profile.value?.role === 'patron')
  const isAgent  = computed(() => profile.value?.role === 'agent')

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', userId).single()
    if (error) { console.error('Erreur profil:', error.message); return }
    profile.value = data
  }

  async function init() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = session.user
      await fetchProfile(session.user.id)
      // Force logout if account was deactivated
      if (profile.value?.is_active === false) {
        await supabase.auth.signOut()
        user.value = null
        profile.value = null
      }
    }
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        profile.value = null
      }
    })
  }

  async function login(username, password) {
    const email = usernameToEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login') || error.message.includes('invalid_credentials')) {
        throw new Error('Identifiant ou mot de passe incorrect')
      }
      throw error
    }
    user.value = data.user
    await fetchProfile(data.user.id)

    // Block deactivated accounts
    if (profile.value?.is_active === false) {
      await supabase.auth.signOut()
      user.value = null
      profile.value = null
      throw new Error('Ce compte a été désactivé. Contactez l\'administration.')
    }

    return profile.value
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return { user, profile, loading, isPatron, isAgent, init, login, logout, fetchProfile }
})
