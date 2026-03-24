<template>
  <div>

    <!-- ── Header with week navigation ───────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
      <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Planning de l'équipe</h2>
      <div class="flex-1 h-px hidden sm:block" style="background: #1a1a1a;"></div>
      <div class="flex items-center gap-2">
        <button @click="prevWeek" class="btn-ghost px-3 py-1 text-lg">‹</button>
        <span class="font-body text-sm tabular-nums" style="color: #B8C4D0; min-width: 200px; text-align: center;">
          {{ weekLabel }}
        </span>
        <button @click="nextWeek" class="btn-ghost px-3 py-1 text-lg">›</button>
        <button @click="goToToday" class="btn-ghost text-xs px-3 py-2">Aujourd'hui</button>
        <button @click="showCreateShift = true" class="btn-gold text-xs px-4 py-2">+ Shift</button>
      </div>
    </div>

    <!-- ── Weekly calendar grid ───────────────────────────── -->
    <div class="ds-card p-0 overflow-hidden mb-8">
      <div class="overflow-x-auto">
        <table class="w-full" style="min-width: 700px;">
          <thead>
            <tr style="border-bottom: 1px solid #1a1a1a;">
              <th class="px-4 py-3 text-left w-32" style="border-right: 1px solid #1a1a1a;">
                <span class="text-xs tracking-[0.12em] uppercase font-body" style="color: #555;">Agent</span>
              </th>
              <th v-for="day in weekDays" :key="day.iso"
                  class="px-3 py-3 text-center"
                  :style="day.isToday ? 'background: rgba(184,196,208,0.06);' : ''">
                <p class="text-xs tracking-[0.1em] uppercase font-body" style="color: #555;">{{ day.label }}</p>
                <p class="font-display text-lg" :style="day.isToday ? 'color: #B8C4D0;' : 'color: #F5F5F0;'">
                  {{ day.num }}
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(agent, i) in activeAgents" :key="agent.id"
                :style="i % 2 === 0 ? 'background: rgba(255,255,255,0.01);' : ''">
              <!-- Agent name -->
              <td class="px-4 py-3" style="border-right: 1px solid #1a1a1a;">
                <p class="font-body text-xs font-medium truncate" style="color: #F5F5F0; max-width: 110px;">
                  {{ agent.full_name.split(' ')[0] }}
                </p>
                <p class="font-body text-xs" style="color: #555;">{{ agent.grades?.label || agent.role }}</p>
              </td>
              <!-- Day cells -->
              <td v-for="day in weekDays" :key="day.iso"
                  class="px-2 py-2 align-top"
                  :style="day.isToday ? 'background: rgba(184,196,208,0.04);' : ''">
                <!-- Time off -->
                <div v-if="hasTimeOff(agent.id, day.iso)"
                     class="text-xs font-body px-2 py-1 rounded mb-1 text-center"
                     style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #ef4444;">
                  Off
                </div>
                <!-- Shifts -->
                <div v-for="shift in getShiftsForDay(agent.id, day.iso)" :key="shift.id"
                     class="text-xs font-body px-2 py-1 rounded mb-1 cursor-pointer group relative"
                     style="background: rgba(184,196,208,0.1); border: 1px solid rgba(184,196,208,0.25); color: #B8C4D0;">
                  <p class="font-medium truncate">{{ shift.label }}</p>
                  <p class="tabular-nums" style="color: #888; font-size: 0.65rem;">
                    {{ formatShiftTime(shift.start_time) }}–{{ formatShiftTime(shift.end_time) }}
                  </p>
                  <button @click.stop="handleDeleteShift(shift.id)"
                          class="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          style="color: #ef4444;">✕</button>
                </div>
                <!-- Empty cell click to add -->
                <button @click="quickAdd(agent.id, day.iso)"
                        class="w-full text-xs py-1 rounded opacity-0 hover:opacity-100 transition-opacity font-body"
                        style="color: #444; border: 1px dashed #242424;">
                  +
                </button>
              </td>
            </tr>
            <tr v-if="activeAgents.length === 0">
              <td :colspan="8" class="px-5 py-8 text-center">
                <p class="font-body text-sm" style="color: #555;">Aucun agent actif</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Time off requests ───────────────────────────────── -->
    <div>
      <div class="flex items-center gap-4 mb-4">
        <h3 class="font-display text-xl font-light" style="color: #F5F5F0;">Demandes de congé</h3>
        <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
        <span v-if="pendingCount > 0"
              class="text-xs font-body px-2 py-0.5 rounded"
              style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b;">
          {{ pendingCount }} en attente
        </span>
      </div>

      <div v-if="timeOffs.length === 0" class="ds-card text-center py-8">
        <p class="font-body text-sm" style="color: #555;">Aucune demande de congé</p>
      </div>

      <div v-else class="space-y-2">
        <div v-for="t in timeOffs" :key="t.id"
             class="ds-card flex items-center justify-between flex-wrap gap-3 py-3"
             :style="t.status === 'pending' ? 'border-color: rgba(245,158,11,0.3);' :
                     t.status === 'approved' ? 'border-color: rgba(184,196,208,0.25);' :
                     'border-color: rgba(239,68,68,0.2); opacity: 0.6;'">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="text-xs font-body font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded"
                  :style="t.status === 'pending' ? 'background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3);' :
                          t.status === 'approved' ? 'background: rgba(184,196,208,0.1); color: #B8C4D0; border: 1px solid rgba(184,196,208,0.3);' :
                          'background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);'">
              {{ t.status === 'pending' ? 'En attente' : t.status === 'approved' ? 'Approuvé' : 'Refusé' }}
            </span>
            <div>
              <p class="font-body text-sm font-medium" style="color: #F5F5F0;">
                {{ t.profiles?.full_name }}
                <span v-if="t.profiles?.badge_number" style="color: #666;"> · #{{ t.profiles.badge_number }}</span>
              </p>
              <p class="font-body text-xs tabular-nums" style="color: #666;">
                {{ formatDate(t.start_date) }} → {{ formatDate(t.end_date) }}
                <span v-if="t.reason" style="color: #555;"> · {{ t.reason }}</span>
              </p>
            </div>
          </div>
          <div v-if="t.status === 'pending'" class="flex gap-2">
            <button @click="handleReview(t.id, 'approved')"
                    class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                    style="background: rgba(184,196,208,0.1); border: 1px solid rgba(184,196,208,0.3); color: #B8C4D0;">
              ✓ Approuver
            </button>
            <button @click="handleReview(t.id, 'rejected')"
                    class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                    style="background: transparent; border: 1px solid rgba(239,68,68,0.25); color: #ef4444;">
              ✕ Refuser
            </button>
          </div>
          <button v-else @click="handleDeleteTimeOff(t.id)"
                  class="text-xs font-body tracking-[0.08em] uppercase px-2 py-1 rounded-sm"
                  style="color: #555; border: 1px solid #242424;">
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- ── Create shift modal ──────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showCreateShift" class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background: rgba(0,0,0,0.88);" @click.self="showCreateShift = false">
        <div class="ds-card w-full max-w-lg fade-up">
          <h3 class="font-display text-2xl font-light mb-1" style="color: #F5F5F0;">Créer un shift</h3>
          <p class="text-sm font-body mb-5" style="color: #666;">Assigner un horaire à un agent</p>

          <div v-if="shiftError" class="mb-4 p-3 rounded text-sm font-body"
               style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171;">
            {{ shiftError }}
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Agent *</label>
              <select v-model="newShift.agentId" class="ds-input">
                <option value="">— Sélectionner un agent —</option>
                <option v-for="a in activeAgents" :key="a.id" :value="a.id">
                  {{ a.full_name }}{{ a.badge_number ? ` · #${a.badge_number}` : '' }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Label</label>
              <input v-model="newShift.label" type="text" placeholder="ex: Soirée vendredi" class="ds-input" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Début *</label>
                <input v-model="newShift.startTime" type="datetime-local" class="ds-input" />
              </div>
              <div>
                <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Fin *</label>
                <input v-model="newShift.endTime" type="datetime-local" class="ds-input" />
              </div>
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Note</label>
              <input v-model="newShift.note" type="text" placeholder="Informations supplémentaires..." class="ds-input" />
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleCreateShift" :disabled="creatingShift" class="btn-gold flex-1">
                {{ creatingShift ? '...' : 'Créer le shift' }}
              </button>
              <button @click="showCreateShift = false" class="btn-ghost flex-1">Annuler</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/fr'
dayjs.extend(isoWeek)
dayjs.locale('fr')

import { useServicesStore } from '@/stores/services'
import { useAuthStore } from '@/stores/auth'

const servicesStore = useServicesStore()
const authStore     = useAuthStore()
const { shifts, timeOffs, allProfiles } = storeToRefs(servicesStore)
const { profile } = storeToRefs(authStore)

// ── Week navigation ────────────────────────────────────
const weekOffset = ref(0)
const weekStart  = computed(() => dayjs().startOf('isoWeek').add(weekOffset.value, 'week'))
const weekLabel  = computed(() => {
  const s = weekStart.value.format('DD MMM')
  const e = weekStart.value.endOf('isoWeek').format('DD MMM YYYY')
  return `${s} — ${e}`
})

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = weekStart.value.add(i, 'day')
    return {
      iso:     d.format('YYYY-MM-DD'),
      label:   d.format('ddd'),
      num:     d.format('D'),
      isToday: d.isSame(dayjs(), 'day')
    }
  })
})

