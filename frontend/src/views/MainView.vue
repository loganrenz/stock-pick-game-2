<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Stock Pick Game
        </h1>
        <p class="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Make your weekly stock predictions and compete with others!
        </p>
      </div>

      <!-- Scoreboard in upper right corner -->
      <div v-if="isAuthenticated" class="absolute top-0 right-0 mt-6 mr-8 z-10">
        <div class="flex gap-2 justify-end">
          <div v-for="score in scoreboard" :key="score.username" class="bg-gray-100 rounded px-3 py-1 text-center min-w-[70px]">
            <div class="font-semibold text-base">{{ score.username }}</div>
            <div class="text-lg font-bold">{{ score.wins }}</div>
            <div class="text-xs text-gray-500">wins</div>
          </div>
        </div>
        <div class="mt-1 text-right">
          <router-link to="/stats" class="text-blue-600 underline text-xs">View Stats</router-link>
        </div>
      </div>

      <div v-if="!isAuthenticated" class="max-w-md mx-auto bg-white p-8 rounded shadow mb-8">
        <h2 class="text-2xl font-bold mb-4">Login</h2>
        <form @submit.prevent="login">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Username</label>
            <input v-model="loginForm.username" type="text" class="w-full border rounded px-3 py-2" placeholder="Enter your username" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Password</label>
            <input v-model="loginForm.password" type="password" class="w-full border rounded px-3 py-2" />
          </div>
          <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Login</button>
          <div v-if="loginError" class="text-red-600 mt-2 text-center">{{ loginError }}</div>
        </form>
      </div>

      <div v-else>
        <!-- Current Week at the top -->
        <div class="bg-white shadow rounded-lg mb-10">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">Current Week</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ formatDate(currentWeek?.startDate) }} - {{ formatDate(currentWeek?.endDate) }}
              </p>
              <div class="text-blue-700 font-bold mt-1">Week {{ currentWeek?.weekNum }}</div>
            </div>
            <div v-if="currentWeek && currentWeek.winner">
              <span class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg">
                Winner: {{ currentWeek.winner.username }}
              </span>
            </div>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <!-- Current week pick form (Monday 00:00 to Friday close) -->
            <div v-if="canPickCurrentWeek">
              <form @submit.prevent="submitPick" class="mb-6 flex gap-4 items-end">
                <div>
                  <label class="block text-gray-700 mb-1">Your Pick for Current Week</label>
                  <input v-model="pickForm.symbol" class="border rounded px-3 py-2" placeholder="e.g. AAPL" />
                </div>
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Submit Pick</button>
                <div v-if="pickError" class="text-red-600 ml-4">{{ pickError }}</div>
              </form>
            </div>
            <div v-if="nextAvailableWeekPickLocked" class="mb-4 text-center text-red-600">
              Picks for week {{ nextAvailableWeek?.weekNum }} are now locked. You cannot make or change your pick.
            </div>
            <div v-if="userNextAvailableWeekPick">
              <div class="mb-2 text-blue-700 font-semibold">Your pick for week {{ nextAvailableWeek?.weekNum }}: {{ userNextAvailableWeekPick.symbol }}</div>
            </div>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="pick in currentWeek?.picks || []" :key="pick.id" class="bg-gray-50 rounded-lg p-4 border">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-medium text-gray-900">{{ pick.user.username }}</h4>
                  <span v-if="currentWeek?.winnerId === pick.userId" class="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-bold">Winner</span>
                </div>
                <div class="text-sm text-gray-500">
                  <p><b>Stock:</b> {{ pick.symbol }}</p>
                  <p><b>Pick Price (Mon Open):</b> {{ pick.priceAtPick }}</p>
                  <p v-if="pick.currentPrice"><b>Current Price:</b> {{ pick.currentPrice }}</p>
                  <p><b>Return %:</b> {{ typeof pick.weekReturnPct === 'number' ? pick.weekReturnPct.toFixed(2) + '%' : 'N/A' }}</p>
                </div>
                <div v-if="pick.dailyPrices" class="mt-2">
                  <div v-for="(day, key) in pick.dailyPrices" :key="key" class="text-xs text-gray-600">
                    <b>{{ capitalize(key) }}:</b> Open {{ day.open ?? '-' }}, Close {{ day.close ?? '-' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Next Week Pick Box -->
        <div class="mb-10 flex flex-col items-center">
          <div class="w-full max-w-xl bg-blue-50 rounded-xl shadow p-8 flex flex-col items-center">
            <div class="text-lg font-semibold text-blue-900 mb-2">Next Week ({{ formatDate(nextAvailableWeek?.startDate) }} - {{ formatDate(nextAvailableWeek?.endDate) }})</div>
            <div class="text-2xl font-bold text-blue-800 mb-4">
              <span v-if="userNextAvailableWeekPick">{{ userNextAvailableWeekPick.symbol }}</span>
              <span v-else>None</span>
            </div>
            <button @click="showNextWeekModal = true" class="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-bold shadow hover:bg-blue-700">
              {{ userNextAvailableWeekPick ? 'CHANGE PICK' : 'MAKE PICK' }}
            </button>
          </div>
        </div>
        <Modal v-if="showNextWeekModal" @close="showNextWeekModal = false">
          <template #header>
            <div class="text-xl font-bold">{{ userNextAvailableWeekPick ? 'Change' : 'Make' }} Your Pick for Next Week</div>
            <div class="text-gray-500 text-sm">{{ formatDate(nextAvailableWeek?.startDate) }} - {{ formatDate(nextAvailableWeek?.endDate) }}</div>
          </template>
          <template #body>
            <form @submit.prevent="submitNextWeekPick">
              <input v-model="nextWeekPickForm.symbol" class="border rounded px-3 py-2 w-full mb-4" placeholder="e.g. AAPL" />
              <div v-if="nextWeekPickError" class="text-red-600 mb-2">{{ nextWeekPickError }}</div>
              <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded w-full">{{ userNextAvailableWeekPick ? 'Change Pick' : 'Submit Pick' }}</button>
            </form>
          </template>
        </Modal>

        <!-- History: only show weeks that have ended (endDate in the past and/or winner assigned) -->
        <div>
          <h2 class="text-2xl font-bold mb-4">History</h2>
          <div v-for="week in completedWeeks" :key="week.id" class="bg-white shadow rounded-lg mb-6">
            <div class="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 class="text-lg leading-6 font-medium text-gray-900">Week {{ week.weekNum }}</h3>
                <p class="mt-1 text-sm text-gray-500">
                  {{ formatDate(week.startDate) }} - {{ formatDate(week.endDate) }}
                </p>
              </div>
              <div v-if="week.winner">
                <span class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg">
                  Winner: {{ week.winner.username }}
                </span>
              </div>
            </div>
            <div class="px-4 py-5 sm:p-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="pick in week.picks" :key="pick.id" class="bg-gray-50 rounded-lg p-4 border">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-medium text-gray-900">{{ pick.user.username }}</h4>
                    <span v-if="week.winnerId === pick.userId" class="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-bold">Winner</span>
                  </div>
                  <div class="text-sm text-gray-500">
                    <p><b>Stock:</b> {{ pick.symbol }}</p>
                    <p><b>Pick Price (Mon Open):</b> {{ pick.priceAtPick }}</p>
                    <p v-if="pick.currentPrice"><b>Current Price:</b> {{ pick.currentPrice }}</p>
                    <p><b>Return %:</b> {{ typeof pick.weekReturnPct === 'number' ? pick.weekReturnPct.toFixed(2) + '%' : 'N/A' }}</p>
                  </div>
                  <div v-if="pick.dailyPrices" class="mt-2">
                    <div v-for="(day, key) in pick.dailyPrices" :key="key" class="text-xs text-gray-600">
                      <b>{{ capitalize(key) }}:</b> Open {{ day.open ?? '-' }}, Close {{ day.close ?? '-' }}
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import axios from 'axios';
import Modal from '../components/Modal.vue';

const users = ['Patrick', 'Logan', 'Taylor'];
const loginForm = ref({ username: '', password: '' });
const loginError = ref('');
const pickForm = ref({ symbol: '' });
const pickError = ref('');
const nextWeekPickForm = ref({ symbol: '' });
const nextWeekPickError = ref('');
const user = ref<{ username: string; token: string } | null>(null);
const scoreboard = ref<{ username: string; wins: number }[]>([]);
const showNextWeekModal = ref(false);

const gameStore = useGameStore();

const isAuthenticated = computed(() => !!user.value);
const currentWeek = computed(() => gameStore.currentWeek);
const historicalWeeks = computed(() => gameStore.getHistoricalWeeks.filter(w => w.id !== currentWeek.value?.id));

const canPickCurrentWeek = computed(() => {
  if (!isAuthenticated.value || !currentWeek.value) return false;
  const alreadyPicked = currentWeek.value.picks.some(p => p.user.username === user.value?.username);
  const now = new Date();
  const monday = new Date(currentWeek.value.startDate);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(currentWeek.value.startDate);
  friday.setDate(friday.getDate() + 4);
  friday.setHours(20, 0, 0, 0);
  return !alreadyPicked && now >= monday && now < friday;
});

// Next week pick logic
const nextAvailableWeek = computed(() => {
  if (!gameStore.weeks.length) return null;
  // Find the week with the highest weekNum
  return [...gameStore.weeks].sort((a, b) => b.weekNum - a.weekNum)[0] || null;
});
const canPickNextAvailableWeek = computed(() => {
  if (!isAuthenticated.value || !nextAvailableWeek.value) return false;
  const alreadyPicked = nextAvailableWeek.value.picks.some(p => p.user.username === user.value?.username);
  const now = new Date();
  // Only allow pick if now >= Friday close of previous week and <= Sunday midnight of this week
  const prevFriday = new Date(nextAvailableWeek.value.startDate);
  prevFriday.setDate(prevFriday.getDate() - 3); // previous Friday
  prevFriday.setHours(20, 0, 0, 0);
  const thisSunday = new Date(nextAvailableWeek.value.startDate);
  thisSunday.setDate(thisSunday.getDate() + 6);
  thisSunday.setHours(23, 59, 59, 999);
  return !alreadyPicked && now >= prevFriday && now <= thisSunday;
});
const nextAvailableWeekPickLocked = computed(() => {
  if (!nextAvailableWeek.value) return false;
  const now = new Date();
  const thisSunday = new Date(nextAvailableWeek.value.startDate);
  thisSunday.setDate(thisSunday.getDate() + 6);
  thisSunday.setHours(23, 59, 59, 999);
  return now > thisSunday;
});
const userNextAvailableWeekPick = computed(() => {
  if (!isAuthenticated.value || !nextAvailableWeek.value) return null;
  return nextAvailableWeek.value.picks.find(p => p.user.username === user.value?.username) || null;
});

const isAdmin = computed(() => user.value?.username === 'admin');

const completedWeeks = computed(() => {
  // Only show weeks that have ended (endDate in the past and/or winner assigned)
  const now = new Date();
  return gameStore.weeks.filter(w => {
    const ended = w.endDate && new Date(w.endDate) < now;
    return ended || w.winnerId;
  }).sort((a, b) => b.weekNum - a.weekNum);
});

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function login() {
  loginError.value = '';
  try {
    const res = await axios.post('/api/login', loginForm.value);
    user.value = { username: res.data.username, token: res.data.token };
    localStorage.setItem('user', JSON.stringify(user.value));
    axios.defaults.headers.common['Authorization'] = `Bearer ${user.value.token}`;
    await gameStore.fetchWeeks();
    await gameStore.fetchCurrentWeek();
  } catch (err) {
    loginError.value = 'Invalid credentials';
  }
}

function logout() {
  user.value = null;
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
}

async function submitPick() {
  pickError.value = '';
  if (!pickForm.value.symbol) {
    pickError.value = 'Please enter a stock symbol';
    return;
  }
  try {
    await gameStore.submitPick(pickForm.value.symbol);
    pickForm.value.symbol = '';
  } catch (err) {
    pickError.value = 'Failed to submit pick';
  }
}

async function submitNextWeekPick() {
  nextWeekPickError.value = '';
  if (!nextWeekPickForm.value.symbol) {
    nextWeekPickError.value = 'Please enter a stock symbol';
    return;
  }
  try {
    await gameStore.submitNextWeekPick(nextWeekPickForm.value.symbol);
    nextWeekPickForm.value.symbol = '';
    showNextWeekModal.value = false;
  } catch (err) {
    nextWeekPickError.value = 'Failed to submit pick';
  }
}

async function fetchScoreboard() {
  try {
    const res = await axios.get('/api/scoreboard');
    scoreboard.value = res.data;
  } catch (err) {
    scoreboard.value = users.map(u => ({ username: u, wins: 0 }));
  }
}

onMounted(async () => {
  const saved = localStorage.getItem('user');
  if (saved) {
    user.value = JSON.parse(saved);
    axios.defaults.headers.common['Authorization'] = `Bearer ${user.value.token}`;
  }
  await gameStore.fetchWeeks();
  await gameStore.fetchCurrentWeek();
  await fetchScoreboard();
});
</script>

<style scoped>
input, select {
  outline: none;
}
</style> 