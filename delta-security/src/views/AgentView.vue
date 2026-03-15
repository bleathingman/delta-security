<template>
  <div class="min-h-screen" style="background: #080808;">
    <NavBar />

    <div class="max-w-4xl mx-auto px-6 py-10 space-y-8">

      <!-- ── Header ──────────────────────────────────────────── -->
      <div class="fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <p class="text-xs tracking-[0.3em] uppercase mb-2 font-body" style="color: #B8C4D0;">
            — Tableau de bord
          </p>
          <h1 class="font-display text-5xl font-light" style="color: #F5F5F0;">
            {{ greeting }},<br />
            <span style="color: #B8C4D0;">{{ profile?.full_name?.split(' ')[0] }}</span>
          </h1>
        </div>
        <div class="text-right hidden sm:flex flex-col items-end gap-2">
          <p class="font-display text-2xl" style="color: #B8C4D0;">{{ weekLabel }}</p>
          <p v-if="profile?.grades?.label" class="text-xs font-body tracking-[0.15em] uppercase" style="color: #555;">
            {{ profile.grades.label }}
          </p>
          <button @click="showChangePwd = true"
                  class="text-xs font-body tracking-[0.1em] uppercase transition-colors duration-200"
                  style="color: #444;"
                  onmouseover="this.style.color='#B8C4D0'" onmouseout="this.style.color='#444'">
            🔑 Changer mon mot de passe
          </button>
        </div>
      </div>

      <!-- ── Stats ───────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 fade-up delay-100">
        <div class="ds-card text-center">
          <p class="text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #555;">Services ce mois</p>
          <p class="font-display text-4xl font-light" style="color: #F5F5F0;">{{ monthlyServices }}</p>
        </div>
        <div class="ds-card text-center">
          <p class="text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #555;">Heures ce mois</p>
          <p class="font-display text-4xl font-light" style="color: #B8C4D0;">{{ monthlyHours }}</p>
        </div>
        <div class="ds-card text-center">
          <p class="text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #555;">Services sem.</p>
          <p class="font-display text-4xl font-light" style="color: #F5F5F0;">{{ weekStats.weekServices }}</p>
        </div>
        <div class="ds-card text-center">
          <p class="text-xs tracking-[0.15em] uppercase mb-2 font-body" style="color: #555;">Heures sem.</p>
          <p class="font-display text-4xl font-light" style="color: #B8C4D0;">{{ weekStats.weekHours }}</p>
        </div>
      </div>

      <!-- ── Salaire estimé de la semaine ───────────────────── -->
      <div v-if="weekStats.estimatedSalary > 0"
           class="fade-up delay-200 ds-card flex items-center justify-between"
           style="border-color: rgba(184,196,208,0.2);">
        <div>
          <p class="text-xs tracking-[0.2em] uppercase mb-1 font-body" style="color: #555;">
            Salaire estimé — semaine en cours
          </p>
          <p class="font-body text-xs" style="color: #444;">
            {{ weekStats.weekMinutes }} min × ({{ profile?.hourly_rate }}$ ÷ 60)
            = {{ (profile?.hourly_rate / 60).toFixed(4) }}$ / min
          </p>
        </div>
        <p class="font-display text-4xl font-light" style="color: #B8C4D0;">
          {{ weekStats.estimatedSalary.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}$
        </p>
      </div>

      <!-- ── Service control panel ───────────────────────────── -->
      <div class="fade-up delay-200 ds-card"
           :class="activeService ? 'gold-glow' : ''"
           style="position: relative; overflow: hidden;">

        <div v-if="activeService" class="absolute top-0 left-0 right-0 h-px"
             style="background: linear-gradient(90deg, transparent, #B8C4D0, transparent);"></div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-6">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <span v-if="activeService" class="badge-active">Service actif</span>
              <span v-else class="badge-ended">Hors service</span>
            </div>

            <div v-if="activeService">
              <p class="font-display text-2xl font-light mb-1" style="color: #F5F5F0;">
                {{ activeService.mission_label }}
              </p>
              <p class="text-sm font-body" style="color: #888;">
                Démarré à <span style="color: #B8C4D0;" class="tabular-nums">{{ formatTime(activeService.start_time) }}</span>
              </p>
              <p class="font-display text-4xl mt-3 tabular-nums" style="color: #B8C4D0;">
                {{ liveElapsed }}
              </p>
            </div>

            <div v-else>
              <p class="font-display text-2xl font-light mb-3" style="color: #888;">Prêt pour la mission</p>
              <input v-model="missionLabel" type="text" class="ds-input"
                     placeholder="Label de mission (optionnel)" />
            </div>
          </div>

          <div class="shrink-0">
            <button v-if="!activeService"
                    @click="handleStartService" :disabled="actionLoading"
                    class="btn-gold w-full sm:w-auto" style="min-width: 180px; padding: 1rem 2rem;">
              <span v-if="actionLoading">...</span>
              <span v-else>▶ Prise de service</span>
            </button>

            <button v-else
                    @click="handleEndService" :disabled="actionLoading"
                    class="w-full sm:w-auto font-body font-semibold tracking-widest uppercase text-sm px-8 py-4 rounded-sm transition-all duration-200"
                    style="min-width: 180px; background: transparent; border: 1px solid rgba(184,196,208,0.4); color: #B8C4D0;">
              <span v-if="actionLoading">...</span>
              <span v-else>⏹ Fin de service</span>
            </button>
          </div>
        </div>

        <transition name="slide-up">
          <div v-if="toast" class="mt-4 p-3 rounded text-sm font-body"
               :style="toast.type === 'success'
                 ? 'background: rgba(184,196,208,0.08); border: 1px solid rgba(184,196,208,0.25); color: #B8C4D0;'
                 : 'background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171;'">
            {{ toast.message }}
          </div>
        </transition>
      </div>

      <!-- ── Historique ──────────────────────────────────────── -->
      <div class="fade-up delay-300">
        <div class="flex items-center gap-4 mb-5">
          <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Mes services</h2>
          <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
          <span class="text-xs tracking-[0.15em] uppercase font-body" style="color: #555;">
            {{ myServices.length }} entrées
          </span>
        </div>

        <div v-if="servicesStore.loading" class="text-center py-12">
          <div class="w-8 h-8 border-2 border-silver-dark border-t-silver rounded-full animate-spin mx-auto"></div>
        </div>

        <div v-else-if="myServices.length === 0" class="ds-card text-center py-12">
          <p class="font-display text-xl font-light mb-2" style="color: #444;">Aucun service enregistré</p>
          <p class="text-sm font-body" style="color: #555;">Votre premier service apparaîtra ici</p>
        </div>

        <div v-else class="space-y-3">
          <ServiceCard
            v-for="(service, i) in myServices"
            :key="service.id"
            :service="service"
            class="fade-up"
            :style="`animation-delay: ${i * 0.04}s`"
          />
        </div>
      </div>

    </div>

    <!-- Change password modal -->
    <ChangePasswordModal v-if="showChangePwd"
      :profileName="profile?.full_name"
      @close="showChangePwd = false"
      @saved="showChangePwd = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import isoWeek from 'dayjs/plugin/isoWeek'
dayjs.extend(isoWeek)
dayjs.locale('fr')

import NavBar from '@/components/NavBar.vue'
import ServiceCard from '@/components/ServiceCard.vue'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useServicesStore } from '@/stores/services'

