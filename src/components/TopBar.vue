<template>
  <div class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center">
            <img src="/icons/icon-32x32.png" alt="Logo" class="h-8 w-auto" />
            <span class="ml-2 text-xl font-bold text-gray-900">Stock Pick Game</span>
          </router-link>
        </div>
        <div class="flex items-center space-x-4">
          <template v-if="isLoggedIn">
            <span class="text-sm font-medium text-blue-700">Logged in as: {{ username }}</span>
            <button class="text-sm font-medium text-red-600 hover:text-red-900" @click="handleLogout">
              Logout
            </button>
          </template>
          <template v-else>
            <button
              class="text-sm font-medium text-indigo-600 hover:text-indigo-900"
              @click="$emit('open-login-modal')"
            >
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