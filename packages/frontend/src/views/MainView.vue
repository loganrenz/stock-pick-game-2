<template>
  <PageContainer>
    <!-- Login Modal -->
    <Modal v-if="showLoginModal" @close="closeLoginModal">
      <template #header>
        <div class="text-2xl font-bold mb-2 text-center sm:text-left">
          Login
        </div>
      </template>
      <template #body>
        <div class="space-y-6">
          <!-- Regular Login Form -->
          <div>
            <LoginForm :loading="pickLoading" :error="loginError" @submit="handleLogin" />
          </div>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <!-- Apple Sign In -->
          <div class="flex flex-col items-center justify-center">
            <AppleSignIn @success="handleAppleSignInSuccess" @error="handleAppleSignInError" />
            <p v-if="appleSignInError" class="mt-2 text-sm text-red-600">
              {{ appleSignInError }}
            </p>
          </div>
        </div>
      </template>
    </Modal>

    <div v-else>
      <!-- Cool app loader for initial data fetch -->
      <AppLoader v-if="gameStore.loading" message="Loading your stock pick game..." :duration="2000" />

      <!-- Main content -->
      <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Winner Banner -->
        <WinnerBanner v-if="currentWeek?.winner" :winner="currentWeek.winner" :is-weekend="isWeekend" />

        <!-- Weekly Price Chart -->
        <WeeklyPriceChart v-if="currentWeek && currentWeek.picks && currentWeek.picks.length > 0" :week="currentWeek" />

        <!-- Current Week Section -->
        <div v-if="currentWeek" class="mb-12">
          <CurrentWeekSection :current-week="currentWeek" :is-authenticated="isAuthenticated"
            :pick-loading="pickLoading" :pick-error="pickError" :username="user?.username" :loading="gameStore.loading"
            @submit-pick="handleSubmitPick" @open-login="openLoginModal" />
        </div>

        <!-- Next Week Section -->
        <NextWeekSection :active-next-week="gameStore.activeNextWeek" :next-available-week="nextAvailableWeek"
          :users="users" :is-authenticated="isAuthenticated" :hide-picks="gameStore.hideNextWeekPicks"
          :next-week-pick-locked="nextAvailableWeekPickLocked" :user-next-week-pick="userNextWeekPick"
          :loading="gameStore.loading" :username="user?.username"
          @toggle-visibility="gameStore.toggleNextWeekPicksVisibility" @open-login="openLoginModal"
          @open-next-week-modal="showNextWeekModal = true" />

        <!-- Next Week Pick Modal -->
        <Modal v-if="showNextWeekModal && isAuthenticated" @close="showNextWeekModal = false">
          <template #header>
            <div class="text-xl font-bold text-center sm:text-left">
              {{ userNextWeekPick ? 'Update' : 'Make' }} Your Pick for Next Week
            </div>
            <div class="text-gray-500 text-sm text-center sm:text-left">
              {{ formatDateRange(gameStore.activeNextWeek?.startDate, gameStore.activeNextWeek?.endDate) }}
            </div>
          </template>
          <template #body>
            <div class="relative">
              <PickForm :loading="pickLoading" :error="nextWeekPickError"
                :submit-text="userNextWeekPick ? 'Update Pick' : 'Submit Pick'" @submit="handleSubmitNextWeekPick" />
            </div>
          </template>
        </Modal>

        <!-- Scoreboard
        <Scoreboard v-if="scoreboard" :scoreboard="scoreboard" :loading="gameStore.loading" />
        -->
        <!-- History Section -->
        <HistorySection :completed-weeks="completedWeeks" :loading="gameStore.loading" />
        
        <!-- Build Timestamp (temporary for debugging) -->
        <div class="mt-12 text-center">
          <div class="text-xs text-gray-400 font-mono">
            Build: {{ buildTimestamp }} | {{ buildHash }}
          </div>
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { useAuth } from '../composables/useAuth';
import { useGame } from '../composables/useGame';
import type { Week, Pick } from '../types';

// Components
import PageContainer from '../components/layout/PageContainer.vue';
import Modal from '../components/Modal.vue';
import AppLoader from '../components/ui/AppLoader.vue';
import WinnerBanner from '../components/game/WinnerBanner.vue';
import WeeklyPriceChart from '../components/game/WeeklyPriceChart.vue';
import CurrentWeekSection from '../components/game/CurrentWeekSection.vue';
import NextWeekSection from '../components/game/NextWeekSection.vue';
import HistorySection from '../components/game/HistorySection.vue';
import Scoreboard from '../components/game/Scoreboard.vue';
import LoginForm from '../components/forms/LoginForm.vue';
import PickForm from '../components/forms/PickForm.vue';
import AppleSignIn from '../components/AppleSignIn.vue';

