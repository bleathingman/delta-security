<template>
  <nav class="sticky top-0 z-50" style="background: rgba(8,8,8,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a1a;">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">

      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div class="w-px h-5 opacity-40" style="background: #B8C4D0;"></div>
        <span class="font-display text-lg sm:text-xl font-light tracking-wide" style="color: #F5F5F0;">
          Delta <span style="color: #B8C4D0;">Security</span>
        </span>
      </div>

      <!-- Center — role badge (hidden on xs) -->
      <div class="hidden sm:flex items-center gap-2">
        <span class="text-xs tracking-[0.2em] uppercase font-body px-3 py-1 rounded"
              :style="isPatron
                ? 'background: rgba(184,196,208,0.1); border: 1px solid rgba(184,196,208,0.3); color: #B8C4D0;'
                : 'background: rgba(255,255,255,0.04); border: 1px solid #242424; color: #888;'">
          {{ isPatron ? '⬡ Patron' : '◈ Agent' }}
        </span>
        <span v-if="profile" class="text-sm font-body" style="color: #666;">
          {{ profile.full_name }}
        </span>
      </div>

      <!-- Right -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Name on mobile -->
        <span class="sm:hidden text-xs font-body truncate max-w-[100px]" style="color: #666;">
          {{ profile?.full_name?.split(' ')[0] }}
        </span>
        <span class="hidden sm:block text-xs font-body tabular-nums" style="color: #555;">
          {{ currentTime }}
        </span>
        <button @click="handleLogout"
                class="text-xs font-body tracking-[0.1em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                style="background: transparent; border: 1px solid #242424; color: #666;"
                onmouseover="this.style.borderColor='rgba(184,196,208,0.4)'; this.style.color='#B8C4D0'"
                onmouseout="this.style.borderColor='#242424'; this.style.color='#666'">
          Quitter
        </button>
      </div>

    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const router    = useRouter()
const authStore = useAuthStore()
const { profile, isPatron } = storeToRefs(authStore)

const currentTime = ref('')
let timer = null

function tick() {
  currentTime.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(() => { tick(); timer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(timer))

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
