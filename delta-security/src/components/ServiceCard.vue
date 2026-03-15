<template>
  <div class="ds-card transition-all duration-200 hover:border-opacity-60"
       :style="service.is_active ? 'border-color: rgba(212,175,55,0.35);' : ''">
    <div class="flex items-start justify-between gap-4">

      <!-- Left info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-2 flex-wrap">
          <span v-if="service.is_active" class="badge-active">En service</span>
          <span v-else class="badge-ended">Terminé</span>
          <span v-if="showAgent && service.profiles" class="text-xs font-body tracking-wide" style="color: #D4AF37;">
            {{ service.profiles.full_name }}
            <span v-if="service.profiles.badge_number" style="color: #666;"> · #{{ service.profiles.badge_number }}</span>
          </span>
        </div>

        <p class="font-body text-sm mb-3 truncate" style="color: #888;">
          {{ service.mission_label || 'Mission standard' }}
        </p>

        <div class="flex items-center gap-5 flex-wrap">
          <div>
            <p class="text-xs tracking-[0.12em] uppercase mb-0.5 font-body" style="color: #555;">Début</p>
            <p class="text-sm font-body tabular-nums" style="color: #F5F5F0;">
              {{ formatTime(service.start_time) }}
            </p>
          </div>
          <div v-if="service.end_time">
            <p class="text-xs tracking-[0.12em] uppercase mb-0.5 font-body" style="color: #555;">Fin</p>
            <p class="text-sm font-body tabular-nums" style="color: #F5F5F0;">
              {{ formatTime(service.end_time) }}
            </p>
          </div>
          <div v-if="service.duration_minutes">
            <p class="text-xs tracking-[0.12em] uppercase mb-0.5 font-body" style="color: #555;">Durée</p>
            <p class="text-sm font-body tabular-nums" style="color: #D4AF37;">
              {{ formatDuration(service.duration_minutes) }}
            </p>
          </div>
          <div v-if="service.is_active">
            <p class="text-xs tracking-[0.12em] uppercase mb-0.5 font-body" style="color: #555;">Écoulé</p>
            <p class="text-sm font-body tabular-nums" style="color: #D4AF37;">
              {{ elapsed }}
            </p>
          </div>
        </div>
      </div>

      <!-- Date column -->
      <div class="text-right shrink-0">
        <p class="text-xs font-body tabular-nums" style="color: #555;">
          {{ formatDate(service.start_time) }}
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
dayjs.locale('fr')

const props = defineProps({
  service: { type: Object, required: true },
  showAgent: { type: Boolean, default: false }
})

const elapsed = ref('')
let timer = null

function formatTime(iso) {
  return dayjs(iso).format('HH:mm:ss')
}

function formatDate(iso) {
  return dayjs(iso).format('DD MMM YYYY')
}

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

onMounted(() => {
  if (props.service.is_active) {
    computeElapsed()
    timer = setInterval(computeElapsed, 1000)
  }
})
onUnmounted(() => clearInterval(timer))
</script>
