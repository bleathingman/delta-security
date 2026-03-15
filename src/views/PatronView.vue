<template>
  <div class="min-h-screen" style="background: #080808;">
    <NavBar />

    <div class="max-w-7xl mx-auto px-6 py-10 space-y-10">

      <!-- ── Header ──────────────────────────────────────────── -->
      <div class="fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <p class="text-xs tracking-[0.3em] uppercase mb-2 font-body" style="color: #D4AF37;">
            — Direction
          </p>
          <h1 class="font-display text-5xl font-light" style="color: #F5F5F0;">
            Vue <span style="color: #D4AF37;">Patron</span>
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <button v-for="tab in tabs" :key="tab.id"
                  @click="activeTab = tab.id"
                  class="font-body text-xs tracking-[0.15em] uppercase px-4 py-2 rounded-sm transition-all duration-200"
                  :style="activeTab === tab.id
                    ? 'background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.4); color: #D4AF37;'
                    : 'background: transparent; border: 1px solid #242424; color: #666;'">
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- ── My own service panel (patron can also clock in) ─── -->
      <div class="fade-up delay-100 ds-card"
           :class="activeService ? 'gold-glow' : ''">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-px h-5" style="background: #D4AF37;"></div>
          <h2 class="font-display text-xl font-light" style="color: #F5F5F0;">Mon service</h2>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-1">
            <div v-if="activeService">
              <span class="badge-active mb-2 inline-flex">En service</span>
              <p class="font-display text-2xl font-light mt-2" style="color: #F5F5F0;">{{ activeService.mission_label }}</p>
              <p class="font-display text-3xl tabular-nums mt-1" style="color: #D4AF37;">{{ liveElapsed }}</p>
            </div>
            <div v-else class="flex items-center gap-3">
              <input v-model="missionLabel" type="text" class="ds-input"
                     placeholder="Label de mission (optionnel)" style="max-width: 320px;" />
            </div>
          </div>
          <div>
            <button v-if="!activeService" @click="handleStartService" :disabled="actionLoading" class="btn-gold">
              ▶ Prise de service
            </button>
            <button v-else @click="handleEndService" :disabled="actionLoading"
                    class="font-body font-semibold tracking-widest uppercase text-sm px-6 py-3 rounded-sm transition-all duration-200"
                    style="background: transparent; border: 1px solid rgba(212,175,55,0.4); color: #D4AF37;">
              ⏹ Fin de service
            </button>
          </div>
        </div>
      </div>

      <!-- ── Tab: Services live ──────────────────────────────── -->
      <div v-if="activeTab === 'services'" class="fade-up delay-200 space-y-6">

        <!-- Live services -->
        <div>
          <div class="flex items-center gap-4 mb-4">
            <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">
              Services actifs
              <span class="text-base ml-2 font-body" style="color: #D4AF37;">({{ liveServices.length }})</span>
            </h2>
            <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
          </div>

          <div v-if="liveServices.length === 0" class="ds-card text-center py-8">
            <p class="font-display text-lg font-light" style="color: #444;">Aucun service en cours</p>
          </div>
          <div v-else class="grid sm:grid-cols-2 gap-3">
            <ServiceCard
              v-for="s in liveServices" :key="s.id"
              :service="s" :showAgent="true"
            />
          </div>
        </div>

        <!-- All recent services -->
        <div>
          <div class="flex items-center gap-4 mb-4">
            <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Historique récent</h2>
            <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
            <button @click="loadAll" class="btn-ghost text-xs">Tout charger</button>
          </div>

          <!-- Filter bar -->
          <div class="flex gap-3 mb-4 flex-wrap">
            <input v-model="searchQuery" type="text" class="ds-input"
                   style="max-width: 260px;" placeholder="Rechercher un agent..." />
            <select v-model="filterStatus" class="ds-input" style="max-width: 180px;">
              <option value="">Tous les statuts</option>
              <option value="active">En service</option>
              <option value="ended">Terminés</option>
            </select>
          </div>

          <div v-if="servicesStore.loading" class="text-center py-8">
            <div class="w-8 h-8 border-2 border-gold-dark border-t-gold rounded-full animate-spin mx-auto"></div>
          </div>
          <div v-else class="space-y-3">
            <ServiceCard
              v-for="s in filteredServices" :key="s.id"
              :service="s" :showAgent="true"
            />
            <div v-if="filteredServices.length === 0" class="ds-card text-center py-8">
              <p class="font-body text-sm" style="color: #555;">Aucun résultat</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: Salaires ───────────────────────────────────── -->
      <div v-if="activeTab === 'salaires'" class="fade-up delay-200">
        <SalaryTable />
      </div>

      <!-- ── Tab: Équipe ─────────────────────────────────────── -->
      <div v-if="activeTab === 'equipe'" class="fade-up delay-200">
        <div class="flex items-center gap-4 mb-6">
          <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Équipe</h2>
          <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
          <span class="text-xs tracking-[0.15em] uppercase font-body" style="color: #555;">
            {{ allProfiles.length }} membres
          </span>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="p in allProfiles" :key="p.id" class="ds-card hover:border-opacity-60 transition-all duration-200"
               :style="isOnDuty(p.id) ? 'border-color: rgba(212,175,55,0.35);' : ''">
            <div class="flex items-start justify-between mb-3">
              <div>
                <p class="font-body font-semibold" style="color: #F5F5F0;">{{ p.full_name }}</p>
                <p class="text-xs mt-0.5 font-body" style="color: #666;">
                  {{ p.role === 'patron' ? '⬡ Patron' : '◈ Agent' }}
                  <span v-if="p.badge_number" style="color: #444;"> · #{{ p.badge_number }}</span>
                </p>
              </div>
              <span v-if="isOnDuty(p.id)" class="badge-active">Actif</span>
              <span v-else class="badge-ended">Off</span>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-body" style="color: #555;">Taux horaire</p>
                <p class="font-display text-lg" style="color: #D4AF37;">{{ p.hourly_rate }}$/h</p>
              </div>
              <!-- Edit hourly rate -->
              <button @click="openRateEditor(p)" class="btn-ghost text-xs px-3 py-1">
                Modifier
              </button>
            </div>
          </div>
        </div>

        <!-- Edit rate modal -->
        <div v-if="editingProfile" class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background: rgba(0,0,0,0.85);">
          <div class="ds-card w-full max-w-sm gold-glow fade-up">
            <h3 class="font-display text-2xl font-light mb-1" style="color: #F5F5F0;">
              Modifier le taux
            </h3>
            <p class="text-sm font-body mb-5" style="color: #888;">{{ editingProfile.full_name }}</p>
            <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #555;">
              Nouveau taux ($/h)
            </label>
            <input v-model.number="newRate" type="number" step="0.5" min="0"
                   class="ds-input mb-5" />
            <div class="flex gap-3">
              <button @click="saveRate" class="btn-gold flex-1" :disabled="savingRate">
                {{ savingRate ? '...' : 'Enregistrer' }}
              </button>
              <button @click="editingProfile = null" class="btn-ghost flex-1">Annuler</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
