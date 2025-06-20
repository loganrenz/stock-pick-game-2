<template>
  <div class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <router-link to="/"
          class="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-transform duration-150 ease-in-out hover:translate-x-1 hover:scale-105 active:scale-100">
          <img src="/icons/icon.svg" alt="Logo" class="h-9 w-9" />
          <span class="text-2xl font-extrabold tracking-tight text-blue-900">Stock Pick Game</span>
        </router-link>
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
  </div>
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