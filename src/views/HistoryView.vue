<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">
        Stock Pick History
      </h1>

      <div class="space-y-6">
        <div v-for="week in sortedWeeks" :key="week.id" class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Week {{ week.weekNum }}
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              {{ formatDate(week.startDate) }} - {{ formatDate(week.endDate) }}
            </p>
          </div>

          <div class="px-4 py-5 sm:p-6">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="pick in week.picks" :key="pick.id" class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <h4 class="text-sm font-medium text-gray-900">
                    {{ pick.user.username }}
                  </h4>
                </div>
                <div class="text-sm text-gray-500">
                  <p>Stock: {{ pick.symbol }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();

const sortedWeeks = computed(() => gameStore.getHistoricalWeeks);
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
:root {
  --primary: #1d4ed8;
  --primary-light: #3b82f6;
  --accent: #22c55e;
  --danger: #ef4444;
  --bg: #f5f6fa;
  --card-bg: #fff;
  --border: #e5e7eb;
  --shadow: 0 4px 24px rgba(30, 41, 59, 0.10), 0 1.5px 4px rgba(30, 41, 59, 0.04);
  --radius: 18px;
  --font-main: 'Inter', system-ui, sans-serif;
}

body,
html {
  font-family: var(--font-main);
  background: var(--bg);
  font-size: 18px;
  color: #18181b;
}

h1,
h2,
h3,
h4 {
  font-family: var(--font-main);
  font-weight: 800;
  color: var(--primary);
}

h1 {
  font-size: 2.8rem;
  margin-bottom: 0.5em;
}

h2 {
  font-size: 2rem;
  margin-bottom: 0.5em;
}

h3 {
  font-size: 1.3rem;
  margin-bottom: 0.3em;
}

.bg-white,
.bg-gray-50,
.bg-blue-50 {
  background: var(--card-bg) !important;
}

.shadow,
.shadow-lg {
  box-shadow: var(--shadow) !important;
}

.rounded-lg,
.rounded-xl,
.rounded {
  border-radius: var(--radius) !important;
}

.border,
.border-blue-200,
.border-blue-100,
.border-gray-100,
.border-gray-200 {
  border: 1.5px solid var(--border) !important;
}

.py-6,
.py-5,
.py-4,
.py-2,
.p-8,
.p-4,
.p-6,
.px-4,
.px-6,
.mb-10,
.mb-8,
.mb-6,
.mb-4,
.mb-2 {
  /* Use more vertical spacing */
  margin-bottom: 1.5rem !important;
  padding: 1.5rem !important;
}

.text-4xl,
.text-2xl,
.text-lg,
.text-md,
.text-sm {
  font-size: 1.1em !important;
}

.text-4xl {
  font-size: 2.5rem !important;
}

.text-2xl {
  font-size: 1.7rem !important;
}

.text-lg {
  font-size: 1.2rem !important;
}

.text-md {
  font-size: 1.1rem !important;
}

.text-sm {
  font-size: 1rem !important;
}

.text-blue-900,
.text-blue-700,
.text-blue-800 {
  color: var(--primary) !important;
}

.text-green-900,
.text-green-800 {
  color: var(--accent) !important;
}

.bg-blue-600,
.bg-indigo-600 {
  background: var(--primary) !important;
  color: #fff !important;
}

.bg-blue-700,
.bg-indigo-700 {
  background: var(--primary-light) !important;
  color: #fff !important;
}

.bg-green-200,
.bg-green-100 {
  background: #e6fbe8 !important;
  color: var(--accent) !important;
}

.bg-blue-50 {
  background: #f0f6ff !important;
}

button,
.btn {
  font-size: 1.1rem;
  font-weight: 700;
  padding: 0.85rem 2.2rem;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px rgba(30, 41, 59, 0.08);
  transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
  outline: none;
  margin: 0.2rem 0;
}

button:hover,
.btn:hover,
button:focus,
.btn:focus {
  background: var(--primary-light);
  box-shadow: 0 4px 16px rgba(30, 41, 59, 0.13);
  transform: translateY(-2px) scale(1.03);
}

button:active,
.btn:active {
  background: var(--primary);
  transform: scale(0.98);
}

button:disabled,
.btn:disabled {
  background: #cbd5e1;
  color: #fff;
  cursor: not-allowed;
}

input,
select,
textarea {
  font-size: 1.1rem;
  padding: 0.9rem 1.1rem;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  margin-bottom: 1rem;
  background: #f8fafc;
  transition: border 0.18s, box-shadow 0.18s;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px #dbeafe;
  outline: none;
}

.bg-gray-50 {
  background: #f8fafc !important;
}

.scoreboard-main {
  margin-bottom: 2.5rem;
}

.scoreboard-box {
  background: #f3f4f6;
  border-radius: 10px;
  padding: 0.7rem 1.2rem;
  min-width: 60px;
  text-align: center;
  font-size: 1.1rem;
  margin-right: 8px;
  box-shadow: 0 1px 4px rgba(30, 41, 59, 0.07);
}

.scoreboard-user {
  font-weight: 700;
  font-size: 1.1rem;
}

.scoreboard-wins {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--primary);
}

.scoreboard-link {
  color: var(--primary);
  font-size: 1rem;
  text-decoration: underline;
  font-weight: 600;
}

.winner-banner {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2.5rem;
}

.bg-white,
.bg-gray-50,
.bg-blue-50,
.shadow-lg,
.rounded-lg {
  box-shadow: var(--shadow) !important;
  border-radius: var(--radius) !important;
}

.grid-cols-1,
.sm\:grid-cols-2,
.lg\:grid-cols-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 640px) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

.bg-gray-50,
.bg-white {
  padding: 2rem 1.5rem !important;
  margin-bottom: 1.5rem !important;
}

.daily-price-row {
  display: flex;
  gap: 1.2rem;
  font-size: 1.05rem;
  margin-top: 0.2rem;
  color: #64748b;
}

.debug-box {
  background: #f8fafc;
  border: 1.5px solid #e0e0e0;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1.2rem;
  border-radius: 12px;
  font-size: 1.08rem;
  color: #334155;
  font-family: var(--font-main);
}

@media (max-width: 700px) {

  .max-w-7xl,
  .max-w-xl {
    max-width: 100vw !important;
    padding: 0 0.5rem !important;
  }

  .grid-cols-1,
  .sm\:grid-cols-2,
  .lg\:grid-cols-3 {
    grid-template-columns: 1fr !important;
    gap: 1.2rem !important;
  }

  .bg-white,
  .bg-gray-50,
  .bg-blue-50 {
    padding: 1.2rem 0.7rem !important;
  }

  .scoreboard-box {
    padding: 0.5rem 0.7rem;
    font-size: 1rem;
  }
}
</style>