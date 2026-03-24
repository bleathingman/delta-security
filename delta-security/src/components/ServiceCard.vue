<template>
  <div class="ds-card transition-all duration-200"
       :style="service.is_active ? 'border-color: rgba(184,196,208,0.35);' : ''">
    <div class="flex items-start justify-between gap-4">

      <!-- Left info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-2 flex-wrap">
          <span v-if="service.is_active" class="badge-active">En service</span>
          <span v-else class="badge-ended">Terminé</span>
          <span v-if="showAgent && service.profiles" class="text-xs font-body tracking-wide" style="color: #B8C4D0;">
            {{ service.profiles.full_name }}
            <span v-if="service.profiles.badge_number" style="color: #666;"> · #{{ service.profiles.badge_number }}</span>
          </span>
        </div>

        <p class="font-body text-sm mb-3 truncate" style="color: #888;">
          {{ service.mission_label || 'Mission standard' }}
        </p>

        <!-- Normal view -->
        <div v-if="!editing" class="flex items-center gap-5 flex-wrap">
          <div>
            <p class="text-xs tracking-[0.12em] uppercase mb-0.5 font-body" style="color: #555;">Début</p>
            <p class="text-sm font-body tabular-nums" style="color: #F5F5F0;">{{ formatTime(service.start_time) }}</p>
          </div>
          <div v-if="service.end_time">
            <p class="text-xs tracking-[0.12em] uppercase mb-0.5 font-body" style="color: #555;">Fin</p>
            <p class="text-sm font-body tabular-nums" style="color: #F5F5F0;">{{ formatTime(service.end_time) }}</p>
          </div>
          <div v-if="service.duration_minutes">
            <p class="text-xs tracking-[0.12em] uppercase mb-0.5 font-body" style="color: #555;">Durée</p>
            <p class="text-sm font-body tabular-nums" style="color: #B8C4D0;">{{ formatDuration(service.duration_minutes) }}</p>
          </div>
          <div v-if="service.is_active">
            <p class="text-xs tracking-[0.12em] uppercase mb-0.5 font-body" style="color: #555;">Écoulé</p>
            <p class="text-sm font-body tabular-nums" style="color: #B8C4D0;">{{ elapsed }}</p>
          </div>
        </div>

        <!-- Edit view -->
        <div v-else class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs tracking-[0.1em] uppercase mb-1 font-body" style="color: #555;">Début</label>
              <input v-model="editStart" type="datetime-local" class="ds-input text-xs" />
            </div>
            <div>
              <label class="block text-xs tracking-[0.1em] uppercase mb-1 font-body" style="color: #555;">Fin</label>
              <input v-model="editEnd" type="datetime-local" class="ds-input text-xs" />
            </div>
          </div>
          <div>
            <label class="block text-xs tracking-[0.1em] uppercase mb-1 font-body" style="color: #555;">Label de mission</label>
            <input v-model="editLabel" type="text" class="ds-input text-sm" />
          </div>
          <div class="flex gap-2">
            <button @click="handleSave" :disabled="saving"
                    class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                    style="background: rgba(184,196,208,0.12); border: 1px solid rgba(184,196,208,0.4); color: #B8C4D0;">
              {{ saving ? '...' : '✓ Sauvegarder' }}
            </button>
            <button @click="cancelEdit" class="btn-ghost text-xs px-3 py-1.5">Annuler</button>
          </div>
          <p v-if="editError" class="text-xs font-body" style="color: #ef4444;">{{ editError }}</p>
        </div>

        <!-- End comment -->
        <div v-if="service.end_comment && !editing" class="mt-3 pt-3" style="border-top: 1px solid #1a1a1a;">
          <p class="text-xs tracking-[0.1em] uppercase mb-1 font-body" style="color: #555;">Rapport de mission</p>
          <p class="text-sm font-body italic" style="color: #888;">{{ service.end_comment }}</p>
        </div>
      </div>

      <!-- Right column -->
      <div class="text-right shrink-0 flex flex-col items-end gap-2">
        <p class="text-xs font-body tabular-nums" style="color: #555;">
          {{ formatDate(service.start_time) }}
        </p>

        <!-- Edit button — patron only, terminated services -->
        <button v-if="canDelete && !service.is_active && !editing"
                @click="startEdit"
                class="text-xs font-body tracking-[0.08em] uppercase px-2 py-1 rounded-sm transition-all duration-200"
                style="background: transparent; border: 1px solid #242424; color: #666;"
                onmouseover="this.style.borderColor='rgba(184,196,208,0.4)'; this.style.color='#B8C4D0'"
                onmouseout="this.style.borderColor='#242424'; this.style.color='#666'">
          ✏️ Modifier
        </button>

        <!-- Delete button — patron only -->
        <button v-if="canDelete && !editing"
                @click="confirmDelete = true"
                class="text-xs font-body tracking-[0.08em] uppercase px-2 py-1 rounded-sm transition-all duration-200"
                style="background: transparent; border: 1px solid rgba(239,68,68,0.2); color: #ef444460;"
                onmouseover="this.style.background='rgba(239,68,68,0.08)'; this.style.color='#ef4444'"
                onmouseout="this.style.background='transparent'; this.style.color='#ef444460'">
          ✕ Supprimer
        </button>
      </div>

    </div>

    <!-- Confirm delete -->
    <div v-if="confirmDelete" class="mt-4 pt-4 flex items-center justify-between flex-wrap gap-3"
         style="border-top: 1px solid rgba(239,68,68,0.2);">
      <p class="text-xs font-body" style="color: #ef4444;">Supprimer cette prise de service ? Action irréversible.</p>
      <div class="flex gap-2">
        <button @click="handleDelete" :disabled="deleting"
                class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm"
                style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.4); color: #ef4444;">
          {{ deleting ? '...' : 'Confirmer' }}
        </button>
        <button @click="confirmDelete = false" class="btn-ghost text-xs px-3 py-1.5">Annuler</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { supabase } from '@/lib/supabase'