dayjs.extend(isoWeek)

import NavBar from '@/components/NavBar.vue'
import ServiceCard from '@/components/ServiceCard.vue'
import SalaryTable from '@/components/SalaryTable.vue'
import { useAuthStore } from '@/stores/auth'
import { useServicesStore } from '@/stores/services'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const servicesStore = useServicesStore()
const { profile } = storeToRefs(authStore)
const { allServices, allProfiles, activeService } = storeToRefs(servicesStore)

const tabs = [
  { id: 'services', label: 'Services' },
  { id: 'salaires', label: 'Salaires' },
  { id: 'equipe', label: 'Équipe' }
]
const activeTab = ref('services')

const missionLabel = ref('')
const actionLoading = ref(false)
const liveElapsed = ref('00:00:00')
let elapsedTimer = null

const searchQuery = ref('')
const filterStatus = ref('')

const editingProfile = ref(null)
const newRate = ref(0)
const savingRate = ref(false)

// ── Live services ──────────────────────────────────────────
const liveServices = computed(() =>
  allServices.value.filter(s => s.is_active)
)

// ── Filtered history ───────────────────────────────────────
const filteredServices = computed(() => {
  let list = allServices.value.filter(s => !s.is_active)
  if (filterStatus.value === 'active') list = allServices.value.filter(s => s.is_active)
  if (filterStatus.value === 'ended') list = allServices.value.filter(s => !s.is_active)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s =>
      s.profiles?.full_name?.toLowerCase().includes(q) ||
      s.mission_label?.toLowerCase().includes(q)
    )
  }
  return list
})

function isOnDuty(userId) {
  return allServices.value.some(s => s.user_id === userId && s.is_active)
}

// ── Own service (patron) ───────────────────────────────────
function tickElapsed() {
  if (!activeService.value) return
  const diff = dayjs().diff(dayjs(activeService.value.start_time), 'second')
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  liveElapsed.value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

async function handleStartService() {
  if (!profile.value) return
  actionLoading.value = true
  try {
    await servicesStore.startService(profile.value.id, missionLabel.value || 'Mission standard')
    missionLabel.value = ''
    startElapsedTimer()
    await servicesStore.fetchAllServices()
  } catch (e) { console.error(e) }
  finally { actionLoading.value = false }
}

async function handleEndService() {
  if (!activeService.value) return
  actionLoading.value = true
  try {
    await servicesStore.endService(activeService.value.id)
    clearInterval(elapsedTimer)
    await servicesStore.fetchAllServices()
  } catch (e) { console.error(e) }
  finally { actionLoading.value = false }
}

function startElapsedTimer() {
  clearInterval(elapsedTimer)
  tickElapsed()
  elapsedTimer = setInterval(tickElapsed, 1000)
}

// ── Load all services ──────────────────────────────────────
async function loadAll() {
  await servicesStore.fetchAllServices()
}

// ── Edit hourly rate ───────────────────────────────────────
function openRateEditor(p) {
  editingProfile.value = p
  newRate.value = p.hourly_rate
}

async function saveRate() {
  if (!editingProfile.value) return
  savingRate.value = true
  const { error } = await supabase
    .from('profiles')
    .update({ hourly_rate: newRate.value })
    .eq('id', editingProfile.value.id)
  if (!error) {
    const idx = allProfiles.value.findIndex(p => p.id === editingProfile.value.id)
    if (idx !== -1) allProfiles.value[idx].hourly_rate = newRate.value
  }
  savingRate.value = false
  editingProfile.value = null
}

// ── Lifecycle ──────────────────────────────────────────────
onMounted(async () => {
  if (profile.value) {
    await servicesStore.fetchActiveService(profile.value.id)
    await servicesStore.fetchAllServices()
    await servicesStore.fetchAllProfiles()
    if (activeService.value) startElapsedTimer()
  }

  // Realtime subscription for live updates
  const channel = supabase
    .channel('services-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, async () => {
      await servicesStore.fetchAllServices()
    })
    .subscribe()
})

onUnmounted(() => {
  clearInterval(elapsedTimer)
  supabase.removeAllChannels()
})
</script>
