<template>
  <div class="admin">
    <h1>Admin Panel</h1>
    
    <div class="admin-section">
      <h2>Current Week</h2>
      <div v-if="gameStore.currentWeek" class="current-week">
        <div class="week-info">
          <p>Week {{ gameStore.currentWeek.weekNum }}</p>
          <p>Start Date: {{ formatDate(gameStore.currentWeek.startDate) }}</p>
        </div>
        
        <div class="picks-list">
          <h3>Picks</h3>
          <div v-for="pick in gameStore.getCurrentWeekPicks" :key="pick.id" class="pick-item">
            <span>{{ pick.user.username }}: {{ pick.symbol }}</span>
            <span>${{ pick.priceAtPick.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="no-week">
        <p>No active week found</p>
        <button @click="createNewWeek" :disabled="loading">
          Create New Week
        </button>
      </div>
    </div>

    <div class="admin-section">
      <h2>Add Pick</h2>
      <form @submit.prevent="handleAddPick" class="add-pick-form">
        <div class="form-group">
          <label for="user">User</label>
          <select id="user" v-model="selectedUser" required>
            <option value="">Select a user</option>
            <option v-for="user in gameStore.users" :key="user.id" :value="user.id">
              {{ user.username }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="symbol">Stock Symbol</label>
          <input
            id="symbol"
            v-model="symbol"
            type="text"
            required
            placeholder="Enter stock symbol"
          />
        </div>

        <div class="form-group">
          <label for="price">Price at Pick</label>
          <input
            id="price"
            v-model="price"
            type="number"
            step="0.01"
            required
            placeholder="Enter price"
          />
        </div>

        <div v-if="error" class="error">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading || !gameStore.currentWeek">
          {{ loading ? 'Adding...' : 'Add Pick' }}
        </button>
      </form>
    </div>

    <div class="admin-section">
      <h2>End Week</h2>
      <div v-if="gameStore.currentWeek" class="end-week">
        <div class="form-group">
          <label for="winner">Select Winner</label>
          <select id="winner" v-model="selectedWinner" required>
            <option value="">Select winner</option>
            <option v-for="pick in gameStore.getCurrentWeekPicks" :key="pick.id" :value="pick.userId">
              {{ pick.user.username }}
            </option>
          </select>
        </div>

        <button @click="handleEndWeek" :disabled="loading || !selectedWinner">
          {{ loading ? 'Ending Week...' : 'End Week' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import { format } from 'date-fns';
import axios from 'axios';

const gameStore = useGameStore();
const selectedUser = ref('');
const symbol = ref('');
const price = ref('');
const selectedWinner = ref('');
const error = ref('');
const loading = ref(false);

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy');
};

const createNewWeek = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await axios.post('/api/weeks', {
      weekNum: gameStore.weeks.length + 1,
      startDate: new Date().toISOString(),
    });
    
    await gameStore.fetchWeeks();
  } catch (err) {
    error.value = 'Failed to create new week';
  } finally {
    loading.value = false;
  }
};

const handleAddPick = async () => {
  if (!gameStore.currentWeek) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    await gameStore.submitPick(
      gameStore.currentWeek.id,
      symbol.value,
      parseFloat(price.value)
    );
    
    // Reset form
    selectedUser.value = '';
    symbol.value = '';
    price.value = '';
  } catch (err) {
    error.value = 'Failed to add pick';
  } finally {
    loading.value = false;
  }
};

const handleEndWeek = async () => {
  if (!gameStore.currentWeek || !selectedWinner.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    await axios.put(`/api/weeks/${gameStore.currentWeek.id}`, {
      winnerId: parseInt(selectedWinner.value),
    });
    
    await gameStore.fetchWeeks();
    selectedWinner.value = '';
  } catch (err) {
    error.value = 'Failed to end week';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await gameStore.fetchWeeks();
  await gameStore.fetchUsers();
});
</script>

<style scoped>
.admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-section h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.current-week {
  display: grid;
  gap: 1.5rem;
}

.week-info {
  display: flex;
  gap: 2rem;
  color: #666;
}

.picks-list {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.pick-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.pick-item:last-child {
  border-bottom: none;
}

.add-pick-form {
  display: grid;
  gap: 1rem;
  max-width: 400px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #666;
  font-size: 0.9rem;
}

input, select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus, select:focus {
  outline: none;
  border-color: #4CAF50;
}

button {
  padding: 0.75rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background: #45a049;
}

button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  text-align: center;
  font-size: 0.9rem;
}

.no-week {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style> 