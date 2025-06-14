<template>
  <div class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center">
            <img src="../assets/logo.png" alt="Logo" class="h-8 w-auto" />
            <span class="ml-2 text-xl font-bold text-gray-900">Stock Pick Game</span>
          </router-link>
        </div>
        
        <div class="flex items-center space-x-4">
          <template v-if="isLoggedIn">
            <div class="relative" v-click-outside="closeDropdown">
              <button 
                @click="toggleDropdown"
                class="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <span class="text-sm font-medium">{{ username }}</span>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div 
                v-if="isDropdownOpen"
                class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
              >
                <div class="py-1">
                  <router-link 
                    to="/history" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="closeDropdown"
                  >
                    History
                  </router-link>
                  <button 
                    @click="logout" 
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <router-link 
              to="/login" 
              class="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Login
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref<{ username: string } | null>(null)
const isDropdownOpen = ref(false)

const isLoggedIn = computed(() => !!user.value)
const username = computed(() => user.value?.username || '')

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const logout = async () => {
  localStorage.removeItem('user')
  user.value = null
  router.push('/login')
}

onMounted(() => {
  const stored = localStorage.getItem('user')
  user.value = stored ? JSON.parse(stored) : null
})
</script> 