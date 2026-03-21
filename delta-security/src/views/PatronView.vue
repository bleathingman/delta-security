<template>
  <div class="min-h-screen logo-bg" style="background: #080808;">
    <NavBar />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">

      <!-- ── Header ──────────────────────────────────────────── -->
      <div class="fade-up flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs tracking-[0.3em] uppercase mb-2 font-body" style="color: #B8C4D0;">— Direction</p>
          <h1 class="font-display text-4xl sm:text-5xl font-light" style="color: #F5F5F0;">
            Vue <span style="color: #B8C4D0;">Patron</span>
          </h1>
        </div>
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" style="-webkit-overflow-scrolling: touch;">
          <button v-for="tab in tabs" :key="tab.id"
                  @click="activeTab = tab.id"
                  class="font-body text-xs tracking-[0.15em] uppercase px-4 py-2 rounded-sm transition-all duration-200 shrink-0"
                  :style="activeTab === tab.id
                    ? 'background: rgba(184,196,208,0.12); border: 1px solid rgba(184,196,208,0.4); color: #B8C4D0;'
                    : 'background: transparent; border: 1px solid #242424; color: #666;'">
            {{ tab.label }}
          </button>
        </div>
      </div>


      <!-- ── Stats temps réel ────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 fade-up delay-100">
        <div class="ds-card text-center">
          <p class="text-xs tracking-[0.1em] uppercase mb-1 sm:mb-2 font-body" style="color: #555;">Agents actifs</p>
          <p class="font-display text-3xl sm:text-4xl font-light" style="color: #B8C4D0;">{{ weekStats.agentsOnDuty }}</p>
        </div>
        <div class="ds-card text-center">
          <p class="text-xs tracking-[0.1em] uppercase mb-1 sm:mb-2 font-body" style="color: #555;">Services auj.</p>
          <p class="font-display text-3xl sm:text-4xl font-light" style="color: #F5F5F0;">{{ weekStats.todayServices }}</p>
        </div>
        <div class="ds-card text-center">
          <p class="text-xs tracking-[0.1em] uppercase mb-1 sm:mb-2 font-body" style="color: #555;">Heures sem.</p>
          <p class="font-display text-3xl sm:text-4xl font-light" style="color: #B8C4D0;">{{ weekStats.weekHours }}</p>
        </div>
        <div class="ds-card text-center">
          <p class="text-xs tracking-[0.1em] uppercase mb-1 sm:mb-2 font-body" style="color: #555;">Masse sal.</p>
          <p class="font-display text-3xl sm:text-4xl font-light" style="color: #B8C4D0;">{{ weekStats.weekPayroll }}$</p>
        </div>
      </div>

      <!-- ── My own service panel ────────────────────────────── -->
      <div class="fade-up delay-100 ds-card" :class="activeService ? 'gold-glow' : ''">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-px h-5" style="background: #B8C4D0;"></div>
          <h2 class="font-display text-xl font-light" style="color: #F5F5F0;">Mon service</h2>
          <div class="flex-1"></div>
          <button @click="showChangePwd = true"
                  class="text-xs font-body tracking-[0.1em] uppercase transition-colors duration-200"
                  style="color: #444;"
                  onmouseover="this.style.color='#B8C4D0'" onmouseout="this.style.color='#444'">
            Changer mon mot de passe
          </button>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-1">
            <div v-if="activeService">
              <span class="badge-active mb-2 inline-flex">En service</span>
              <p class="font-display text-2xl font-light mt-2" style="color: #F5F5F0;">{{ activeService.mission_label }}</p>
              <p class="font-display text-3xl tabular-nums mt-1" style="color: #B8C4D0;">{{ liveElapsed }}</p>
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
            <button v-else @click="showEndModal = true" :disabled="actionLoading"
                    class="font-body font-semibold tracking-widest uppercase text-sm px-6 py-3 rounded-sm transition-all duration-200"
                    style="background: transparent; border: 1px solid rgba(184,196,208,0.4); color: #B8C4D0;">
              ⏹ Fin de service
            </button>
          </div>
        </div>
      </div>

      <!-- ── Tab: Services ───────────────────────────────────── -->
      <div v-if="activeTab === 'services'" class="fade-up delay-200 space-y-6">
        <!-- Live services -->
        <div>
          <div class="flex items-center gap-4 mb-4">
            <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">
              Services actifs
              <span class="text-base ml-2 font-body" style="color: #B8C4D0;">({{ liveServices.length }})</span>
            </h2>
            <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
          </div>
          <div v-if="liveServices.length === 0" class="ds-card text-center py-8">
            <p class="font-display text-lg font-light" style="color: #444;">Aucun service en cours</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ServiceCard v-for="s in liveServices" :key="s.id" :service="s" :showAgent="true" :canDelete="true" @deleted="onServiceDeleted" />
          </div>
        </div>

        <!-- Historique -->
        <div>
          <div class="flex items-center gap-4 mb-4">
            <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Historique récent</h2>
            <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
            <button @click="loadAll" class="btn-ghost text-xs">Tout charger</button>
          </div>
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
            <div class="w-8 h-8 border-2 border-silver-dark border-t-silver rounded-full animate-spin mx-auto"></div>
          </div>
          <div v-else class="space-y-3">
            <ServiceCard v-for="s in filteredServices" :key="s.id" :service="s" :showAgent="true" :canDelete="true" @deleted="onServiceDeleted" />
            <div v-if="filteredServices.length === 0" class="ds-card text-center py-8">
              <p class="font-body text-sm" style="color: #555;">Aucun résultat</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: Salaires ───────────────────────────────────── -->
      <div v-if="activeTab === 'salaires'" class="fade-up delay-200">

        <!-- Discord recap button -->
        <div class="flex items-center justify-end mb-4">
          <div class="flex items-center gap-3">
            <transition name="slide-up">
              <span v-if="discordMsg" class="text-xs font-body px-3 py-1.5 rounded"
                    :style="discordMsg.type === 'success'
                      ? 'background: rgba(88,101,242,0.1); border: 1px solid rgba(88,101,242,0.3); color: #8b9cf4;'
                      : 'background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171;'">
                {{ discordMsg.text }}
              </span>
            </transition>
            <button @click="sendDiscordRecap" :disabled="sendingDiscord"
                    class="flex items-center gap-2 text-xs font-body tracking-[0.1em] uppercase px-4 py-2 rounded-sm transition-all duration-200"
                    style="background: rgba(88,101,242,0.1); border: 1px solid rgba(88,101,242,0.3); color: #8b9cf4;"
                    onmouseover="this.style.background='rgba(88,101,242,0.2)'"
                    onmouseout="this.style.background='rgba(88,101,242,0.1)'">
              <span v-if="sendingDiscord">...</span>
              <span v-else>
                <span class="mr-1 text-sm">🎮</span>
                Envoyer sur Discord
              </span>
            </button>
          </div>
        </div>

        <SalaryTable />
      </div>

      <!-- ── Tab: Équipe ─────────────────────────────────────── -->
      <div v-if="activeTab === 'equipe'" class="fade-up delay-200">
        <div class="flex items-center gap-4 mb-6">
          <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Équipe</h2>
          <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
          <span class="text-xs tracking-[0.15em] uppercase font-body" style="color: #555;">
            {{ activeProfiles.length }} actifs · {{ allProfiles.length }} total
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div v-for="p in allProfiles" :key="p.id" class="ds-card transition-all duration-200"
               :style="[
                 isOnDuty(p.id) ? 'border-color: rgba(184,196,208,0.35);' : '',
                 !p.is_active ? 'opacity: 0.45;' : ''
               ].join('')">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-body font-semibold" style="color: #F5F5F0;">{{ p.full_name }}</p>
                  <span v-if="!p.is_active" class="text-xs font-body px-2 py-0.5 rounded"
                        style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);">
                    Inactif
                  </span>
                </div>
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
                <p class="font-display text-lg" style="color: #B8C4D0;">{{ p.hourly_rate }}$/h</p>
              </div>
              <button @click="openRateEditor(p)" class="btn-ghost text-xs px-3 py-1">Modifier</button>
            </div>
          </div>
        </div>

        <!-- Edit rate modal -->
        <div v-if="editingProfile" class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background: rgba(0,0,0,0.85);">
          <div class="ds-card w-full max-w-sm gold-glow fade-up">
            <h3 class="font-display text-2xl font-light mb-1" style="color: #F5F5F0;">Modifier le taux</h3>
            <p class="text-sm font-body mb-5" style="color: #888;">{{ editingProfile.full_name }}</p>
            <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #555;">
              Nouveau taux ($/h)
            </label>
            <input v-model.number="newRate" type="number" step="0.5" min="0" class="ds-input mb-5" />
            <div class="flex gap-3">
              <button @click="saveRate" class="btn-gold flex-1" :disabled="savingRate">
                {{ savingRate ? '...' : 'Enregistrer' }}
              </button>
              <button @click="editingProfile = null" class="btn-ghost flex-1">Annuler</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: Avertissements ────────────────────────────── -->
      <div v-if="activeTab === 'avertissements'" class="fade-up delay-200">
        <WarningsManager />
      </div>

      <!-- ── Tab: Grades ─────────────────────────────────────── -->
      <div v-if="activeTab === 'grades'" class="fade-up delay-200">
        <GradesManager />
      </div>

      <!-- ── Tab: Comptes ────────────────────────────────────── -->
      <div v-if="activeTab === 'comptes'" class="fade-up delay-200">

        <div class="flex items-center gap-4 mb-6">
          <h2 class="font-display text-2xl font-light" style="color: #F5F5F0;">Créer un compte</h2>
          <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
        </div>

        <!-- Feedback -->
        <div v-if="createMsg" class="mb-6 p-4 rounded fade-up"
             :style="createMsg.type === 'success'
               ? 'background: rgba(184,196,208,0.08); border: 1px solid rgba(184,196,208,0.25); color: #B8C4D0;'
               : 'background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171;'">
          <p class="font-body text-sm">{{ createMsg.text }}</p>
        </div>

        <div class="ds-card w-full max-w-lg">
          <p class="text-xs tracking-[0.15em] uppercase mb-6 font-body" style="color: #555;">
            — Informations du nouveau membre
          </p>
          <div class="space-y-4">
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">
                Nom complet *
              </label>
              <input v-model="newUser.full_name" type="text" placeholder="Jean Dupont" class="ds-input" />
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">
                Identifiant * <span style="color: #555; font-size: 0.7rem;">(pour la connexion)</span>
              </label>
              <input v-model="newUser.username" type="text" placeholder="jean.dupont" class="ds-input" />
              <p class="text-xs mt-1 font-body" style="color: #444;">
                Se connectera avec : <span style="color: #B8C4D0;">{{ newUser.username || '…' }}</span>
              </p>
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">
                Mot de passe *
              </label>
              <div class="relative">
                <input v-model="newUser.password" :type="showNewPwd ? 'text' : 'password'"
                       placeholder="Minimum 6 caractères" class="ds-input pr-16" />
                <button type="button" @click="showNewPwd = !showNewPwd"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-body" style="color: #555;">
                  {{ showNewPwd ? 'Cacher' : 'Voir' }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Rôle *</label>
              <select v-model="newUser.role" class="ds-input">
                <option value="agent">Agent</option>
                <option value="patron">Patron</option>
              </select>
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Numéro de badge</label>
              <input v-model="newUser.badge_number" type="text" placeholder="ex: DS-042" class="ds-input" />
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Numéro de téléphone</label>
              <input v-model="newUser.phone_number" type="text" placeholder="ex: 5551 ou 4381234567" class="ds-input" />
            </div>
            <div>
              <label class="block text-xs tracking-[0.12em] uppercase mb-2 font-body" style="color: #888;">Grade</label>
              <select v-model="newUser.grade_id" class="ds-input">
                <option value="">— Sélectionner un grade —</option>
                <option v-for="g in agentGrades" :key="g.id" :value="g.id">
                  {{ g.label }} ({{ g.hourly_rate }}$/h)
                </option>
              </select>
            </div>

            <div class="pt-4">
              <button @click="handleCreateUser" class="btn-gold w-full" :disabled="creatingUser">
                <span v-if="creatingUser" class="inline-flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Création en cours...
                </span>
                <span v-else>Créer le compte</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Existing accounts list with actions -->
        <div class="mt-10">
          <div class="flex items-center gap-4 mb-4">
            <h3 class="font-display text-xl font-light" style="color: #F5F5F0;">Comptes existants</h3>
            <div class="flex-1 h-px" style="background: #1a1a1a;"></div>
            <span class="text-xs tracking-[0.12em] uppercase font-body" style="color: #555;">
              {{ allProfiles.length }} comptes
            </span>
          </div>

          <div class="space-y-3">
            <div v-for="p in allProfiles" :key="p.id"
                 class="ds-card transition-all duration-200"
                 :style="!p.is_active ? 'opacity: 0.5;' : ''">
              <div class="flex items-center justify-between flex-wrap gap-3">
                <!-- Info -->
                <div class="flex items-center gap-4">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                       :style="p.role === 'patron'
                         ? 'background: rgba(184,196,208,0.15); color: #B8C4D0;'
                         : 'background: rgba(255,255,255,0.05); color: #888;'">
                    {{ p.full_name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" style="-webkit-overflow-scrolling: touch;">
                      <p class="font-body text-sm font-medium" style="color: #F5F5F0;">{{ p.full_name }}</p>
                      <span v-if="!p.is_active" class="text-xs font-body px-2 py-0.5 rounded"
                            style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);">
                        Désactivé
                      </span>
                      <span v-if="p.id === profile?.id" class="text-xs font-body px-2 py-0.5 rounded"
                            style="background: rgba(184,196,208,0.08); color: #B8C4D0; border: 1px solid rgba(184,196,208,0.2);">
                        Vous
                      </span>
                    </div>
                    <p class="font-body text-xs mt-0.5" style="color: #555;">
                      {{ p.role === 'patron' ? '⬡ Patron' : '◈ Agent' }}
                      <span v-if="p.badge_number"> · #{{ p.badge_number }}</span>
                      <span style="color: #444;"> · {{ p.hourly_rate }}$/h</span>
                    </p>
                  </div>
                </div>

                <!-- Actions — hidden for own account -->
                <div v-if="p.id !== profile?.id" class="flex items-center gap-2 flex-wrap">
                  <!-- Reset password -->
                  <button @click="openResetPwd(p)"
                          class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                          style="background: transparent; border: 1px solid #242424; color: #666;"
                          onmouseover="this.style.borderColor='rgba(184,196,208,0.4)'; this.style.color='#B8C4D0'"
                          onmouseout="this.style.borderColor='#242424'; this.style.color='#666'">
                    🔑 Réinitialiser MDP
                  </button>

                  <!-- Toggle active -->
                  <button @click="confirmToggle(p)"
                          class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                          :style="p.is_active
                            ? 'background: transparent; border: 1px solid #242424; color: #666;'
                            : 'background: rgba(184,196,208,0.08); border: 1px solid rgba(184,196,208,0.3); color: #B8C4D0;'">
                    {{ p.is_active ? '⏸ Désactiver' : '▶ Réactiver' }}
                  </button>

                  <!-- Delete -->
                  <button @click="confirmDelete(p)"
                          class="text-xs font-body tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm transition-all duration-200"
                          style="background: transparent; border: 1px solid rgba(239,68,68,0.2); color: #ef4444;"
                          onmouseover="this.style.background='rgba(239,68,68,0.08)'"
                          onmouseout="this.style.background='transparent'">
                    ✕ Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── End service comment modal ─────────────────────── -->
    <div v-if="showEndModal" class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background: rgba(0,0,0,0.88);">
      <div class="ds-card w-full max-w-sm fade-up" style="border-color: rgba(184,196,208,0.2);">
        <h3 class="font-display text-2xl font-light mb-1" style="color: #F5F5F0;">Fin de service</h3>
        <p class="text-sm font-body mb-5" style="color: #666;">Ajouter un commentaire (optionnel)</p>
        <textarea v-model="endComment" class="ds-input resize-none mb-4" rows="3"
                  placeholder="Rapport de mission, notes particulières..." />
        <div class="flex gap-3">
          <button @click="handleEndService" :disabled="actionLoading"
                  class="flex-1 font-body font-semibold tracking-widest uppercase text-xs py-3 rounded-sm transition-all duration-200"
                  style="background: transparent; border: 1px solid rgba(184,196,208,0.4); color: #B8C4D0;">
            <span v-if="actionLoading">...</span>
            <span v-else>⏹ Confirmer la fin</span>
          </button>
          <button @click="showEndModal = false" class="btn-ghost flex-1">Annuler</button>
        </div>
      </div>
    </div>

    <!-- ── Change own password modal ──────────────────────── -->
    <ChangePasswordModal v-if="showChangePwd"
      :profileName="profile?.full_name"
      @close="showChangePwd = false"
      @saved="showChangePwd = false"
    />

    <!-- ── Reset agent password modal ─────────────────────── -->
    <ChangePasswordModal v-if="resetPwdTarget"
      :targetId="resetPwdTarget.id"
      :profileName="resetPwdTarget.full_name"
      @close="resetPwdTarget = null"
      @saved="resetPwdTarget = null"
    />

    <!-- ── Confirm toggle active ───────────────────────────── -->
    <ConfirmModal v-if="toggleTarget"
      :title="toggleTarget.is_active ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'"
      :message="toggleTarget.is_active
        ? `${toggleTarget.full_name} ne pourra plus se connecter et sera déconnecté immédiatement.`
        : `${toggleTarget.full_name} pourra à nouveau se connecter.`"
      :confirmLabel="toggleTarget.is_active ? 'Désactiver' : 'Réactiver'"
      :loading="actionLoading"
      @confirm="executeToggle"
      @cancel="toggleTarget = null"
    />

    <!-- ── Confirm delete ──────────────────────────────────── -->
    <ConfirmModal v-if="deleteTarget"
      :title="`Supprimer ${deleteTarget.full_name} ?`"
      message="Cette action est irréversible. Tous ses services seront également supprimés."
      confirmLabel="Supprimer définitivement"
      :loading="actionLoading"
      @confirm="executeDelete"
      @cancel="deleteTarget = null"
    />

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
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import GradesManager from '@/components/GradesManager.vue'
import WarningsManager from '@/components/WarningsManager.vue'
import { useAuthStore } from '@/stores/auth'
import { useServicesStore } from '@/stores/services'
import { supabase } from '@/lib/supabase'
import { callEdgeFunction } from '@/lib/edgeFunction'

const authStore = useAuthStore()
const servicesStore = useServicesStore()
const { profile } = storeToRefs(authStore)
const { allServices, allProfiles, activeService } = storeToRefs(servicesStore)

const tabs = [
  { id: 'services', label: 'Services' },
  { id: 'salaires', label: 'Salaires' },
  { id: 'equipe', label: 'Équipe' },
  { id: 'avertissements', label: 'Avertissements' },
  { id: 'grades', label: 'Grades' },
  { id: 'comptes', label: 'Comptes' }
]
const activeTab = ref('services')

// ── My service ─────────────────────────────────────────────
const missionLabel = ref('')
const actionLoading = ref(false)
const liveElapsed = ref('00:00:00')
let elapsedTimer = null

// ── Services filters ───────────────────────────────────────
const searchQuery = ref('')
const filterStatus = ref('')

// ── Edit rate ──────────────────────────────────────────────
const editingProfile = ref(null)
const newRate = ref(0)
const savingRate = ref(false)

// ── Discord recap ──────────────────────────────────────
const sendingDiscord = ref(false)
const discordMsg     = ref(null)
let discordTimer     = null

async function sendDiscordRecap() {
  sendingDiscord.value = true
  discordMsg.value = null
  try {
    const { data, error } = await supabase.functions.invoke('weekly-recap', { body: {} })
    if (error) throw new Error(error.message || 'Erreur envoi Discord')
    discordMsg.value = { type: 'success', text: `✓ Envoyé · ${data.employees_paid} employé(s)` }
  } catch (e) {
    discordMsg.value = { type: 'error', text: e.message }
  } finally {
    sendingDiscord.value = false
    clearTimeout(discordTimer)
    discordTimer = setTimeout(() => { discordMsg.value = null }, 5000)
  }
}

// ── Create user ────────────────────────────────────────────
const newUser = ref({ full_name: '', username: '', password: '', role: 'agent', hourly_rate: 15, badge_number: '', grade_id: '', phone_number: '' })
const creatingUser = ref(false)
const createMsg = ref(null)
const showNewPwd = ref(false)

// ── Password modals ────────────────────────────────────────
const showChangePwd = ref(false)
const resetPwdTarget = ref(null)

// ── Confirm modals ─────────────────────────────────────────
const toggleTarget = ref(null)
const deleteTarget = ref(null)

// ── Stats patron ──────────────────────────────────────
const weekStats = computed(() => servicesStore.getWeekStats())

// ── Grades ────────────────────────────────────────────
const agentGrades = computed(() => servicesStore.allGrades)

// ── Computed ───────────────────────────────────────────────
const liveServices = computed(() => allServices.value.filter(s => s.is_active))
const activeProfiles = computed(() => allProfiles.value.filter(p => p.is_active !== false))

const filteredServices = computed(() => {
  let list = allServices.value
  if (filterStatus.value === 'active') list = list.filter(s => s.is_active)
  if (filterStatus.value === 'ended') list = list.filter(s => !s.is_active)
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

// ── Elapsed timer ──────────────────────────────────────────
function tickElapsed() {
  if (!activeService.value) return
  const diff = dayjs().diff(dayjs(activeService.value.start_time), 'second')
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  liveElapsed.value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function startElapsedTimer() {
  clearInterval(elapsedTimer)
  tickElapsed()
  elapsedTimer = setInterval(tickElapsed, 1000)
}

// ── Service actions ────────────────────────────────────────
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
    await servicesStore.endService(activeService.value.id, endComment.value)
    clearInterval(elapsedTimer)
    showEndModal.value = false
    endComment.value = ''
    await servicesStore.fetchAllServices()
  } catch (e) { console.error(e) }
  finally { actionLoading.value = false }
}

async function loadAll() { await servicesStore.fetchAllServices() }

function onServiceDeleted(serviceId) {
  const idx = servicesStore.allServices.findIndex(s => s.id === serviceId)
  if (idx !== -1) servicesStore.allServices.splice(idx, 1)
}

// ── Edit hourly rate ───────────────────────────────────────
function openRateEditor(p) { editingProfile.value = p; newRate.value = p.hourly_rate }

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


// ── Create user ────────────────────────────────────────────
async function handleCreateUser() {
  const { full_name, username, password, role, hourly_rate, badge_number } = newUser.value
  if (!full_name || !username || !password) {
    createMsg.value = { type: 'error', text: 'Nom complet, identifiant et mot de passe sont obligatoires.' }
    return
  }
  if (password.length < 6) {
    createMsg.value = { type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' }
    return
  }
  creatingUser.value = true
  createMsg.value = null
  try {
    // Auto-fill hourly_rate from grade if selected
    let finalRate = hourly_rate || 15
    if (newUser.value.grade_id) {
      const grade = servicesStore.allGrades.find(g => g.id === newUser.value.grade_id)
      if (grade) finalRate = grade.hourly_rate
    }
    await callEdgeFunction('create-user', { full_name, username, password, role, hourly_rate: finalRate, badge_number, grade_id: newUser.value.grade_id || null, phone_number: newUser.value.phone_number || null })
    createMsg.value = { type: 'success', text: `Compte "${username}" créé avec succès pour ${full_name}.` }
    newUser.value = { full_name: '', username: '', password: '', role: 'agent', hourly_rate: 15, badge_number: '', grade_id: '', phone_number: '' }
    await servicesStore.fetchAllProfiles()
    setTimeout(() => { createMsg.value = null }, 5000)
  } catch (e) {
    createMsg.value = { type: 'error', text: e.message }
  } finally {
    creatingUser.value = false
  }
}

// ── Reset password ─────────────────────────────────────────
function openResetPwd(p) { resetPwdTarget.value = p }

// ── Toggle active ──────────────────────────────────────────
function confirmToggle(p) { toggleTarget.value = p }

async function executeToggle() {
  if (!toggleTarget.value) return
  actionLoading.value = true
  try {
    await callEdgeFunction('manage-user', {
      action: 'set_active',
      target_id: toggleTarget.value.id,
      is_active: !toggleTarget.value.is_active
    })
    const idx = allProfiles.value.findIndex(p => p.id === toggleTarget.value.id)
    if (idx !== -1) allProfiles.value[idx].is_active = !toggleTarget.value.is_active
  } catch (e) { console.error(e) }
  finally { actionLoading.value = false; toggleTarget.value = null }
}

// ── Delete user ────────────────────────────────────────────
function confirmDelete(p) { deleteTarget.value = p }

async function executeDelete() {
  if (!deleteTarget.value) return
  actionLoading.value = true
  try {
    await callEdgeFunction('manage-user', {
      action: 'delete_user',
      target_id: deleteTarget.value.id
    })
    const idx = allProfiles.value.findIndex(p => p.id === deleteTarget.value.id)
    if (idx !== -1) allProfiles.value.splice(idx, 1)
  } catch (e) { console.error(e) }
  finally { actionLoading.value = false; deleteTarget.value = null }
}

// ── Lifecycle ──────────────────────────────────────────────
onMounted(async () => {
  if (profile.value) {
    await servicesStore.fetchActiveService(profile.value.id)
    await servicesStore.fetchAllServices()
    await servicesStore.fetchAllProfiles()
    await servicesStore.fetchGrades()
    await servicesStore.fetchWarnings()
    if (activeService.value) startElapsedTimer()
  }
  supabase
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