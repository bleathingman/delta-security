<template>
  <div>
    <!-- Week selector -->
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Salaires hebdomadaires</h2>
      <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
      <div class="flex items-center gap-3 flex-wrap">
        <button @click="prevWeek" class="btn-ghost px-3 py-1 text-lg">‹</button>
        <span class="font-body text-sm tabular-nums" style="color: #B8C4D0; min-width: 210px; text-align: center;">
          {{ weekLabel }}
        </span>
        <button @click="nextWeek" :disabled="isCurrentWeek" class="btn-ghost px-3 py-1 text-lg"
                :style="isCurrentWeek ? 'opacity:0.3;cursor:not-allowed;' : ''">›</button>
        <button @click="handleExport" class="btn-ghost text-xs px-4 py-2">
          ↓ Exporter CSV
        </button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="ds-card text-center">
        <p class="text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #555;">Employés actifs</p>
        <p class="font-display text-3xl font-light" style="color: #F5F5F0;">{{ activeEmployees }}</p>
      </div>
      <div class="ds-card text-center">
        <p class="text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #555;">Total heures</p>
        <p class="font-display text-3xl font-light" style="color: #B8C4D0;">{{ totalHoursFormatted }}</p>
      </div>
      <div class="ds-card text-center">
        <p class="text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #555;">Masse salariale</p>
        <p class="font-display text-3xl font-light" style="color: #B8C4D0;">{{ totalPayroll }}$</p>
      </div>
    </div>

    <!-- Table -->
    <div class="ds-card p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr style="border-bottom: 1px solid #1a1a1a;">
              <th class="text-left px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Agent</th>
              <th class="text-left px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Badge</th>
              <th class="text-right px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Services</th>
              <th class="text-right px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Minutes</th>
              <th class="text-right px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Taux/h</th>
              <th class="text-right px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #B8C4D0;">Salaire sem.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(emp, i) in salaries" :key="emp.id"
                :style="i % 2 === 0 ? 'background: rgba(255,255,255,0.01);' : ''"
                class="transition-colors duration-150 hover:bg-white hover:bg-opacity-[0.02]">
              <td class="px-5 py-4">
                <p class="font-body text-sm font-medium" style="color: #F5F5F0;">{{ emp.full_name }}</p>
                <p class="font-body text-xs mt-0.5" style="color: #555;">{{ emp.grades?.label || emp.role }}</p>
              </td>
              <td class="px-5 py-4">
                <span class="font-body text-xs tabular-nums" style="color: #666;">{{ emp.badge_number || '—' }}</span>
              </td>
              <td class="px-5 py-4 text-right">
                <span class="font-body text-sm tabular-nums" style="color: #F5F5F0;">{{ emp.total_services }}</span>
              </td>
              <td class="px-5 py-4 text-right">
                <span class="font-body text-sm tabular-nums" style="color: #888;">{{ emp.total_minutes }}min</span>
              </td>
              <td class="px-5 py-4 text-right">
                <span class="font-body text-sm tabular-nums" style="color: #666;">{{ emp.hourly_rate }}$/h</span>
              </td>
              <td class="px-5 py-4 text-right">
                <span class="font-display text-lg font-light"
                      :style="emp.weekly_salary > 0 ? 'color: #B8C4D0;' : 'color: #444;'">
                  {{ emp.weekly_salary > 0 ? emp.weekly_salary.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '$' : '—' }}
                </span>
              </td>
            </tr>
            <tr v-if="salaries.length === 0">
              <td colspan="7" class="px-5 py-10 text-center">
                <p class="font-body text-sm" style="color: #555;">Aucune donnée pour cette semaine</p>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="salaries.length > 0">
            <tr style="border-top: 1px solid #1a1a1a;">
              <td colspan="4" class="px-5 py-4">
                <span class="text-xs tracking-[0.15em] uppercase font-body" style="color: #555;">Total à payer</span>
              </td>
              <td></td>
              <td class="px-5 py-4 text-right">
                <span class="font-display text-xl" style="color: #B8C4D0;">{{ Number(totalPayroll).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}$</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Formula -->
    <div class="mt-4 p-4 rounded" style="background: rgba(184,196,208,0.04); border: 1px solid rgba(184,196,208,0.12);">
      <p class="text-xs font-body" style="color: #666;">
        <span style="color: #B8C4D0;">Formule :</span>
        Salaire = Minutes × (Taux horaire ÷ 60)
        &nbsp;·&nbsp; Exemple : 77min à 1000$/h → 77 × 16.67$ = <strong style="color: #B8C4D0;">1 283.33$</strong>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/fr'
dayjs.extend(isoWeek)
dayjs.locale('fr')

import { useServicesStore } from '@/stores/services'

const servicesStore = useServicesStore()
const currentWeekOffset = ref(0)

const weekStart = computed(() =>
  dayjs().startOf('isoWeek').add(currentWeekOffset.value, 'week')
)

const weekLabel = computed(() => {
  const s = weekStart.value.format('DD MMM')
  const e = weekStart.value.endOf('isoWeek').format('DD MMM YYYY')
  return `${s} — ${e}`
})

const isCurrentWeek = computed(() => currentWeekOffset.value >= 0)

function prevWeek() { currentWeekOffset.value-- }
function nextWeek() { if (!isCurrentWeek.value) currentWeekOffset.value++ }

const salaries = computed(() => servicesStore.computeWeeklySalaries(weekStart.value))

const activeEmployees    = computed(() => salaries.value.filter(e => e.total_services > 0).length)
const totalMinutes       = computed(() => salaries.value.reduce((a, e) => a + e.total_minutes, 0))
const totalHoursFormatted = computed(() => {
  const m = totalMinutes.value
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2,'0')}`
})
const totalPayroll = computed(() =>
  salaries.value.reduce((a, e) => a + e.weekly_salary, 0).toFixed(2)
)

function handleExport() {
  servicesStore.exportSalariesCSV(weekStart.value)
}
</script>