dayjs.locale('fr')

const props = defineProps({
  service:   { type: Object,  required: true },
  showAgent: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false }
})

const emit = defineEmits(['deleted', 'updated'])

const elapsed       = ref('')
const confirmDelete = ref(false)
const deleting      = ref(false)
const editing       = ref(false)
const saving        = ref(false)
const editError     = ref('')
const editStart     = ref('')
const editEnd       = ref('')
const editLabel     = ref('')
let timer = null

function toLocalDatetime(iso) {
  if (!iso) return ''
  return dayjs(iso).format('YYYY-MM-DDTHH:mm')
}

function formatTime(iso) { return dayjs(iso).format('HH:mm:ss') }
function formatDate(iso) { return dayjs(iso).format('DD MMM YYYY') }

function formatDuration(minutes) {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  return `${h}h${m.toString().padStart(2, '0')}`
}

function computeElapsed() {
  const diff = dayjs().diff(dayjs(props.service.start_time), 'second')
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  elapsed.value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function startEdit() {
  editStart.value = toLocalDatetime(props.service.start_time)
  editEnd.value   = toLocalDatetime(props.service.end_time)
  editLabel.value = props.service.mission_label || ''
  editError.value = ''
  editing.value   = true
}

function cancelEdit() {
  editing.value   = false
  editError.value = ''
}

async function handleSave() {
  editError.value = ''
  if (!editStart.value) { editError.value = 'Heure de début requise.'; return }
  if (editEnd.value && dayjs(editEnd.value).isBefore(dayjs(editStart.value))) {
    editError.value = 'La fin ne peut pas être avant le début.'; return
  }

  saving.value = true
  const updates = {
    start_time:    new Date(editStart.value).toISOString(),
    end_time:      editEnd.value ? new Date(editEnd.value).toISOString() : null,
    mission_label: editLabel.value || 'Mission standard'
  }

  const { data, error } = await supabase
    .from('services').update(updates).eq('id', props.service.id).select().single()

  saving.value = false
  if (error) { editError.value = error.message; return }

  emit('updated', data)
  editing.value = false
}

async function handleDelete() {
  deleting.value = true
  const { error } = await supabase.from('services').delete().eq('id', props.service.id)
  deleting.value = false
  if (!error) emit('deleted', props.service.id)
}

onMounted(() => {
  if (props.service.is_active) {
    computeElapsed()
    timer = setInterval(computeElapsed, 1000)
  }
})
onUnmounted(() => clearInterval(timer))
</script>