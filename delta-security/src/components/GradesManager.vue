<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Grades & Taux</h2>
      <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
      <span class="text-xs tracking-[0.15em] uppercase font-body" style="color: #555;">
        {{ grades.length }} grades
      </span>
    </div>

    <!-- Info box -->
    <div class="mb-6 p-4 rounded" style="background: rgba(184,196,208,0.04); border: 1px solid rgba(184,196,208,0.12);">
      <p class="text-xs font-body" style="color: #666;">
        <span style="color: #B8C4D0;">Info :</span>
        Modifier le taux d'un grade met à jour automatiquement le salaire de tous les agents ayant ce grade.
        Vous pouvez aussi assigner un grade individuellement depuis l'onglet <strong style="color: #B8C4D0;">Comptes</strong>.
      </p>
    </div>

    <!-- Grades table -->
    <div class="ds-card p-0 overflow-hidden mb-8">
      <table class="w-full">
        <thead>
          <tr style="border-bottom: 1px solid #1a1a1a;">
            <th class="text-left px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Grade</th>
            <th class="text-left px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Identifiant</th>
            <th class="text-center px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Agents</th>
            <th class="text-right px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #B8C4D0;">Taux horaire ($/h)</th>
            <th class="text-right px-5 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium" style="color: #555;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(grade, i) in grades" :key="grade.id"
              :style="i % 2 === 0 ? 'background: rgba(255,255,255,0.01);' : ''"
              class="transition-colors duration-150">
            <td class="px-5 py-4">
              <p class="font-body font-medium" style="color: #F5F5F0;">{{ grade.label }}</p>
            </td>
            <td class="px-5 py-4">
              <span class="text-xs font-body px-2 py-1 rounded"
                    style="background: rgba(255,255,255,0.04); border: 1px solid #242424; color: #666;">
                {{ grade.slug }}
              </span>
            </td>
            <td class="px-5 py-4 text-center">
              <span class="font-body text-sm tabular-nums" style="color: #888;">
                {{ agentCountByGrade(grade.id) }}
              </span>
            </td>
            <td class="px-5 py-4 text-right">
              <!-- Inline edit -->
              <div v-if="editingGrade?.id === grade.id" class="flex items-center justify-end gap-2">
                <input v-model.number="editingRate" type="number" step="0.5" min="0"
                       class="ds-input text-right tabular-nums"
                       style="width: 100px; padding: 0.4rem 0.6rem; font-size: 0.875rem;"
                       @keyup.enter="saveGradeRate"
                       @keyup.escape="editingGrade = null" />
                <span class="text-sm font-body" style="color: #666;">$</span>
              </div>
              <span v-else class="font-display text-lg" style="color: #B8C4D0;">
                {{ grade.hourly_rate }}$
              </span>
            </td>
            <td class="px-5 py-4 text-right">
              <div v-if="editingGrade?.id === grade.id" class="flex items-center justify-end gap-2">
                <button @click="saveGradeRate" :disabled="saving"
                        class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                        style="background: rgba(184,196,208,0.12); border: 1px solid rgba(184,196,208,0.4); color: #B8C4D0;">
                  {{ saving ? '...' : '✓ Sauver' }}
                </button>
                <button @click="editingGrade = null" class="btn-ghost text-xs px-3 py-1.5">✕</button>
              </div>
              <button v-else @click="startEdit(grade)"
                      class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                      style="background: transparent; border: 1px solid #242424; color: #666;"
                      onmouseover="this.style.borderColor='rgba(184,196,208,0.4)'; this.style.color='#B8C4D0'"
                      onmouseout="this.style.borderColor='#242424'; this.style.color='#666'">
                Modifier
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Formula reminder -->
    <div class="p-4 rounded" style="background: rgba(184,196,208,0.04); border: 1px solid rgba(184,196,208,0.12);">
      <p class="text-xs font-body mb-2" style="color: #555;">
        <span style="color: #B8C4D0;">Formule de calcul</span>
        <span class="ml-3">Salaire = ⌊ Minutes ÷ 10 ⌋ × (Taux horaire ÷ 6)</span>
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
        <div v-for="grade in grades.filter(g => g.hourly_rate > 0)" :key="grade.id"
             class="text-xs font-body p-2 rounded" style="background: rgba(255,255,255,0.02); border: 1px solid #1a1a1a;">
          <span style="color: #888;">{{ grade.label }} :</span>
          <span class="ml-1 tabular-nums" style="color: #B8C4D0;">
            {{ (grade.hourly_rate / 6).toFixed(2) }}$ / tranche
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useServicesStore } from '@/stores/services'

const servicesStore = useServicesStore()
const { allGrades, allProfiles } = storeToRefs(servicesStore)

const grades      = computed(() => allGrades.value)
const editingGrade = ref(null)
const editingRate  = ref(0)
const saving       = ref(false)

function agentCountByGrade(gradeId) {
  return allProfiles.value.filter(p => p.grade_id === gradeId).length
}

function startEdit(grade) {
  editingGrade.value = grade
  editingRate.value  = grade.hourly_rate
}

async function saveGradeRate() {
  if (!editingGrade.value) return
  saving.value = true
  try {
    await servicesStore.updateGradeRate(editingGrade.value.id, editingRate.value)
    editingGrade.value = null
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>
