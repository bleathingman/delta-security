<template>
  <div class="noise-overlay">
    <RouterView v-if="!authStore.loading" />
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-10 h-10 border-2 border-gold-dark border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-obsidian-border text-sm tracking-widest uppercase font-body">Chargement...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>
