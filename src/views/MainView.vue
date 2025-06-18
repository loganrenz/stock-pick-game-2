ap<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <!-- Scoreboard in upper left corner, hidden on small screens -->
      <!-- Removed scoreboard-top-left div as requested -->

      <div class="text-center mb-8">
        <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Stock Pick Game
        </h1>
        <p class="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Make your weekly stock predictions and compete with others!
        </p>
        <div v-if="isAuthenticated" class="mt-2 text-blue-700 text-lg font-semibold">
          Logged in as: {{ auth.user?.username }}
        </div>
      </div>

      <!-- Login Modal -->
      <Modal v-if="props.showLoginModal" @close="closeLoginModal">
        <template #header>
          <div class="text-2xl font-bold mb-2">
            Login
          </div>
        </template>
        <template #body>
          <form @submit.prevent="login">
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Username</label>
              <input v-model="loginForm.username" type="text" class="w-full border rounded px-3 py-2"
                placeholder="Enter your username" data-testid="login-username" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Password</label>
              <input v-model="loginForm.password" type="password" class="w-full border rounded px-3 py-2"
                data-testid="login-password" />
            </div>
            <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
              data-testid="login-submit">
              Login
            </button>
            <div v-if="loginError" class="text-red-600 mt-2 text-center">
              {{ loginError }}
            </div>
          </form>
        </template>
      </Modal>

      <div v-else>
        <!-- Winner Banner (weekend only) -->
        <div v-if="isWeekend && currentWeek && currentWeek.winner" class="winner-banner mb-6">
          <div class="bg-green-200 text-green-900 text-3xl font-extrabold py-6 px-8 rounded-xl shadow text-center">
            🏆 Winner: {{ currentWeek.winner.username }} 🏆
          </div>
        </div>
        <!-- Current Week at the top -->
        <div class="bg-white shadow-lg rounded-lg mb-10 border-2 border-blue-200" data-testid="current-week-section">
          <div
            class="px-4 py-5 sm:px-6 border-b border-blue-100 flex justify-between items-center bg-blue-50 rounded-t-lg">
            <div>
              <h3 class="text-2xl leading-6 font-bold text-blue-900">
                Current Week
              </h3>
              <p class="mt-1 text-md text-blue-700 font-semibold">
                {{ formatDate(currentWeek?.startDate) }} - {{ formatDate(currentWeek?.endDate) }}
              </p>
              <div class="text-blue-700 font-bold mt-1 text-lg">
                Week {{ currentWeek?.weekNum }}
              </div>
            </div>
            <div v-if="currentWeek && currentWeek.winner && !isWeekend">
              <span class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg">
                Winner: {{ currentWeek.winner.username }}
              </span>
            </div>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <!-- Current week pick form (Monday 00:00 to Friday close) -->
            <div v-if="isAuthenticated && canPickCurrentWeek">
              <form class="mb-6 flex gap-4 items-end" @submit.prevent="submitPick">
                <div class="flex-1">
                  <label class="block text-gray-700 mb-1">Your Pick for Current Week</label>
                  <input v-model="pickForm.symbol" class="w-full border rounded px-3 py-2" placeholder="e.g. AAPL"
                    data-testid="pick-symbol" />
                </div>
                <button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                  Submit Pick
                </button>
              </form>
              <div v-if="pickError" class="text-red-600 mt-2">
                {{ pickError }}
              </div>
            </div>
            <div v-if="!isAuthenticated && canPickCurrentWeek" class="mb-6 flex gap-4 items-end justify-center">
              <button class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" @click="openLoginModal">
                Login to
                Make Pick
              </button>
            </div>
            <div v-if="nextAvailableWeekPickLocked" class="mb-4 text-center text-red-600">
              Picks for week {{ nextAvailableWeek?.weekNum }} are now locked. You cannot make or change your pick.
            </div>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="pick in currentWeek?.picks || []" :key="pick.id"
                class="bg-gray-50 rounded-lg p-4 border hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-medium text-gray-900">
                    {{ pick.user.username }}
                  </h4>
                  <span v-if="currentWeek?.winnerId === pick.userId"
                    class="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-bold">Winner</span>
                </div>
                <div class="text-sm text-gray-500">
                  <p><b>Stock:</b> {{ pick.symbol }}</p>
                  <p><b>Pick Price (Mon Open):</b> {{ pick.entryPrice }}</p>
                  <p v-if="pick.currentValue">
                    <b>Current Price:</b> {{ pick.currentValue }}
                  </p>
                  <p>
                    <b>Return %:</b> {{ typeof pick.returnPercentage === 'number' ? pick.returnPercentage.toFixed(2) +
                      '%' :
                      'N/A' }}
                  </p>
                </div>
                <div v-if="pick.dailyPriceData" class="mt-2">
                  <template v-for="(priceData, day) in pick.dailyPriceData" :key="day">
                    <div v-if="priceData && typeof day === 'string'" class="daily-price-row"
                      :data-testid="`daily-price-${day}`">
                      <span :data-testid="`weekday-label-${day}`">{{ dayLabel(day as string) }}</span>
                      <span :data-testid="`open-price-${day}`">Open {{ priceData.open ?? '-' }}</span>
                      <span :data-testid="`close-price-${day}`">Close {{ priceData.close ?? '-' }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Next Week Pick Box (always visible) -->
        <div class="mb-10 flex flex-col items-center">
          <div
            class="w-full max-w-xl bg-blue-50 rounded-xl shadow p-8 flex flex-col items-center border border-blue-200">
            <div class="text-lg font-semibold text-blue-900 mb-2">
              Next Week <span v-if="gameStore.nextWeek">({{ formatDate(gameStore.nextWeek?.startDate) }} - {{
                formatDate(gameStore.nextWeek?.endDate)
                }})</span>
              <span v-else>(-)</span>
            </div>
            <div class="text-2xl font-bold text-blue-800 mb-4">
              <span v-if="userNextWeekPick">{{ userNextWeekPick.symbol }}</span>
              <span v-else>None</span>
            </div>
            <div v-if="userNextWeekPick" class="mb-2 text-blue-700 font-semibold">
              Your pick for week {{ gameStore.nextWeek?.weekNum }}: {{ userNextWeekPick.symbol }}
            </div>
            <button v-if="!isAuthenticated"
              class="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-bold shadow hover:bg-indigo-700"
              @click="openLoginModal" :disabled="nextAvailableWeekPickLocked">
              Login to Make Next Week's Pick
            </button>
            <button v-else
              class="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-bold shadow hover:bg-blue-700"
              @click="showNextWeekModal = true" :disabled="nextAvailableWeekPickLocked">
              {{ userNextWeekPick ? 'Change Pick' : 'Make Pick' }}
            </button>
            <div v-if="nextAvailableWeekPickLocked" class="mt-2 text-red-600">
              Picks for week {{ nextAvailableWeek?.weekNum }} are now locked. You cannot make or change your pick.
            </div>
          </div>
        </div>
        <Modal v-if="showNextWeekModal && isAuthenticated" @close="showNextWeekModal = false">
          <template #header>
            <div class="text-xl font-bold">
              {{ userNextWeekPick ? 'Update' : 'Make' }} Your Pick for Next Week
            </div>
            <div class="text-gray-500 text-sm">
              {{ formatDate(gameStore.nextWeek?.startDate) }} - {{ formatDate(gameStore.nextWeek?.endDate) }}
            </div>
          </template>
          <template #body>
            <form @submit.prevent="submitNextWeekPick">
              <input v-model="nextWeekPickForm.symbol" class="border rounded px-3 py-2 w-full mb-4"
                placeholder="e.g. AAPL" />
              <div v-if="nextWeekPickError" class="text-red-600 mb-2">
                {{ nextWeekPickError }}
              </div>
              <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded w-full"
                :disabled="nextAvailableWeekPickLocked">
                {{ userNextWeekPick ? 'Update Pick' : 'Submit Pick' }}
              </button>
            </form>
          </template>
        </Modal>

        <!-- Scoreboard below next week pick, above history -->
        <div class="scoreboard-main mb-8">
          <div class="flex gap-1 justify-center">
            <div v-for="score in scoreboard" :key="score.username" class="scoreboard-box">
              <div class="scoreboard-user">
                {{ score.username }}
              </div>
              <div class="scoreboard-wins">
                {{ score.wins }}
              </div>
            </div>
          </div>
          <div class="mt-1 text-center">
            <router-link to="/stats" class="scoreboard-link">
              View Stats
            </router-link>
          </div>
        </div>

        <!-- History: only show weeks that have ended (endDate in the past and/or winner assigned) -->
        <div>
          <h2 class="text-2xl font-bold mb-4">
            History
          </h2>
          <div>Debug: {{ completedWeeks.length }} completed weeks</div>
          <div v-if="completedWeeks.length === 0" class="text-gray-500 text-center mb-8">
            No history yet. Completed weeks
            will
            appear here.
          </div>
          <div v-for="week in completedWeeks" :key="week.id"
            class="bg-white shadow rounded-lg mb-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div
              class="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <div>
                <h3 class="text-lg leading-6 font-bold text-gray-900">
                  Week {{ week.weekNum }}
                </h3>
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
                <div v-for="pick in week.picks" :key="pick.id"
                  class="bg-gray-50 rounded-lg p-4 border hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ pick.user.username }}
                    </h4>
                    <span v-if="week.winnerId === pick.userId"
                      class="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-bold">Winner</span>
                  </div>
                  <div class="text-sm text-gray-500">
                    <p><b>Stock:</b> {{ pick.symbol }}</p>
                    <p><b>Pick Price (Mon Open):</b> {{ pick.entryPrice }}</p>
                    <p v-if="pick.currentValue">
                      <b>Current Price:</b> {{ pick.currentValue }}
                    </p>
                    <p>
                      <b>Return %:</b> {{ typeof pick.returnPercentage === 'number' ? pick.returnPercentage.toFixed(2)
                        + '%'
                        : 'N/A' }}
                    </p>
                  </div>
                  <div v-if="pick.dailyPriceData" class="mt-2">
                    <template v-for="(priceData, day) in pick.dailyPriceData" :key="day">
                      <div v-if="priceData && typeof day === 'string'" class="daily-price-row"
                        :data-testid="`daily-price-${day}`">
                        <span :data-testid="`weekday-label-${day}`">{{ dayLabel(day as string) }}</span>
                        <span :data-testid="`open-price-${day}`">Open {{ priceData.open ?? '-' }}</span>
                        <span :data-testid="`close-price-${day}`">Close {{ priceData.close ?? '-' }}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div style="margin-top: 3rem;" />
  <button
    style="margin-bottom: 1rem; padding: 0.5rem 1.2rem; background: #1890ff; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer;"
    @click="copyDebugInfo">
    Copy
    Debug Info
  </button>
  <span v-if="debugCopied" style="color: #52c41a; margin-left: 1rem; font-weight: bold;">Copied!</span>
  <div class="debug-box"
    style="background:#fffbe6;border:1px solid #ffe58f;padding:1rem;margin-bottom:1rem;border-radius:8px;font-size:0.95rem;">
    <b>DEBUG INFO</b><br />
    <div>Current Time: {{ new Date().toString() }}</div>
    <div>Username: {{ auth.user?.username }}</div>
    <div>isAuthenticated: {{ isAuthenticated.toString() }}</div>
    <div>currentWeek.startDate: {{ currentWeek?.startDate }}</div>
    <div>currentWeek.endDate: {{ currentWeek?.endDate }}</div>
    <div>
      alreadyPicked: {{(currentWeek?.picks ?? []).some(p => p.user.username === auth.user?.username).toString()}}
    </div>
    <div>canPickCurrentWeek: {{ canPickCurrentWeek.toString() }}</div>
  </div>
  <div class="debug-box"
    style="background:#e6f7ff;border:1px solid #91d5ff;padding:1rem;margin-bottom:1rem;border-radius:8px;font-size:0.95rem;">
    <b>NEXT WEEK DEBUG</b><br />
    <div>nextWeek.startDate: {{ gameStore.nextWeek?.startDate }}</div>
    <div>nextWeek.endDate: {{ gameStore.nextWeek?.endDate }}</div>
    <div>nextWeek.id: {{ gameStore.nextWeek?.id }}</div>
    <div>nextWeek.picks: {{ gameStore.nextWeek?.picks ? JSON.stringify(gameStore.nextWeek.picks) : 'null' }}</div>
    <div>userNextWeekPick: {{ userNextWeekPick ? JSON.stringify(userNextWeekPick) : 'null' }}</div>
    <div>currentUser: {{ auth.user ? JSON.stringify(auth.user) : 'null' }}</div>
  </div>
  <div class="debug-box"
    style="background:#ffe6e6;border:1px solid #ff7875;padding:1rem;margin-bottom:1rem;border-radius:8px;font-size:0.95rem;">
    <b>COMPLETED WEEKS DEBUG</b><br />
    <div>Total weeks in store: {{ allWeeks.length }}</div>
    <div>
      <b>All weeks:</b>
      <ul>
        <li v-for="w in allWeeks" :key="w.id">
          WeekNum: {{ w.weekNum }}, endDate: {{ w.endDate }}, ended: {{ w.endDate && new Date(w.endDate)
            < new Date() }}, winnerId: {{ w.winnerId }}<br />
          Picks: [<span v-for="p in w.picks" :key="p.id">{{ p.user.username }} </span>]
        </li>
      </ul>
    </div>
    <div>
      <b>Completed weeks (after filter):</b> {{ completedWeeks.length }}<br />
      <ul>
        <li v-for="w in completedWeeks" :key="w.id">
          WeekNum: {{ w.weekNum }}
        </li>
      </ul>
    </div>
    <div>
      <b>Filter logic for each week:</b>
      <ul>
        <li v-for="w in allWeeks" :key="w.id">
          WeekNum: {{ w.weekNum }} - ended: {{ w.endDate && new Date(w.endDate) < new Date() }}, winnerId: {{ w.winnerId
          }}, hasValidPick: {{Array.isArray(w.picks) && w.picks.some((p) =>
              users.includes(p.user.username?.toLowerCase().trim()))}}
            => Included: {{(w.endDate && new Date(w.endDate) < new Date()) || w.winnerId ? (Array.isArray(w.picks) &&
              w.picks.some((p) => users.includes(p.user.username?.toLowerCase().trim())) ? 'YES' : 'NO') : 'NO'}}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps, defineEmits, watch } from 'vue';
