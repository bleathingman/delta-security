<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
       style="background: rgba(0,0,0,0.88);"
       @click.self="$emit('cancel')">
    <div class="ds-card w-full max-w-sm fade-up"
         style="border-color: rgba(239,68,68,0.3);">

      <div class="mb-5">
        <p class="text-xs tracking-[0.2em] uppercase mb-2 font-body" style="color: #ef4444;">
          — Confirmation requise
        </p>
        <h3 class="font-display text-2xl font-light mb-2" style="color: #F5F5F0;">{{ title }}</h3>
        <p class="text-sm font-body" style="color: #888;">{{ message }}</p>
      </div>

      <div class="flex gap-3">
        <button @click="$emit('confirm')" :disabled="loading"
                class="flex-1 font-body font-semibold tracking-widest uppercase text-xs py-3 rounded-sm transition-all duration-200"
                style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.4); color: #ef4444;">
          <span v-if="loading">...</span>
          <span v-else>{{ confirmLabel || 'Confirmer' }}</span>
        </button>
        <button @click="$emit('cancel')" class="btn-ghost flex-1">Annuler</button>
      </div>

    </div>
  </div>
</template>

<script setup>
defineProps({
  title:        { type: String, required: true },
  message:      { type: String, required: true },
  confirmLabel: { type: String, default: 'Confirmer' },
  loading:      { type: Boolean, default: false }
})
defineEmits(['confirm', 'cancel'])
</script>
