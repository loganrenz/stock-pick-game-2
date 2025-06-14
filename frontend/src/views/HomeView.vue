<template>
  <div class="home">
    <h1>Stock Pick Game</h1>
    
    <div v-if="gameStore.loading" class="loading">
      Loading...
    </div>
    
    <div v-else-if="gameStore.error" class="error">
      {{ gameStore.error }}
    </div>
    
    <div v-else class="current-week">
      <h2>Current Week</h2>
      <div v-if="gameStore.currentWeek" class="picks-grid">
        <div v-for="pick in gameStore.getCurrentWeekPicks" :key="pick.id" class="pick-card">
          <h3>{{ pick.user.username }}</h3>
          <div class="pick-details">
            <p>Symbol: {{ pick.symbol }}</p>
            <p>Price at Pick: ${{ pick.priceAtPick.toFixed(2) }}</p>
            <p v-if="pick.currentPrice">
              Current Price: ${{ pick.currentPrice.toFixed(2) }}
            </p>
            <p v-if="pick.weekReturnPct">
              Week Return: {{ pick.weekReturnPct.toFixed(2) }}%
            </p>
          </div>
        </div>
      </div>
      <div v-else class="no-picks">
        No active week found
      </div>
    </div>

    <div class="navigation">
      <router-link to="/history" class="nav-link">View History</router-link>
      <router-link v-if="isAdmin" to="/admin" class="nav-link">Admin Panel</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();

const isAdmin = computed(() => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).username === 'admin' : false;
});

onMounted(async () => {
  await gameStore.fetchWeeks();
  await gameStore.fetchUsers();
});
</script>

<style scoped>
.home {
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
</style> 