import { useGameStore } from '../stores/game';
import axios from 'axios';
import Modal from '../components/Modal.vue';
import { useAuthStore } from '../stores/auth';
import { capitalize } from '../utils/format';
import type { Pick, Week, DailyPrice } from '../types';

const props = defineProps({
  showLoginModal: Boolean
});
const emit = defineEmits(['update:show-login-modal']);

const users = ['patrick', 'taylor', 'logan'];
const loginForm = ref({ username: '', password: '' });
const loginError = ref('');
const pickForm = ref({ symbol: '' });
const pickError = ref('');
const nextWeekPickForm = ref({ symbol: '' });
const nextWeekPickError = ref('');
const showNextWeekModal = ref(false);
const scoreboard = ref<any[]>([]);
const debugCopied = ref(false);

const gameStore = useGameStore();
const auth = useAuthStore();

const isAuthenticated = computed(() => auth.isAuthenticated);
const currentWeek = computed(() => gameStore.currentWeek);
const allWeeks = computed(() => gameStore.weeks);
const historicalWeeks = computed(() => (Array.isArray(gameStore.getHistoricalWeeks) ? gameStore.getHistoricalWeeks : []).filter((w: any) => w.id !== currentWeek.value?.id));

const canPickCurrentWeek = computed(() => {
  if (!isAuthenticated.value || !currentWeek.value) return false;
  const alreadyPicked = currentWeek.value.picks?.some((p: Pick) => p.user.username === auth.user?.username) ?? false;
  const now = new Date();
  const monday = new Date(currentWeek.value.startDate);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(currentWeek.value.startDate);
  friday.setDate(friday.getDate() + 4);
  friday.setHours(20, 0, 0, 0);
  return !alreadyPicked && now >= monday && now < friday;
});

