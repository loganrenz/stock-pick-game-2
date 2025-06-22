<template>
  <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo/Brand -->
        <div class="flex items-center space-x-3">
          <img src="/stonx-icon/icon/48x48/1x/1x.png" alt="STONX" class="h-8 w-8" />
          <span class="text-2xl font-extrabold tracking-tight text-white">STONX</span>
          <div class="hidden sm:block text-sm text-blue-100">
            Weekly Stock Pick Competition
          </div>
        </div>
        <div class="flex items-center space-x-6">
          <router-link to="/stats" class="text-blue-700 font-bold hover:underline text-lg">Stats</router-link>
          <template v-if="isLoggedIn">
            <button class="text-base font-bold text-rose-600 hover:text-rose-800 transition" @click="handleLogout">
              Logout
            </button>
          </template>
          <template v-else>
            <button class="text-base font-bold text-blue-700 hover:text-blue-900 transition"
              @click="$emit('open-login-modal')">
              Login
            </button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useGameStore } from '../stores/game'

const auth = useAuthStore()
const gameStore = useGameStore()

const isLoggedIn = computed(() => auth.isAuthenticated)
const username = computed(() => auth.user?.username)

async function handleLogout() {
  await auth.logout()
  // Refresh game data after logout
  await gameStore.fetchCurrentWeek()
  await gameStore.fetchWeeks()
  await gameStore.fetchScoreboard()
}
</script>

<style>
/* No scoped styles, use Tailwind only */
</style>