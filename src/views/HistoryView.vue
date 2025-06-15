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
              Week {{ week.weekNumber }}
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              {{ formatDate(week.startDate) }} - {{ formatDate(week.endDate) }}
            </p>
          </div>
          
          <div class="px-4 py-5 sm:p-6">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="pick in week.picks" :key="pick.id" class="bg-gray-50 rounded-lg p-4">
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
.history {
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
.error { color: #dc3545; }
.weeks-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
}
.week-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1.5rem;
  transition: box-shadow 0.2s;
  border-left: 6px solid #4CAF50;
}
.week-card:nth-child(even) {
  background: #f8fafb;
}
.week-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.week-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}
.week-date {
  color: #666;
  font-size: 1rem;
}
.week-winner {
  background: #e8f5e9;
  color: #388e3c;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.winner-name {
  font-weight: 700;
}
.picks-table-wrapper {
  overflow-x: auto;
}
.picks-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  background: transparent;
}
.picks-table th, .picks-table td {
  padding: 0.5rem 0.4rem;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.98rem;
}
.picks-table th {
  background: #f5f7fa;
  color: #222e3a;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: center;
}
.picks-table td {
  text-align: center;
}
.picks-table td.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.picks-table tbody tr:nth-child(even) {
  background: #f3f6fa;
}
.picker-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}
.avatar {
  width: 28px;
  height: 28px;
  background: #4CAF50;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}
@media (max-width: 900px) {
  .history { padding: 1rem 0.5rem 0.5rem 0.5rem; }
  .week-card { padding: 0.7rem; }
  .picks-table th, .picks-table td { font-size: 0.85rem; }
}
@media (max-width: 600px) {
  .week-header { flex-direction: column; align-items: flex-start; }
  .week-title { font-size: 1.1rem; }
  .picks-table-wrapper { overflow-x: scroll; }
}
</style> 