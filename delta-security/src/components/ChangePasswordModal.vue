<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
       style="background: rgba(0,0,0,0.88);"
       @click.self="$emit('close')">
    <div class="ds-card w-full max-w-sm gold-glow fade-up">

      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="font-display text-2xl font-light" style="color: #F5F5F0;">Changer le mot de passe</h3>
          <p class="text-xs font-body mt-1" style="color: #666;">{{ profileName }}</p>
        </div>
        <button @click="$emit('close')" style="color: #555; font-size: 1.2rem; line-height: 1;">✕</button>
      </div>

      <!-- Feedback -->
      <div v-if="msg" class="mb-4 p-3 rounded text-sm font-body"
           :style="msg.type === 'success'
             ? 'background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.25); color: #D4AF37;'
             : 'background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171;'">
        {{ msg.text }}
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">
            Nouveau mot de passe
          </label>
          <div class="relative">
            <input v-model="newPassword" :type="show ? 'text' : 'password'"
                   placeholder="Minimum 6 caractères" class="ds-input pr-16"
                   @keyup.enter="handleSave" />
            <button type="button" @click="show = !show"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-body" style="color: #555;">
              {{ show ? 'Cacher' : 'Voir' }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">
            Confirmer
          </label>
          <input v-model="confirmPassword" :type="show ? 'text' : 'password'"
                 placeholder="Répéter le mot de passe" class="ds-input"
                 @keyup.enter="handleSave" />
        </div>

        <!-- Password strength -->
        <div v-if="newPassword" class="flex items-center gap-2">
          <div class="flex gap-1 flex-1">
            <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-all duration-300"
                 :style="i <= strength.score
                   ? `background: ${strength.color};`
                   : 'background: #242424;'"></div>
          </div>
          <span class="text-xs font-body" :style="`color: ${strength.color};`">{{ strength.label }}</span>
        </div>

        <div class="flex gap-3 pt-2">
          <button @click="handleSave" class="btn-gold flex-1" :disabled="saving">
            <span v-if="saving" class="inline-flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </span>
            <span v-else>Enregistrer</span>
          </button>
          <button @click="$emit('close')" class="btn-ghost flex-1">Annuler</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { callEdgeFunction } from '@/lib/edgeFunction'

const props = defineProps({
  targetId: { type: String, default: null },   // null = self
  profileName: { type: String, default: 'Mon compte' }
})
const emit = defineEmits(['close', 'saved'])

const newPassword = ref('')
const confirmPassword = ref('')
const show = ref(false)
const saving = ref(false)
const msg = ref(null)

// Password strength meter
const strength = computed(() => {
  const p = newPassword.value
  if (!p) return { score: 0, label: '', color: '#444' }
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++
  if (/[^a-zA-Z0-9]/.test(p)) score++
  const levels = [
    { score: 1, label: 'Faible', color: '#ef4444' },
    { score: 2, label: 'Moyen', color: '#f59e0b' },
    { score: 3, label: 'Fort', color: '#D4AF37' },
    { score: 4, label: 'Très fort', color: '#22c55e' }
  ]
  return { score, ...levels[score - 1] || { label: 'Faible', color: '#ef4444' } }
})

async function handleSave() {
  msg.value = null
  if (!newPassword.value || newPassword.value.length < 6) {
    msg.value = { type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' }
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    msg.value = { type: 'error', text: 'Les mots de passe ne correspondent pas.' }
    return
  }

  saving.value = true
  try {
    if (props.targetId) {
      // Patron resets someone else's password
      await callEdgeFunction('manage-user', {
        action: 'reset_password',
        target_id: props.targetId,
        new_password: newPassword.value
      })
    } else {
      // User changes their own password
      const { error } = await supabase.auth.updateUser({ password: newPassword.value })
      if (error) throw error
    }
    msg.value = { type: 'success', text: 'Mot de passe mis à jour avec succès.' }
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => { emit('saved'); emit('close') }, 1500)
  } catch (e) {
    msg.value = { type: 'error', text: e.message }
  } finally {
    saving.value = false
  }
}
</script>