function prevWeek()  { weekOffset.value-- }
function nextWeek()  { weekOffset.value++ }
function goToToday() { weekOffset.value = 0 }

// ── Fetch on week change ───────────────────────────────
watch(weekStart, () => loadWeek(), { immediate: false })

async function loadWeek() {
  await servicesStore.fetchShifts(null, weekStart.value.toDate())
}

// ── Helpers ────────────────────────────────────────────
const activeAgents = computed(() => allProfiles.value.filter(p => p.is_active !== false))

const pendingCount = computed(() => timeOffs.value.filter(t => t.status === 'pending').length)

function getShiftsForDay(agentId, dateIso) {
  return shifts.value.filter(s =>
    s.agent_id === agentId &&
    dayjs(s.start_time).format('YYYY-MM-DD') === dateIso
  )
}

function hasTimeOff(agentId, dateIso) {
  return timeOffs.value.some(t =>
    t.agent_id === agentId &&
    t.status !== 'rejected' &&
    dateIso >= t.start_date &&
    dateIso <= t.end_date
  )
}

function formatShiftTime(iso) { return dayjs(iso).format('HH:mm') }
function formatDate(d)        { return dayjs(d).format('DD MMM YYYY') }

// ── Create shift ───────────────────────────────────────
const showCreateShift = ref(false)
const creatingShift   = ref(false)
const shiftError      = ref('')
const newShift = ref({ agentId: '', label: 'Shift', startTime: '', endTime: '', note: '' })