// Find the next week (highest weekNum not equal to currentWeek)
const nextAvailableWeek = computed(() => {
  if (!Array.isArray(allWeeks.value) || !currentWeek.value) return null;
  return allWeeks.value.filter(w => w.id !== currentWeek.value?.id).sort((a, b) => b.weekNum - a.weekNum)[0] || null;
});

// Only show next week pick box if pick window is open (Friday close to Sunday midnight)
const showNextWeekPickBox = computed(() => {
  if (!nextAvailableWeek.value || !currentWeek.value) return false;
  const now = new Date();
  const prevFriday = new Date(currentWeek.value.startDate);
  prevFriday.setDate(prevFriday.getDate() + 4); // Friday
  prevFriday.setHours(20, 0, 0, 0);
  const thisSunday = new Date(nextAvailableWeek.value.startDate);
  thisSunday.setDate(thisSunday.getDate() + 6);
  thisSunday.setHours(23, 59, 59, 999);
  return now >= prevFriday && now <= thisSunday;
});

const userNextWeekPick = computed(() => {
  if (!isAuthenticated.value || !gameStore.nextWeek) return null;
  return (gameStore.nextWeek.picks ?? []).find(
    (p) => p.user.username?.toLowerCase().trim() === auth.user?.username?.toLowerCase().trim()
  ) || null;
});

