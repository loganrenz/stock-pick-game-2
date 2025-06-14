<template>
  <div class="history">
    <h1>Game History</h1>
    
    <div v-if="gameStore.loading" class="loading">
      Loading...
    </div>
    
    <div v-else-if="gameStore.error" class="error">
      {{ gameStore.error }}
    </div>
    
    <div v-else class="weeks-grid">
      <div v-for="week in gameStore.getHistoricalWeeks" :key="week.id" class="week-card">
        <div class="week-header">
          <h2>Week {{ week.weekNum }}</h2>
          <span class="date">{{ formatDate(week.startDate) }}</span>
        </div>
        
        <div class="winner">
          <h3>Winner: {{ week.winner?.username }}</h3>
        </div>
        
        <div class="picks-list">
          <div v-for="pick in week.picks" :key="pick.id" class="pick-item">
            <div class="pick-header">
              <span class="username">{{ pick.user.username }}</span>
              <span class="symbol">{{ pick.symbol }}</span>
            </div>
            <div class="pick-details">
              <div class="price-info">
                <span>Pick: ${{ pick.priceAtPick.toFixed(2) }}</span>
                <span v-if="pick.currentPrice">
                  Current: ${{ pick.currentPrice.toFixed(2) }}
                </span>
              </div>
              <div class="return-info">
                <span v-if="pick.weekReturnPct" :class="{ 
                  'positive': pick.weekReturnPct > 0,
                  'negative': pick.weekReturnPct < 0
                }">
                  Week: {{ pick.weekReturnPct.toFixed(2) }}%
                </span>
                <span v-if="pick.totalReturn" :class="{ 
                  'positive': pick.totalReturn > 0,
                  'negative': pick.totalReturn < 0
                }">
                  Total: {{ pick.totalReturn.toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import { format } from 'date-fns';

const gameStore = useGameStore();

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy');
};

onMounted(async () => {
  await gameStore.fetchWeeks();
});
</script>

<style scoped>
.history {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #dc3545;
}

.weeks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.week-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.week-header h2 {
  margin: 0;
  color: #2c3e50;
}

.date {
  color: #666;
  font-size: 0.9rem;
}

.winner {
  background: #e8f5e9;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.winner h3 {
  margin: 0;
  color: #2c3e50;
}

.picks-list {
  display: grid;
  gap: 1rem;
}

.pick-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.pick-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.username {
  font-weight: 500;
  color: #2c3e50;
}

.symbol {
  color: #666;
}

.pick-details {
  display: grid;
  gap: 0.5rem;
}

.price-info, .return-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.positive {
  color: #4CAF50;
}

.negative {
  color: #dc3545;
}
</style> 