function quickAdd(agentId, dateIso) {
  newShift.value.agentId   = agentId
  newShift.value.startTime = `${dateIso}T20:00`
  newShift.value.endTime   = `${dateIso}T02:00`
  showCreateShift.value    = true
}

async function handleCreateShift() {
  shiftError.value = ''
  if (!newShift.value.agentId || !newShift.value.startTime || !newShift.value.endTime) {
    shiftError.value = 'Agent, début et fin sont obligatoires.'
    return
  }
  creatingShift.value = true
  try {
    await servicesStore.createShift(
      newShift.value.agentId,
      profile.value.id,
      new Date(newShift.value.startTime).toISOString(),
      new Date(newShift.value.endTime).toISOString(),
      newShift.value.label || 'Shift',
      newShift.value.note || null
    )
    showCreateShift.value = false
    newShift.value = { agentId: '', label: 'Shift', startTime: '', endTime: '', note: '' }
  } catch (e) {
    shiftError.value = e.message
  } finally {
    creatingShift.value = false
  }
}

async function handleDeleteShift(id) {
  await servicesStore.deleteShift(id)
}

// ── Time off review ────────────────────────────────────
async function handleReview(id, status) {
  await servicesStore.reviewTimeOff(id, status, profile.value.id)
}

async function handleDeleteTimeOff(id) {
  await servicesStore.deleteTimeOff(id)
}

// ── Lifecycle ──────────────────────────────────────────
onMounted(async () => {
  await loadWeek()
  await servicesStore.fetchTimeOffs()
})
</script>