const isAdmin = computed(() => auth.user?.username === 'admin');

const completedWeeks = computed(() => {
  // Only show weeks that have ended (endDate in the past and/or winner assigned)
  const now = new Date();
  const completed = (Array.isArray(gameStore.weeks) ? gameStore.weeks : [])
    .filter((w: Week) => {
      const ended = w.endDate && new Date(w.endDate) < now;
      return (ended || w.winnerId) && Array.isArray(w.picks) && w.picks.some((p: Pick) => users.includes(p.user.username?.toLowerCase().trim()));
    })
    .sort((a: Week, b: Week) => b.weekNum - a.weekNum);
  return completed;
});

const today = new Date();
const isWeekend = today.getDay() === 0 || today.getDay() === 6;

const nextAvailableWeekPickLocked = computed(() => {
  if (!nextAvailableWeek.value) return false;
  const now = new Date();
  const week = nextAvailableWeek.value;
  const sunday = new Date(week.startDate);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return now > sunday;
});

function formatDate(dateString?: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function login() {
  try {
    loginError.value = '';
    await auth.login(loginForm.value.username, loginForm.value.password);
    closeLoginModal();
    // Refresh game data after login
    await gameStore.fetchCurrentWeek();
    await gameStore.fetchWeeks();
    await gameStore.fetchScoreboard();
  } catch (error) {
    loginError.value = 'Invalid username or password';
  }
}

function logout() {
  auth.logout();
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
  if (!nextAvailableWeek.value) {
    nextWeekPickError.value = 'No next week available.';
    return;
  }
  try {
    await gameStore.submitNextWeekPick(nextWeekPickForm.value.symbol, nextAvailableWeek.value.id, auth.user);
    nextWeekPickForm.value.symbol = '';
    showNextWeekModal.value = false;
    await gameStore.fetchAll();
  } catch (err) {
    nextWeekPickError.value = 'Failed to submit pick';
  }
}

function closeLoginModal() {
  emit('update:show-login-modal', false);
  loginForm.value = { username: '', password: '' };
  loginError.value = '';
}

function openLoginModal() {
  emit('update:show-login-modal', true);
}

function copyDebugInfo() {
  const debugBoxes = document.querySelectorAll('.debug-box');
  let text = '';
  debugBoxes.forEach(box => { text += box.textContent + '\n'; });

  // Add completed weeks debug info
  text += '\n\n=== COMPLETED WEEKS DEBUG ===\n';
  text += `Total weeks in store: ${allWeeks.value.length}\n`;
  text += 'All weeks:\n';
  allWeeks.value.forEach(w => {
    text += `  WeekNum: ${w.weekNum}, endDate: ${w.endDate}, ended: ${w.endDate && new Date(w.endDate) < new Date()}, winnerId: ${w.winnerId}\n`;
    text += `    Picks: [${(w.picks || []).map(p => p.user.username).join(', ')}]\n`;
  });
  text += `Completed weeks (after filter): ${completedWeeks.value.length}\n`;
  completedWeeks.value.forEach(w => {
    text += `  WeekNum: ${w.weekNum}\n`;
  });
  text += 'Filter logic for each week:\n';
  allWeeks.value.forEach(w => {
    const ended = w.endDate && new Date(w.endDate) < new Date();
    const hasValidPick = Array.isArray(w.picks) && w.picks.some((p) => users.includes(p.user.username?.toLowerCase().trim()));
    const included = (ended || w.winnerId) && hasValidPick;
    text += `  WeekNum: ${w.weekNum} - ended: ${ended}, winnerId: ${w.winnerId}, hasValidPick: ${hasValidPick} => Included: ${included ? 'YES' : 'NO'}\n`;
  });

  navigator.clipboard.writeText(text.trim());
  debugCopied.value = true;
  setTimeout(() => { debugCopied.value = false; }, 1200);
}

function dayLabel(day: string) {
  const map: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
  };
  return map[day] || day;
}

onMounted(async () => {
  await gameStore.fetchAll();
});

watch(isAuthenticated, async (isAuth) => {
  await gameStore.fetchAll();
});
</script>

<style scoped>
input,
select {
  outline: none;
}

.scoreboard-top-left {
  /* Removed: position: absolute; top: 0; left: 0; z-index: 20; display: block; */
}

.scoreboard-box {
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px 8px;
  min-width: 40px;
  text-align: center;
  font-size: 0.85rem;
  margin-right: 2px;
}

.scoreboard-user {
  font-weight: 600;
  font-size: 0.85rem;
}

.scoreboard-wins {
  font-size: 0.9rem;
  font-weight: 700;
  color: #2563eb;
}

.scoreboard-link {
  color: #2563eb;
  font-size: 0.7rem;
  text-decoration: underline;
}

@media (max-width: 700px) {
  .scoreboard-top-left {
    display: none !important;
  }
}

.winner-banner {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>