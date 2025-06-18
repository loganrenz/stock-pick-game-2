<template>
  <div class="py-8 max-w-6xl mx-auto">
    <h1 class="text-4xl font-extrabold text-center mb-10 text-blue-900 tracking-tight">Leaderboard & Player Stats</h1>
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
      <svg class="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 198" fill="none">
        <path fill="#41B883" d="M204.8 0H256L128 220.8L0 0h97.92L128 51.2L157.44 0h47.36Z" />
        <path fill="#41B883" d="m0 0l128 220.8L256 0h-51.2L128 132.48L50.56 0H0Z" />
        <path fill="#35495E" d="M50.56 0L128 133.12L204.8 0h-47.36L128 51.2L97.92 0H50.56Z" />
      </svg>
    </div>
    <div v-else>
      <!-- Leaderboard -->
      <div class="mb-12">
        <h2 class="text-2xl font-bold text-slate-800 mb-4">🏆 Portfolio Value Leaderboard</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="user in leaderboard" :key="user.id"
            class="bg-white border-2 border-blue-200 rounded-2xl shadow-lg p-6 flex flex-col items-center">
            <div
              class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-extrabold text-blue-700 mb-2">
              {{ user.username.slice(0, 2).toUpperCase() }}
            </div>
            <div class="text-xl font-black text-blue-900 mb-1">{{ user.username.toUpperCase() }}</div>
            <div class="text-lg font-bold text-emerald-700 mb-1">${{ stats[user.username]?.portfolioValue?.toFixed(2) }}
            </div>
            <div class="text-xs text-slate-500 mb-2">Total Invested: ${{ stats[user.username]?.totalInvested?.toFixed(2)
            }}</div>
            <div class="flex space-x-2 mb-2">
              <span v-if="stats[user.username]?.totalReturnPct > 0"
                class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold text-xs">+{{
                  stats[user.username]?.totalReturnPct?.toFixed(2) }}%</span>
              <span v-else-if="stats[user.username]?.totalReturnPct < 0"
                class="bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-bold text-xs">{{
                  stats[user.username]?.totalReturnPct?.toFixed(2) }}%</span>
              <span v-else class="bg-slate-200 text-slate-700 px-2 py-1 rounded-full font-bold text-xs">0.00%</span>
            </div>
            <div class="flex space-x-2">
              <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold text-xs">Wins: {{
                stats[user.username]?.wins }}</span>
              <span class="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full font-bold text-xs">Picks: {{
                stats[user.username]?.totalPicks }}</span>
            </div>
          </div>
        </div>
      </div>
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
              <td class="px-4 py-2 font-bold text-slate-700">Portfolio</td>
              <td v-for="user in users" :key="user.id + '-portfolio'"
                class="px-4 py-2 text-center text-emerald-700 font-bold">
                ${{ stats[user.username]?.portfolioValue?.toFixed(2) }}
              </td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-bold text-slate-700">Total Invested</td>
              <td v-for="user in users" :key="user.id + '-invested'" class="px-4 py-2 text-center text-slate-700">
                ${{ stats[user.username]?.totalInvested?.toFixed(2) }}
              </td>
            </tr>
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
import axios from 'axios';

const users = ref<any[]>([]);
const stats = ref<Record<string, any>>({});
const loading = ref(true);
const allWeeks = ref<any[]>([]);
const allPicks = ref<any[]>([]);
const playerNames = ['patrick', 'taylor', 'logan'];
const openPortfolios = ref<Record<string, boolean>>({});

