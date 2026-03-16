<template>
  <div class="min-h-screen flex items-stretch" style="background: #080808;">

    <!-- ── Left panel — branding ───────────────────────────── -->
    <div class="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden"
         style="background: linear-gradient(135deg, #0d0d0d 0%, #111111 100%); border-right: 1px solid #1a1a1a;">

      <div class="absolute top-8 left-8 w-16 h-16"
           style="border-left: 1px solid #B8C4D0; border-top: 1px solid #B8C4D0; opacity: 0.4;"></div>
      <div class="absolute bottom-8 right-8 w-16 h-16"
           style="border-right: 1px solid #B8C4D0; border-bottom: 1px solid #B8C4D0; opacity: 0.4;"></div>

      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="w-80 h-80 rotate-45 opacity-[0.03]" style="border: 1px solid #B8C4D0;"></div>
        <div class="absolute w-56 h-56 rotate-45 opacity-[0.04]" style="border: 1px solid #B8C4D0;"></div>
      </div>

      <div class="fade-up">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-px" style="background: #B8C4D0;"></div>
          <span class="text-xs tracking-[0.3em] uppercase font-body" style="color: #B8C4D0;">Établi depuis 2024</span>
        </div>
        <h1 class="font-display text-7xl font-light leading-none mb-1" style="color: #F5F5F0;">Delta</h1>
        <h2 class="font-display text-7xl font-light leading-none" style="color: #B8C4D0;">Security</h2>
      </div>

      <div class="fade-up delay-300">
        <p class="font-display text-xl italic font-light mb-3" style="color: #888;">
          « La sécurité n'est pas un service.<br />C'est une garantie. »
        </p>
        <div class="w-12 h-px" style="background: #B8C4D0; opacity: 0.5;"></div>
      </div>
    </div>

    <!-- ── Right panel — form ──────────────────────────────── -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md fade-up delay-100">

        <div class="lg:hidden text-center mb-10">
          <h1 class="font-display text-5xl font-light" style="color: #F5F5F0;">
            Delta <span style="color: #B8C4D0;">Security</span>
          </h1>
        </div>

        <div class="mb-10">
          <p class="text-xs tracking-[0.3em] uppercase mb-3 font-body" style="color: #B8C4D0;">— Accès sécurisé</p>
          <h3 class="font-display text-4xl font-light" style="color: #F5F5F0;">Connexion</h3>
          <p class="text-sm font-body mt-2" style="color: #555;">
            Utilisez vos identifiants fournis par l'administration
          </p>
        </div>

        <div v-if="error" class="mb-6 p-4 rounded fade-up"
             style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);">
          <p class="text-red-400 text-sm font-body">{{ error }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">

          <div>
            <label class="block text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #888;">
              Identifiant
            </label>
            <input v-model="username" type="text"
                   placeholder="ex: jean.dupont"
                   class="ds-input"
                   autocomplete="username"
                   required />
          </div>

          <div>
            <label class="block text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #888;">
              Mot de passe
            </label>
            <div class="relative">
              <input v-model="password"
                     :type="showPassword ? 'text' : 'password'"
                     placeholder="••••••••••"
                     class="ds-input pr-16"
                     autocomplete="current-password"
                     required />
              <button type="button" @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-body transition-colors duration-200"
                      style="color: #555;">
                {{ showPassword ? 'Cacher' : 'Voir' }}
              </button>
            </div>
          </div>

          <div class="pt-2">
            <button type="submit" class="btn-gold w-full" :disabled="loading">
              <span v-if="loading" class="inline-flex items-center justify-center gap-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Vérification...
              </span>
              <span v-else>Accéder au tableau de bord</span>
            </button>
          </div>

        </form>

        <p class="mt-8 text-center text-xs font-body" style="color: #444;">
          Accès réservé au personnel Delta Security.<br />
          Contactez l'administration pour obtenir vos identifiants.
        </p>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const profile = await authStore.login(username.value, password.value)
    router.push(profile?.role === 'patron' ? '/patron' : '/agent')
  } catch (e) {
    error.value = e.message || 'Identifiant ou mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>