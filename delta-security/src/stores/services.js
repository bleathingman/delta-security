import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'
dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)

export const useServicesStore = defineStore('services', () => {
  const myServices    = ref([])
  const allServices   = ref([])
  const allProfiles   = ref([])
  const activeService = ref(null)
  const loading       = ref(false)

  // ── Mon service actif ──────────────────────────────────────
  async function fetchActiveService(userId) {
    const { data } = await supabase
      .from('services').select('*')
      .eq('user_id', userId).eq('is_active', true).maybeSingle()
    activeService.value = data
  }

  // ── Mes services (agent) ───────────────────────────────────
  async function fetchMyServices(userId) {
    loading.value = true
    const { data, error } = await supabase
      .from('services').select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false }).limit(100)
    if (!error) myServices.value = data
    loading.value = false
  }

  // ── Tous les services (patron) ─────────────────────────────
  async function fetchAllServices() {
    loading.value = true
    const { data, error } = await supabase
      .from('services')
      .select('*, profiles(full_name, role, badge_number, hourly_rate)')
      .order('start_time', { ascending: false }).limit(500)
    if (!error) allServices.value = data
    loading.value = false
  }

  // ── Tous les profils ───────────────────────────────────────
  async function fetchAllProfiles() {
    const { data } = await supabase
      .from('profiles').select('*').order('full_name')
    allProfiles.value = data ?? []
  }

  // ── Prise de service ───────────────────────────────────────
  async function startService(userId, missionLabel = 'Mission standard') {
    if (activeService.value) throw new Error('Un service est déjà en cours')
    const { data, error } = await supabase
      .from('services')
      .insert({ user_id: userId, mission_label: missionLabel, start_time: new Date().toISOString() })
      .select().single()
    if (error) throw error
    activeService.value = data
    myServices.value.unshift(data)
    return data
  }

  // ── Fin de service ─────────────────────────────────────────
  async function endService(serviceId) {
    const endTime = new Date().toISOString()
    const { data, error } = await supabase
      .from('services')
      .update({ end_time: endTime, is_active: false })
      .eq('id', serviceId).select().single()
    if (error) throw error
    activeService.value = null
    const idx = myServices.value.findIndex(s => s.id === serviceId)
    if (idx !== -1) myServices.value[idx] = data
    return data
  }

  // ── Calcul salaire hebdo ───────────────────────────────────
  function computeWeeklySalaries(weekStart) {
    const start = dayjs(weekStart).startOf('isoWeek')
    const end   = start.endOf('isoWeek')

    const map = {}
    allProfiles.value.forEach(p => {
      map[p.id] = { ...p, total_minutes: 0, total_services: 0 }
    })

    allServices.value.forEach(s => {
      if (!s.end_time) return
      const sDate = dayjs(s.start_time)
      if (sDate.isBefore(start) || sDate.isAfter(end)) return
      if (!map[s.user_id]) return
      map[s.user_id].total_minutes  += s.duration_minutes || 0
      map[s.user_id].total_services += 1
    })

    return Object.values(map).map(p => ({
      ...p,
      intervals_of_10: Math.floor(p.total_minutes / 10),
      weekly_salary: +(Math.floor(p.total_minutes / 10) * (p.hourly_rate / 6)).toFixed(2)
    }))
  }

  // ── Stats patron : semaine courante ────────────────────────
  function getWeekStats() {
    const start = dayjs().startOf('isoWeek')
    const end   = dayjs().endOf('isoWeek')

    const agentsOnDuty = new Set(
      allServices.value.filter(s => s.is_active).map(s => s.user_id)
    ).size

    const weekServices = allServices.value.filter(s => {
      if (!s.end_time) return false
      const d = dayjs(s.start_time)
      return d.isAfter(start) && d.isBefore(end)
    })

    const weekMinutes = weekServices.reduce((a, s) => a + (s.duration_minutes || 0), 0)

    const weekPayroll = allProfiles.value.reduce((total, p) => {
      const mins = weekServices
        .filter(s => s.user_id === p.id)
        .reduce((a, s) => a + (s.duration_minutes || 0), 0)
      return total + Math.floor(mins / 10) * (p.hourly_rate / 6)
    }, 0)

    const todayServices = allServices.value.filter(s => {
      if (!s.end_time) return false
      return dayjs(s.start_time).isSame(dayjs(), 'day')
    }).length

    return {
      agentsOnDuty,
      weekMinutes,
      weekHours: `${Math.floor(weekMinutes / 60)}h${String(weekMinutes % 60).padStart(2, '0')}`,
      weekPayroll: weekPayroll.toFixed(2),
      todayServices,
      totalServices: weekServices.length
    }
  }

  // ── Stats agent : semaine courante ─────────────────────────
  function getMyWeekStats(userId, hourlyRate) {
    const start = dayjs().startOf('isoWeek')
    const end   = dayjs().endOf('isoWeek')

    const weekServices = myServices.value.filter(s => {
      if (!s.end_time) return false
      const d = dayjs(s.start_time)
      return d.isAfter(start) && d.isBefore(end)
    })

    const weekMinutes = weekServices.reduce((a, s) => a + (s.duration_minutes || 0), 0)
    const estimatedSalary = +(Math.floor(weekMinutes / 10) * (hourlyRate / 6)).toFixed(2)

    return {
      weekServices: weekServices.length,
      weekMinutes,
      weekHours: `${Math.floor(weekMinutes / 60)}h${String(weekMinutes % 60).padStart(2, '0')}`,
      estimatedSalary
    }
  }

  // ── Export CSV salaires ────────────────────────────────────
  function exportSalariesCSV(weekStart) {
    const salaries = computeWeeklySalaries(weekStart)
    const label    = dayjs(weekStart).startOf('isoWeek').format('YYYY-MM-DD')

    const header = ['Nom', 'Rôle', 'Badge', 'Services', 'Minutes totales', 'Tranches 10min', 'Taux $/h', 'Salaire $']
    const rows   = salaries.map(e => [
      e.full_name,
      e.role,
      e.badge_number || '',
      e.total_services,
      e.total_minutes,
      e.intervals_of_10,
      e.hourly_rate,
      e.weekly_salary
    ])

    const csv     = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url     = URL.createObjectURL(blob)
    const link    = document.createElement('a')
    link.href     = url
    link.download = `delta-security-salaires-${label}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── Formatage durée ────────────────────────────────────────
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
    startService, endService,
    computeWeeklySalaries, getWeekStats, getMyWeekStats,
    exportSalariesCSV, formatDuration
  }
})
