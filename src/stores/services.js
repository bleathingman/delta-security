import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'
dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)

export const useServicesStore = defineStore('services', () => {
  const myServices = ref([])
  const allServices = ref([])
  const allProfiles = ref([])
  const activeService = ref(null)
  const loading = ref(false)

  // ── Mon service actif ──────────────────────────────────────────────
  async function fetchActiveService(userId) {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
    activeService.value = data
  }

  // ── Mes services (agent) ───────────────────────────────────────────
  async function fetchMyServices(userId) {
    loading.value = true
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(50)
    if (!error) myServices.value = data
    loading.value = false
  }

  // ── Tous les services (patron) ─────────────────────────────────────
  async function fetchAllServices() {
    loading.value = true
    const { data, error } = await supabase
      .from('services')
      .select(`*, profiles(full_name, role, badge_number, hourly_rate)`)
      .order('start_time', { ascending: false })
      .limit(200)
    if (!error) allServices.value = data
    loading.value = false
  }

  // ── Tous les profils (patron) ──────────────────────────────────────
  async function fetchAllProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    allProfiles.value = data ?? []
  }

  // ── Prise de service ──────────────────────────────────────────────
  async function startService(userId, missionLabel = 'Mission standard') {
    if (activeService.value) throw new Error('Un service est déjà en cours')
    const { data, error } = await supabase
      .from('services')
      .insert({ user_id: userId, mission_label: missionLabel, start_time: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    activeService.value = data
    myServices.value.unshift(data)
    return data
  }

  // ── Fin de service ─────────────────────────────────────────────────
  async function endService(serviceId) {
    const endTime = new Date().toISOString()
    const { data, error } = await supabase
      .from('services')
      .update({ end_time: endTime, is_active: false })
      .eq('id', serviceId)
      .select()
      .single()
    if (error) throw error
    activeService.value = null
    const idx = myServices.value.findIndex(s => s.id === serviceId)
    if (idx !== -1) myServices.value[idx] = data
    return data
  }

  // ── Calcul salaire hebdo ───────────────────────────────────────────
  function computeWeeklySalaries(weekStart) {
    const start = dayjs(weekStart).startOf('isoWeek')
    const end = start.endOf('isoWeek')

    const profileMap = {}
    allProfiles.value.forEach(p => {
      profileMap[p.id] = { ...p, total_minutes: 0, total_services: 0 }
    })

    allServices.value.forEach(s => {
      if (!s.end_time) return
      const sDate = dayjs(s.start_time)
      if (sDate.isBefore(start) || sDate.isAfter(end)) return
      const uid = s.user_id
      if (!profileMap[uid]) return
      const mins = s.duration_minutes || 0
      profileMap[uid].total_minutes += mins
      profileMap[uid].total_services += 1
    })

    return Object.values(profileMap).map(p => ({
      ...p,
      intervals_of_10: Math.floor(p.total_minutes / 10),
      weekly_salary: +(Math.floor(p.total_minutes / 10) * (p.hourly_rate / 6)).toFixed(2)
    }))
  }

  // ── Formatage durée ────────────────────────────────────────────────
  function formatDuration(minutes) {
    if (!minutes) return '—'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    return `${h}h${m.toString().padStart(2, '0')}`
  }

  return {
    myServices, allServices, allProfiles, activeService, loading,
    fetchActiveService, fetchMyServices, fetchAllServices, fetchAllProfiles,
    startService, endService, computeWeeklySalaries, formatDuration
  }
})