const authStore      = useAuthStore()
const servicesStore  = useServicesStore()
const { profile }    = storeToRefs(authStore)
const { myServices, activeService } = storeToRefs(servicesStore)

const missionLabel  = ref('')
const actionLoading = ref(false)
const toast         = ref(null)
const liveElapsed   = ref('00:00:00')
const showChangePwd = ref(false)
let elapsedTimer = null
let toastTimer   = null

// ── Greeting ───────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
})

// ── Week label ─────────────────────────────────────────────
const weekLabel = computed(() => {
  const s = dayjs().startOf('isoWeek').format('DD MMM')
  const e = dayjs().endOf('isoWeek').format('DD MMM')
  return `${s} — ${e}`
})

// ── Stats mensuelles ───────────────────────────────────────
const monthlyServices = computed(() => {
  const start = dayjs().startOf('month')
  return myServices.value.filter(s => dayjs(s.start_time).isAfter(start) && s.end_time).length
})

const monthlyHours = computed(() => {
  const start = dayjs().startOf('month')
  const mins  = myServices.value
    .filter(s => dayjs(s.start_time).isAfter(start) && s.end_time)
    .reduce((a, s) => a + (s.duration_minutes || 0), 0)
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`
})

// ── Stats semaine courante ─────────────────────────────────
const weekStats = computed(() =>
  servicesStore.getMyWeekStats(profile.value?.id, profile.value?.hourly_rate ?? 15)
)

// ── Time helpers ───────────────────────────────────────────
function formatTime(iso) {
  return dayjs(iso).format('HH:mm:ss')
}

function tickElapsed() {
  if (!activeService.value) return
  const diff = dayjs().diff(dayjs(activeService.value.start_time), 'second')
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  liveElapsed.value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function startElapsedTimer() {
  clearInterval(elapsedTimer)
  tickElapsed()
  elapsedTimer = setInterval(tickElapsed, 1000)
}

// ── Service actions ────────────────────────────────────────
async function handleStartService() {
  if (!profile.value) return
  actionLoading.value = true
  try {
    await servicesStore.startService(profile.value.id, missionLabel.value || 'Mission standard')
    missionLabel.value = ''
    showToast('Prise de service enregistrée.', 'success')
    startElapsedTimer()
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function handleEndService() {
  if (!activeService.value) return
  actionLoading.value = true
  try {
    await servicesStore.endService(activeService.value.id)
    clearInterval(elapsedTimer)
    showToast('Fin de service enregistrée. Bonne récupération.', 'success')
    await servicesStore.fetchMyServices(profile.value.id)
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

function showToast(message, type) {
  toast.value = { message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 4000)
}

// ── Lifecycle ──────────────────────────────────────────────
onMounted(async () => {
  if (profile.value) {
    await servicesStore.fetchActiveService(profile.value.id)
    await servicesStore.fetchMyServices(profile.value.id)
    if (activeService.value) startElapsedTimer()
  }
})

onUnmounted(() => {
  clearInterval(elapsedTimer)
  clearTimeout(toastTimer)
})
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(8px); }
.slide-up-leave-to   { opacity: 0; transform: translateY(-8px); }
</style>