<template>
  <div class="py-8 max-w-6xl mx-auto">
    <h1 class="text-4xl font-extrabold text-center mb-10 text-blue-900 tracking-tight">Player Stats</h1>
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
      <img src="/stonx-icon/icon/48x48/1x/1x.png" class="animate-spin h-12 w-12" alt="Loading..." />
    </div>
    <div v-else>
      <!-- Leaderboard Chart -->
      <LeaderboardChart :weeks="weeks" :users="users" />
      <!-- Player Cards (now as horizontal table) -->
      <div class="overflow-x-auto mb-12">
        <table class="min-w-full bg-white border-2 border-slate-200 rounded-2xl shadow-lg">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-slate-700 font-bold text-lg">Stat</th>
              <th v-for="user in users" :key="user.id" class="px-4 py-3 text-center text-blue-900 font-black text-lg">
                {{ user.username.toUpperCase() }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="px-4 py-2 font-bold text-slate-700">Avg Return</td>
              <td v-for="user in users" :key="user.id + '-avgreturn'" class="px-4 py-2 text-center">
                <span
                  :class="stats[user.username]?.avgReturn > 0 ? 'bg-emerald-100 text-emerald-700' : stats[user.username]?.avgReturn < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'"
                  class="font-bold px-2 py-1 rounded">
                  {{ stats[user.username]?.avgReturn?.toFixed(2) }}%
                </span>
              </td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-bold text-slate-700">Wins</td>
              <td v-for="user in users" :key="user.id + '-wins'" class="px-4 py-2 text-center text-blue-700 font-bold">
                {{ stats[user.username]?.wins }}
              </td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-bold text-slate-700">Picks</td>
              <td v-for="user in users" :key="user.id + '-picks'" class="px-4 py-2 text-center text-zinc-700 font-bold">
                {{ stats[user.username]?.totalPicks }}
              </td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-bold text-slate-700">Longest Streak</td>
              <td v-for="user in users" :key="user.id + '-streak'"
                class="px-4 py-2 text-center text-yellow-700 font-bold">
                {{ stats[user.username]?.longestStreak }}
              </td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-bold text-slate-700">Current Streak</td>
              <td v-for="user in users" :key="user.id + '-curstreak'" class="px-4 py-2 text-center font-bold">
                <span v-if="stats[user.username]?.currentStreak > 0">{{ stats[user.username]?.currentStreak }}
                  Wins</span>
                <span v-else-if="stats[user.username]?.currentStreak < 0">{{
                  Math.abs(stats[user.username]?.currentStreak) }} Losses</span>
                <span v-else>0</span>
                <span v-if="stats[user.username]?.hotCold === 'hot'"
                  class="ml-2 bg-emerald-200 text-emerald-800 rounded-full px-2 py-1 text-xs font-bold">🔥 Hot</span>
                <span v-else-if="stats[user.username]?.hotCold === 'cold'"
                  class="ml-2 bg-rose-200 text-rose-800 rounded-full px-2 py-1 text-xs font-bold">❄️ Cold</span>
              </td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-bold text-slate-700">Best Pick</td>
              <td v-for="user in users" :key="user.id + '-best'" class="px-4 py-2 text-center">
                <span class="font-bold text-emerald-700">{{ stats[user.username]?.bestPick?.symbol }}</span>
                <span v-if="stats[user.username]?.bestPick"> ({{
                  stats[user.username]?.bestPick?.returnPercentage?.toFixed(2) }}%)</span>
              </td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-bold text-slate-700">Worst Pick</td>
              <td v-for="user in users" :key="user.id + '-worst'" class="px-4 py-2 text-center">
                <span class="font-bold text-rose-700">{{ stats[user.username]?.worstPick?.symbol }}</span>
                <span v-if="stats[user.username]?.worstPick"> ({{
                  stats[user.username]?.worstPick?.returnPercentage?.toFixed(2) }}%)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="text-center mt-8">
        <router-link to="/" class="text-blue-600 underline text-lg font-bold">
          Back to Game
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../utils/axios.js';
import LeaderboardChart from '../components/game/LeaderboardChart.vue';

const users = ref<any[]>([]);
const weeks = ref<any[]>([]);
const stats = ref<Record<string, any>>({});
const loading = ref(true);
const playerNames = ['patrick', 'taylor', 'logan'];

function calculateStats(usersArr: any[], weeks: any[], picks: any[]) {
  const statsObj: Record<string, any> = {};

  const sortedWeeks = [...weeks].sort((a, b) => a.weekNum - b.weekNum);

  for (const user of usersArr) {
    const userPicks = (Array.isArray(picks) ? picks : []).filter((p: any) => p.userId === user.id);
    const userWins = (Array.isArray(weeks) ? weeks : []).filter((w: any) => w.winnerId === user.id).length;

    let bestPick = null;
    let worstPick = null;

    const picksByWeek = sortedWeeks.map(week => userPicks.find(p => p.weekId === week.id)).filter(Boolean);

    for (const pick of picksByWeek) {
      if (pick.returnPercentage != null) {
        if (!bestPick || pick.returnPercentage > bestPick.returnPercentage) {
          bestPick = pick;
        }
        if (!worstPick || pick.returnPercentage < worstPick.returnPercentage) {
          worstPick = pick;
        }
      }
    }

    // Streak calculation
    const userWeeks = sortedWeeks.filter(w => userPicks.some(p => p.weekId === w.id));

    let longestWinStreak = 0;
    let currentWinStreak = 0;
    for (const week of userWeeks) {
      if (week.winnerId === user.id) {
        currentWinStreak++;
      } else {
        if (currentWinStreak > longestWinStreak) {
          longestWinStreak = currentWinStreak;
        }
        currentWinStreak = 0;
      }
    }
    if (currentWinStreak > longestWinStreak) {
      longestWinStreak = currentWinStreak;
    }

    // Current streak calculation (from most recent week backwards)
    let currentStreak = 0;
    const reversedUserWeeks = [...userWeeks].reverse();
    const lastWeekResult = reversedUserWeeks.length > 0 && reversedUserWeeks[0].winnerId === user.id;

    for (const week of reversedUserWeeks) {
      const wonWeek = week.winnerId === user.id;
      if (wonWeek === lastWeekResult) {
        currentStreak++;
      } else {
        break; // Streak is broken
      }
    }

    if (!lastWeekResult && currentStreak > 0) {
      currentStreak = -currentStreak;
    }

    const avgReturn = picksByWeek.length > 0 ? picksByWeek.reduce((acc, p) => acc + (p.returnPercentage || 0), 0) / picksByWeek.length : 0;

    statsObj[user.username] = {
      wins: userWins,
      bestPick,
      worstPick,
      longestStreak: longestWinStreak,
      avgReturn,
      totalPicks: userPicks.length,
      currentStreak,
      hotCold: currentStreak >= 3 ? 'hot' : currentStreak <= -3 ? 'cold' : null,
    };
  }
  return statsObj;
}

const leaderboard = computed(() => {
  return [...users.value].sort((a, b) => (stats.value[b.username]?.wins || 0) - (stats.value[a.username]?.wins || 0));
});

onMounted(async () => {
  loading.value = true;
  const res = await api.get('/stats');
  users.value = Array.isArray(res.data.users) ? res.data.users.filter((u: any) => playerNames.includes(u.username.toLowerCase())) : [];
  weeks.value = Array.isArray(res.data.weeks) ? res.data.weeks : [];
  stats.value = calculateStats(users.value, res.data.weeks, res.data.picks);
  loading.value = false;
});
</script>

<style>
/* Remove all scoped CSS. Use only Tailwind in the template. */
.fade-enter-active,
.fade-leave-active {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.fade-enter-from,
.fade-leave-to {
  max-height: 0;
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>