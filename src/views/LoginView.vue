<template>
  <div class="min-h-screen flex items-stretch" style="background: #080808;">

    <!-- ── Left panel — branding ───────────────────────────── -->
    <div class="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden"
         style="background: linear-gradient(135deg, #0d0d0d 0%, #111111 100%); border-right: 1px solid #1a1a1a;">

      <!-- Decorative corner lines -->
      <div class="absolute top-8 left-8 w-16 h-16"
           style="border-left: 1px solid #D4AF37; border-top: 1px solid #D4AF37; opacity: 0.4;"></div>
      <div class="absolute bottom-8 right-8 w-16 h-16"
           style="border-right: 1px solid #D4AF37; border-bottom: 1px solid #D4AF37; opacity: 0.4;"></div>

      <!-- Centered diamond ornament -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="w-80 h-80 rotate-45 opacity-[0.03]"
             style="border: 1px solid #D4AF37;"></div>
        <div class="absolute w-56 h-56 rotate-45 opacity-[0.04]"
             style="border: 1px solid #D4AF37;"></div>
      </div>

      <!-- Logo + tagline -->
      <div class="fade-up">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-px" style="background: #D4AF37;"></div>
          <span class="text-xs tracking-[0.3em] uppercase font-body" style="color: #D4AF37;">Établi depuis 2018</span>
        </div>
        <h1 class="font-display text-7xl font-light leading-none mb-1" style="color: #F5F5F0;">Delta</h1>
        <h2 class="font-display text-7xl font-light leading-none" style="color: #D4AF37;">Security</h2>
      </div>

      <!-- Bottom quote -->
      <div class="fade-up delay-300">
        <p class="font-display text-xl italic font-light mb-3" style="color: #888;">
          « La sécurité n'est pas un service.<br />C'est une garantie. »
        </p>
        <div class="w-12 h-px" style="background: #D4AF37; opacity: 0.5;"></div>
      </div>
    </div>

    <!-- ── Right panel — form ──────────────────────────────── -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md fade-up delay-100">

        <!-- Mobile logo -->
        <div class="lg:hidden text-center mb-10">
          <h1 class="font-display text-5xl font-light" style="color: #F5F5F0;">
            Delta <span style="color: #D4AF37;">Security</span>
          </h1>
        </div>

        <!-- Form header -->
        <div class="mb-10">
          <p class="text-xs tracking-[0.3em] uppercase mb-3 font-body" style="color: #D4AF37;">
            — Accès sécurisé
          </p>
          <h3 class="font-display text-4xl font-light" style="color: #F5F5F0;">
            {{ isRegister ? 'Créer un compte' : 'Connexion' }}
          </h3>
        </div>

        <!-- Error message -->
        <div v-if="error" class="mb-6 p-4 rounded fade-up"
             style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);">
          <p class="text-red-400 text-sm font-body">{{ error }}</p>
        </div>

        <!-- Success message -->
        <div v-if="success" class="mb-6 p-4 rounded fade-up"
             style="background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.3);">
          <p class="text-sm font-body" style="color: #D4AF37;">{{ success }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5">

          <div v-if="isRegister" class="fade-up">
            <label class="block text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #888;">
              Nom complet
            </label>
            <input v-model="fullName" type="text" placeholder="Jean Dupont"
                   class="ds-input" required />
          </div>

          <div>
            <label class="block text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #888;">
              Email
            </label>
            <input v-model="email" type="email" placeholder="agent@deltasecurity.fr"
                   class="ds-input" required />
          </div>

          <div>
            <label class="block text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #888;">
              Mot de passe
            </label>
            <input v-model="password" type="password" placeholder="••••••••••"
                   class="ds-input" required />
          </div>

          <div v-if="isRegister" class="fade-up">
            <label class="block text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #888;">
              Rôle
            </label>
            <select v-model="role" class="ds-input" required>
              <option value="agent">Agent</option>
              <option value="patron">Patron</option>
            </select>
          </div>

          <div class="pt-2">
            <button type="submit" class="btn-gold w-full" :disabled="loading">
              <span v-if="loading" class="inline-flex items-center gap-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Chargement...
              </span>
              <span v-else>{{ isRegister ? 'Créer le compte' : 'Accéder au tableau de bord' }}</span>
            </button>
          </div>

        </form>

        <!-- Toggle login/register -->
        <div class="mt-8 text-center">
          <p class="text-sm font-body" style="color: #666;">
            {{ isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?' }}
            <button @click="toggleMode" class="ml-1 transition-colors duration-200"
                    style="color: #D4AF37;" onmouseover="this.style.color='#F0D060'" onmouseout="this.style.color='#D4AF37'">
              {{ isRegister ? 'Se connecter' : "S'inscrire" }}
            </button>
          </p>
        </div>

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

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const fullName = ref('')
const role = ref('agent')
const loading = ref(false)
const error = ref('')
const success = ref('')

function toggleMode() {
  isRegister.value = !isRegister.value
  error.value = ''
  success.value = ''
}

async function handleSubmit() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    if (isRegister.value) {
      const profile = await authStore.register(email.value, password.value, fullName.value, role.value)
      if (!profile) {
        success.value = 'Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.'
        isRegister.value = false
      } else {
        redirectByRole(profile)
      }
    } else {
      const profile = await authStore.login(email.value, password.value)
      redirectByRole(profile)
    }
  } catch (e) {
    error.value = e.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}

function redirectByRole(profile) {
  if (!profile) return
  router.push(profile.role === 'patron' ? '/patron' : '/agent')
}
</script>