function calculateStats(usersArr: any[], weeks: any[], picks: any[]) {
  const statsObj: Record<string, any> = {};
  for (const user of usersArr) {
    const userPicks = (Array.isArray(picks) ? picks : []).filter((p: any) => p.userId === user.id);
    const userWins = (Array.isArray(weeks) ? weeks : []).filter((w: any) => w.winnerId === user.id).length;
    // Portfolio simulation: $100 per pick, fractional shares, track value over time
    let portfolioValue = 0;
    let totalInvested = 0;
    let biggestWin = -Infinity;
    let worstPick = null;
    let bestPick = null;
    let streak = 0, maxStreak = 0, currentStreak = 0;
    let lastWin = false;
    let avgReturn = 0;
    let portfolioHistory: number[] = [];
    let runningValue = 0;
    let runningInvested = 0;
    // Sort picks by week
    const picksByWeek = weeks.map(week => userPicks.find(p => p.weekId === week.id)).filter(Boolean);
    for (const pick of picksByWeek) {
      if (pick.entryPrice && pick.currentValue) {
        const shares = 100 / pick.entryPrice;
        const value = shares * pick.currentValue;
        runningValue += value;
        runningInvested += 100;
        portfolioHistory.push(runningValue);
        portfolioValue += value;
        totalInvested += 100;
        const pct = ((pick.currentValue - pick.entryPrice) / pick.entryPrice) * 100;
        avgReturn += pct;
        if (pct > biggestWin || bestPick === null) { bestPick = pick; biggestWin = pct; }
        if (worstPick === null || pct < ((worstPick.currentValue - worstPick.entryPrice) / worstPick.entryPrice) * 100) {
          worstPick = pick;
        }
      }
    }
    avgReturn = picksByWeek.length ? avgReturn / picksByWeek.length : 0;
    // Win streaks
    for (const week of weeks.sort((a: any, b: any) => a.weekNum - b.weekNum)) {
      const pick = userPicks.find((p: any) => p.weekId === week.id);
      if (week.winnerId === user.id && pick) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
        lastWin = true;
        currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
      } else if (pick) {
        streak = 0;
        currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
      }
    }
    statsObj[user.username] = {
      wins: userWins,
      portfolioValue: portfolioValue || 100,
      totalInvested: totalInvested,
      totalReturnPct: totalInvested ? (portfolioValue - totalInvested) / totalInvested * 100 : 0,
      biggestWin: bestPick ? ((bestPick.currentValue - bestPick.entryPrice) / bestPick.entryPrice) * 100 : 0,
      bestPick,
      worstPick,
      longestStreak: maxStreak,
      avgReturn,
      totalPicks: userPicks.length,
      currentStreak,
      hotCold: currentStreak >= 3 ? 'hot' : currentStreak <= -3 ? 'cold' : null,
      portfolioHistory: portfolioHistory.length ? portfolioHistory : [100],
    };
  }
  return statsObj;
}

const leaderboard = computed(() => {
  return [...users.value].sort((a, b) => (stats.value[b.username]?.portfolioValue || 0) - (stats.value[a.username]?.portfolioValue || 0));
});

function portfolioChartPoints(history: number[] = []) {
  if (!history.length) return '';
  const max = Math.max(...history);
  return history.map((v, i) => `${i * (180 / (history.length - 1 || 1))},${60 - (v / (max + 1) * 50) * 0.9}`).join(' ');
}

function userPortfolio(user: any) {
  return allPicks.value
    .filter((p: any) => p.userId === user.id)
    .map((pick: any) => {
      const week = allWeeks.value.find((w: any) => w.id === pick.weekId);
      return {
        ...pick,
        weekNum: week?.weekNum,
        weekWinner: week?.winnerId === user.id
      };
    })
    .sort((a, b) => (a.weekNum ?? 0) - (b.weekNum ?? 0));
}

function togglePortfolio(username: string) {
  openPortfolios.value[username] = !openPortfolios.value[username];
}

onMounted(async () => {
  loading.value = true;
  const res = await axios.get('/api/stats');
  users.value = Array.isArray(res.data.users) ? res.data.users.filter((u: any) => playerNames.includes(u.username.toLowerCase())) : [];
  stats.value = calculateStats(users.value, res.data.weeks, res.data.picks);
  allWeeks.value = res.data.weeks;
  allPicks.value = Array.isArray(res.data.picks) ? res.data.picks.filter((p: any) => users.value.some(u => u.id === p.userId)) : [];
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