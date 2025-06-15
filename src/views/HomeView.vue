<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Stock Pick Game
        </h1>
        <p class="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Make your weekly stock predictions and compete with others!
        </p>
      </div>

      <div class="mt-12">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Current Week
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              {{ formatDate(currentWeek.startDate) }} - {{ formatDate(currentWeek.endDate) }}
            </p>
          </div>
          
          <div class="border-t border-gray-200">
            <div class="px-4 py-5 sm:p-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="pick in currentWeek.picks" :key="pick.id" class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ pick.user.username }}
                    </h4>
                    <span 
                      :class="[
                        'px-2 py-1 text-xs font-medium rounded-full',
                        pick.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ pick.isCorrect ? 'Correct' : 'Incorrect' }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-500">
                    <p>Stock: {{ pick.stockSymbol }}</p>
                    <p>Direction: {{ pick.direction }}</p>
                    <p>Confidence: {{ pick.confidence }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <router-link
          to="/history"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          View History
        </router-link>
      </div>
    </div>
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

const loading = computed(() => gameStore.loading);
const error = computed(() => gameStore.error);

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

<style scoped>
.home {
  max-width: 1200px;
  margin: 2rem auto 0 auto;
  padding: 2rem 1rem 1rem 1rem;
  background: transparent;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #dc3545;
}

.current-week {
  margin-top: 2rem;
}

.picks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.pick-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pick-card h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.pick-details p {
  margin: 0.5rem 0;
  color: #666;
}

.navigation {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.nav-link {
  padding: 0.5rem 1rem;
  background: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background: #45a049;
}

.no-picks {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@media (max-width: 900px) {
  .home { padding: 1rem 0.5rem 0.5rem 0.5rem; }
}
</style> 