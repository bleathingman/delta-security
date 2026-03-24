<template>
  <div class="space-y-8">

    <!-- ── Mes prochains shifts ────────────────────────────── -->
    <div>
      <div class="flex items-center gap-4 mb-4">
        <h2 class="font-display text-xl sm:text-2xl font-light" style="color: #F5F5F0;">Mes prochains shifts</h2>
        <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
      </div>

      <div v-if="upcomingShifts.length === 0" class="ds-card text-center py-8">
        <p class="font-display text-lg font-light mb-1" style="color: #444;">Aucun shift assigné</p>
        <p class="text-sm font-body" style="color: #555;">Votre patron n'a pas encore planifié de shifts</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="shift in upcomingShifts" :key="shift.id"
             class="ds-card flex items-center justify-between gap-4 flex-wrap"
             :style="isToday(shift.start_time) ? 'border-color: rgba(184,196,208,0.35);' : ''">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span v-if="isToday(shift.start_time)" class="badge-active">Aujourd'hui</span>
              <p class="font-body font-medium" style="color: #F5F5F0;">{{ shift.label }}</p>
            </div>
            <p class="font-body text-sm tabular-nums" style="color: #B8C4D0;">
              {{ formatFullDate(shift.start_time) }}
              <span style="color: #666;"> · </span>
              {{ formatTime(shift.start_time) }} — {{ formatTime(shift.end_time) }}
            </p>
            <p v-if="shift.note" class="font-body text-xs mt-1 italic" style="color: #666;">{{ shift.note }}</p>
          </div>
          <div class="text-right">
            <p class="font-body text-xs tabular-nums" style="color: #555;">
              {{ formatDuration(shift.start_time, shift.end_time) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Demande de congé ────────────────────────────────── -->
    <div>
      <div class="flex items-center gap-4 mb-4">
        <h2 class="font-display text-xl sm:text-2xl font-light" style="color: #F5F5F0;">Mes congés</h2>
        <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
        <button @click="showForm = !showForm" class="btn-gold text-xs px-4 py-2">
          {{ showForm ? '✕ Fermer' : '+ Demande de congé' }}
        </button>
      </div>

      <!-- Request form -->
      <div v-if="showForm" class="ds-card mb-4" style="border-color: rgba(184,196,208,0.2);">
        <p class="text-xs tracking-[0.15em] uppercase mb-4 font-body" style="color: #555;">
          — Nouvelle demande
        </p>

        <div v-if="formMsg" class="mb-4 p-3 rounded text-sm font-body"
             :style="formMsg.type === 'success'
               ? 'background: rgba(184,196,208,0.08); border: 1px solid rgba(184,196,208,0.25); color: #B8C4D0;'
               : 'background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171;'">
          {{ formMsg.text }}
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">
                Date de début *
              </label>
              <input v-model="form.startDate" type="date" class="ds-input" />
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">
                Date de fin *
              </label>
              <input v-model="form.endDate" type="date" class="ds-input" />
            </div>
          </div>
          <div>
            <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">
              Raison (optionnel)
            </label>
            <input v-model="form.reason" type="text" placeholder="Vacances, rendez-vous, etc." class="ds-input" />
          </div>
          <button @click="handleRequest" :disabled="submitting" class="btn-gold w-full">
            {{ submitting ? '...' : 'Envoyer la demande' }}
          </button>
        </div>
      </div>

      <!-- My time off list -->
      <div v-if="myTimeOffs.length === 0 && !showForm" class="ds-card text-center py-8">
        <p class="font-display text-lg font-light mb-1" style="color: #444;">Aucune demande</p>
        <p class="text-sm font-body" style="color: #555;">Utilisez le bouton ci-dessus pour déclarer une indisponibilité</p>
      </div>

      <div v-else class="space-y-2">
        <div v-for="t in myTimeOffs" :key="t.id"
             class="ds-card flex items-center justify-between gap-3 py-3 flex-wrap">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-body font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded"
                    :style="t.status === 'pending' ? 'background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3);' :
                            t.status === 'approved' ? 'background: rgba(184,196,208,0.1); color: #B8C4D0; border: 1px solid rgba(184,196,208,0.3);' :
                            'background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);'">
                {{ t.status === 'pending' ? 'En attente' : t.status === 'approved' ? 'Approuvé ✓' : 'Refusé' }}
              </span>
            </div>
            <p class="font-body text-sm tabular-nums" style="color: #F5F5F0;">
              {{ formatDate(t.start_date) }} → {{ formatDate(t.end_date) }}
            </p>
            <p v-if="t.reason" class="font-body text-xs mt-0.5 italic" style="color: #666;">{{ t.reason }}</p>
          </div>
          <button v-if="t.status === 'pending'"
                  @click="handleDelete(t.id)"
                  class="text-xs font-body px-2 py-1 rounded-sm"
                  style="color: #555; border: 1px solid #242424;">
            Annuler
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
const { shifts, timeOffs } = storeToRefs(servicesStore)
const { profile }          = storeToRefs(authStore)

const upcomingShifts = computed(() => {
  const now = dayjs()
  return shifts.value
    .filter(s => s.agent_id === profile.value?.id && dayjs(s.end_time).isAfter(now))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 10)
})

const myTimeOffs = computed(() =>
  timeOffs.value.filter(t => t.agent_id === profile.value?.id)
)

function isToday(iso)           { return dayjs(iso).isSame(dayjs(), 'day') }
function formatTime(iso)        { return dayjs(iso).format('HH:mm') }
function formatDate(d)          { return dayjs(d).format('DD MMM YYYY') }
function formatFullDate(iso)    { return dayjs(iso).format('dddd DD MMM') }
function formatDuration(s, e)   {
  const mins = dayjs(e).diff(dayjs(s), 'minute')
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`
}

// ── Time off request form ──────────────────────────────
const showForm  = ref(false)
const submitting = ref(false)
const formMsg    = ref(null)
const form       = ref({ startDate: '', endDate: '', reason: '' })

async function handleRequest() {
  formMsg.value = null
  if (!form.value.startDate || !form.value.endDate) {
    formMsg.value = { type: 'error', text: 'Les dates de début et fin sont obligatoires.' }
    return
  }
  if (form.value.endDate < form.value.startDate) {
    formMsg.value = { type: 'error', text: 'La date de fin doit être après le début.' }
    return
  }
  submitting.value = true
  try {
    await servicesStore.requestTimeOff(
      profile.value.id,
      form.value.startDate,
      form.value.endDate,
      form.value.reason || null
    )
    formMsg.value = { type: 'success', text: 'Demande envoyée. En attente d\'approbation.' }
    form.value = { startDate: '', endDate: '', reason: '' }
    setTimeout(() => { showForm.value = false; formMsg.value = null }, 2000)
  } catch (e) {
    formMsg.value = { type: 'error', text: e.message }
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  await servicesStore.deleteTimeOff(id)
}

onMounted(async () => {
  if (profile.value) {
    await servicesStore.fetchShifts(profile.value.id)
    await servicesStore.fetchTimeOffs(profile.value.id)
  }
})
</script>
