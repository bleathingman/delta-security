<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Blâmes & Avertissements</h2>
      <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
      <span class="text-xs tracking-[0.15em] uppercase font-body" style="color: #555;">
        {{ warnings.length }} entrées
      </span>
    </div>

    <!-- Add warning form -->
    <div class="ds-card max-w-lg mb-8">
      <p class="text-xs tracking-[0.15em] uppercase mb-5 font-body" style="color: #555;">
        — Émettre un avertissement
      </p>

      <div v-if="formMsg" class="mb-4 p-3 rounded text-sm font-body"
           :style="formMsg.type === 'success'
             ? 'background: rgba(184,196,208,0.08); border: 1px solid rgba(184,196,208,0.25); color: #B8C4D0;'
             : 'background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171;'">
        {{ formMsg.text }}
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Agent *</label>
          <select v-model="form.agentId" class="ds-input">
            <option value="">— Sélectionner un agent —</option>
            <option v-for="p in agentProfiles" :key="p.id" :value="p.id">
              {{ p.full_name }}{{ p.badge_number ? ` · #${p.badge_number}` : '' }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Type *</label>
          <div class="flex gap-2 flex-wrap">
            <button v-for="s in severities" :key="s.value"
                    @click="form.severity = s.value"
                    class="flex-1 py-2 px-3 text-xs font-body tracking-[0.08em] uppercase rounded-sm transition-all duration-200"
                    :style="form.severity === s.value
                      ? `background: ${s.bg}; border: 1px solid ${s.border}; color: ${s.color};`
                      : 'background: transparent; border: 1px solid #242424; color: #555;'">
              {{ s.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Message *</label>
          <textarea v-model="form.message" class="ds-input resize-none" rows="3"
                    placeholder="Décrivez la raison de l'avertissement..." />
        </div>

        <button @click="handleSubmit" :disabled="submitting" class="btn-gold w-full">
          <span v-if="submitting">...</span>
          <span v-else>Émettre l'avertissement</span>
        </button>
      </div>
    </div>

    <!-- Warnings list -->
    <div v-if="warnings.length === 0" class="ds-card text-center py-10">
      <p class="font-display text-xl font-light" style="color: #444;">Aucun avertissement</p>
      <p class="text-sm font-body mt-1" style="color: #555;">L'équipe est au vert 🟢</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="w in warnings" :key="w.id" class="ds-card"
           :style="`border-color: ${severityStyle(w.severity).border};`">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2 flex-wrap">
              <span class="text-xs font-body font-semibold tracking-[0.1em] uppercase px-2 py-0.5 rounded"
                    :style="`background: ${severityStyle(w.severity).bg}; border: 1px solid ${severityStyle(w.severity).border}; color: ${severityStyle(w.severity).color};`">
                {{ severityStyle(w.severity).label }}
              </span>
              <span class="font-body text-sm font-medium" style="color: #F5F5F0;">
                {{ w.profiles?.full_name }}
                <span v-if="w.profiles?.badge_number" style="color: #666;"> · #{{ w.profiles.badge_number }}</span>
              </span>
            </div>
            <p class="font-body text-sm mb-2" style="color: #888;">{{ w.message }}</p>
            <p class="text-xs font-body" style="color: #444;">
              Par {{ w.patron?.full_name || 'Patron' }} · {{ formatDate(w.created_at) }}
            </p>
          </div>
          <button @click="handleDelete(w.id)"
                  class="shrink-0 text-xs font-body px-2 py-1 rounded-sm transition-all duration-200"
                  style="background: transparent; border: 1px solid rgba(239,68,68,0.2); color: #ef444466;"
                  onmouseover="this.style.background='rgba(239,68,68,0.08)'; this.style.color='#ef4444'"
                  onmouseout="this.style.background='transparent'; this.style.color='#ef444466'">
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
dayjs.locale('fr')
import { useServicesStore } from '@/stores/services'
import { useAuthStore } from '@/stores/auth'

const servicesStore = useServicesStore()
const authStore     = useAuthStore()
const { warnings, allProfiles } = storeToRefs(servicesStore)
const { profile } = storeToRefs(authStore)

const agentProfiles = computed(() => allProfiles.value.filter(p => p.id !== profile.value?.id))

const severities = [
  { value: 'warning',    label: 'Avertissement', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',    border: 'rgba(245,158,11,0.35)' },
  { value: 'blame',      label: 'Blâme',         color: '#ef4444', bg: 'rgba(239,68,68,0.1)',     border: 'rgba(239,68,68,0.35)' },
  { value: 'suspension', label: 'Suspension',     color: '#dc2626', bg: 'rgba(220,38,38,0.15)',    border: 'rgba(220,38,38,0.5)' },
]

function severityStyle(s) {
  return severities.find(x => x.value === s) || severities[0]
}

const form = ref({ agentId: '', message: '', severity: 'warning' })
const submitting = ref(false)
const formMsg    = ref(null)

function formatDate(iso) {
  return dayjs(iso).format('DD MMM YYYY à HH:mm')
}

async function handleSubmit() {
  if (!form.value.agentId || !form.value.message) {
    formMsg.value = { type: 'error', text: 'Agent et message sont obligatoires.' }
    return
  }
  submitting.value = true
  formMsg.value = null
  try {
    await servicesStore.addWarning(form.value.agentId, profile.value.id, form.value.message, form.value.severity)
    formMsg.value = { type: 'success', text: 'Avertissement émis.' }
    form.value = { agentId: '', message: '', severity: 'warning' }
    setTimeout(() => { formMsg.value = null }, 3000)
  } catch (e) {
    formMsg.value = { type: 'error', text: e.message }
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  await servicesStore.deleteWarning(id)
}

onMounted(() => servicesStore.fetchWarnings())
</script>