// Props
interface Props {
  showLoginModal: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:show-login-modal': [value: boolean];
}>();

// Composables
const gameStore = useGameStore();
const { isAuthenticated, user, login } = useAuth();
const { isWeekend, formatDate, canPickCurrentWeek } = useGame();

// State
const showNextWeekModal = ref(false);
const nextWeekPickForm = ref({ symbol: '' });
const nextWeekPickError = ref('');
const pickForm = ref({ symbol: '' });
const pickError = ref('');
const loginError = ref('');
const appleSignInError = ref('');
const pickLoading = ref(false);

// Build timestamp
const buildTimestamp = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();
const buildHash = import.meta.env.VITE_BUILD_HASH || 'dev';

// Hardcoded users array
const users = [
  { id: 16, username: 'patrick' },
  { id: 17, username: 'taylor' },
  { id: 18, username: 'logan' }
];

// Computed
const currentWeek = computed(() => gameStore.currentWeek);
const scoreboard = computed(() => gameStore.scoreboard);

const nextAvailableWeek = computed(() => {
  if (!Array.isArray(gameStore.weeks) || !currentWeek.value) return null;
  return gameStore.weeks
    .filter(w => w.id !== currentWeek.value?.id)
    .sort((a, b) => b.weekNum - a.weekNum)[0] || null;
});

const userNextWeekPick = computed(() => {
  if (!isAuthenticated.value || !gameStore.activeNextWeek) return null;
  return (gameStore.activeNextWeek.picks ?? []).find(
    (p) => p.user.username?.toLowerCase().trim() === user.value?.username?.toLowerCase().trim()
  ) || null;
});

const completedWeeks = computed(() => {
  const now = new Date();
  const validUsernames = users.map(u => u.username.toLowerCase().trim());
  return (Array.isArray(gameStore.weeks) ? gameStore.weeks : [])
    .filter((w: Week) => {
      const ended = w.endDate && new Date(w.endDate) < now;
      return (ended || w.winnerId) && Array.isArray(w.picks) && w.picks.some((p: Pick) => validUsernames.includes(p.user.username?.toLowerCase().trim()));
    })
    .sort((a: Week, b: Week) => b.weekNum - a.weekNum);
});

const nextAvailableWeekPickLocked = computed(() => {
  if (!nextAvailableWeek.value) return false;
  const now = new Date();
  const week = nextAvailableWeek.value;
  const sunday = new Date(week.startDate);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return now > sunday;
});

// Methods
const formatDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return '(-)';
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
};

const handleLogin = async (username: string, password: string) => {
  try {
    loginError.value = '';
    appleSignInError.value = '';
    await login(username, password);
    closeLoginModal();
    await gameStore.fetchAll();
  } catch (error) {
    loginError.value = 'Invalid username or password';
  }
};

const handleAppleSignInSuccess = async (userData: any) => {
  try {
    loginError.value = '';
    appleSignInError.value = '';
    closeLoginModal();
    await gameStore.fetchAll();
  } catch (error) {
    loginError.value = 'Apple Sign In failed';
  }
};

const handleAppleSignInError = (error: any) => {
  console.error('Apple Sign In error:', error);
  appleSignInError.value = 'Apple Sign In failed. Please try again.';
};

const handleSubmitPick = async (symbol: string) => {
  pickError.value = '';
  try {
    pickLoading.value = true;
    await gameStore.submitPick(symbol);
    pickForm.value.symbol = '';
  } catch (err) {
    pickError.value = 'Failed to submit pick';
  } finally {
    pickLoading.value = false;
  }
};

const handleSubmitNextWeekPick = async (symbol: string) => {
  nextWeekPickError.value = '';
  if (!nextAvailableWeek.value) {
    nextWeekPickError.value = 'No next week available.';
    return;
  }
  try {
    pickLoading.value = true;
    await gameStore.submitNextWeekPick(symbol, nextAvailableWeek.value.id, user.value);
    nextWeekPickForm.value.symbol = '';
    showNextWeekModal.value = false;
    await gameStore.fetchAll();
  } catch (err) {
    nextWeekPickError.value = 'Failed to submit pick';
  } finally {
    pickLoading.value = false;
  }
};

const closeLoginModal = () => {
  emit('update:show-login-modal', false);
  loginError.value = '';
  appleSignInError.value = '';
};

const openLoginModal = () => {
  emit('update:show-login-modal', true);
};

// Lifecycle Hooks
onMounted(() => {
  gameStore.fetchAll();
});

watch(isAuthenticated, async () => {
  await gameStore.fetchAll();
});
</script>

<style>
/* Remove all scoped CSS. Use only Tailwind in the template. */
</style>