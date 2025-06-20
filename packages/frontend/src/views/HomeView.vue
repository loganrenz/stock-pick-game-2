<template>
  <div class="py-4">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Current Week Section -->
      <div class="mb-6">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-4 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Current Week
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              {{ formatDate(currentWeek.startDate) }} - {{ formatDate(currentWeek.endDate) }}
            </p>
          </div>

          <div class="border-t border-gray-200">
            <div class="px-4 py-4 sm:p-6">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="pick in currentWeek.picks" :key="pick.id"
                  class="bg-gray-50 rounded-lg p-4 border-2 border-[#1e293b] hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-bold text-gray-900">
                      {{ pick.user.username.toUpperCase() }}
                    </h4>
                    <span v-if="currentWeek.winnerId === pick.userId"
                      class="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-bold">{{
                        pick.user.username.toUpperCase() }} WON</span>
                  </div>
                  <div class="text-sm text-gray-500">
                    <p class="mb-2"><b>Stock:</b> <span class="ticker">{{ pick.symbol.toUpperCase() }}</span></p>
                    <p class="mb-1"><b>Start Price:</b> {{ pick.entryPrice }}</p>
                    <p class="mb-1"><b>Last Close:</b> {{ pick.currentValue }}</p>
                    <p class="mb-1"><b>Return %:</b> <span
                        :class="{ 'return-pos': pick.returnPercentage > 0, 'return-neg': pick.returnPercentage < 0 }">{{
                          pick.returnPercentage ? pick.returnPercentage.toFixed(2) + '%' : 'N/A' }}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Next Week Section -->
      <div class="mb-6">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-4 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Next Week
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              {{ formatDate(nextWeek?.startDate) }} - {{ formatDate(nextWeek?.endDate) }}
            </p>
          </div>
          <div class="border-t border-gray-200 px-4 py-4">
            <button class="btn-primary w-full" @click="showNextWeekModal = true">
              {{ userNextWeekPick ? 'Change Pick' : 'Make Pick' }}
            </button>
          </div>
        </div>
      </div>

      <!-- History Section -->
      <div class="mb-6">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-4 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              History
            </h3>
          </div>
          <div class="border-t border-gray-200">
            <div class="px-4 py-4 sm:p-6">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="week in historicalWeeks" :key="week.id"
                  class="bg-gray-50 rounded-lg p-4 border-2 border-[#1e293b] hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-bold text-gray-900">
                      Week {{ week.weekNum }}
                    </h4>
                    <span v-if="week.winnerId" class="text-sm text-gray-500">
                      {{ formatDate(week.startDate) }}
                    </span>
                  </div>
                  <div v-for="pick in week.picks" :key="pick.id" class="mb-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold">{{ pick.user.username.toUpperCase() }}</span>
                      <span class="text-sm">{{ pick.symbol.toUpperCase() }}</span>
                    </div>
                    <div class="text-xs text-gray-500">
                      <span
                        :class="{ 'return-pos': pick.returnPercentage > 0, 'return-neg': pick.returnPercentage < 0 }">
                        {{ pick.returnPercentage ? pick.returnPercentage.toFixed(2) + '%' : 'N/A' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="gameStore.loading" class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
    <svg class="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();

const currentWeek = computed(() => gameStore.currentWeek || {
  id: 0,
  weekNum: 0,
  startDate: '',
  endDate: '',
  picks: []
});

const nextWeek = computed(() => gameStore.nextWeek);
const historicalWeeks = computed(() => gameStore.getHistoricalWeeks);
const userNextWeekPick = computed(() => gameStore.userNextWeekPick);

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

onMounted(() => {
  gameStore.fetchWeeks();
});
</script>

<style>
/* Remove all scoped CSS. Use only Tailwind in the template. */
</style>