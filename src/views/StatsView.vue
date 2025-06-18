<template>
  <div class="py-8 max-w-6xl mx-auto">
    <h1 class="text-4xl font-extrabold text-center mb-10 text-blue-900 tracking-tight">Leaderboard & Player Stats</h1>
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
      <svg class="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
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
      <!-- Player Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div v-for="user in users" :key="user.id"
          class="bg-white border-2 border-slate-200 rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <div
            class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-extrabold text-blue-700 mb-2">
            {{ user.username.slice(0, 2).toUpperCase() }}
          </div>
          <div class="text-xl font-black text-blue-900 mb-1">{{ user.username.toUpperCase() }}</div>
          <div class="text-lg font-bold text-emerald-700 mb-1">Portfolio: ${{
            stats[user.username]?.portfolioValue?.toFixed(2) }}</div>
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
          <div class="flex flex-wrap gap-2 mb-2 justify-center">
            <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold text-xs">Wins: {{
              stats[user.username]?.wins }}</span>
            <span class="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full font-bold text-xs">Picks: {{
              stats[user.username]?.totalPicks }}</span>
            <span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold text-xs">Avg Return: {{
              stats[user.username]?.avgReturn?.toFixed(2) }}%</span>
            <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold text-xs">Longest Streak: {{
              stats[user.username]?.longestStreak }}</span>
          </div>
          <div class="mb-2 w-full">
            <div class="text-xs text-slate-500">Best Pick: <span class="font-bold text-emerald-700">{{
              stats[user.username]?.bestPick?.symbol }}</span> <span v-if="stats[user.username]?.bestPick">({{
                  stats[user.username]?.bestPick?.returnPercentage?.toFixed(2) }}%)</span></div>
            <div class="text-xs text-slate-500">Worst Pick: <span class="font-bold text-rose-700">{{
              stats[user.username]?.worstPick?.symbol }}</span> <span v-if="stats[user.username]?.worstPick">({{
                  stats[user.username]?.worstPick?.returnPercentage?.toFixed(2) }}%)</span></div>
          </div>
          <div class="mb-2 w-full">
            <div class="text-xs text-slate-500">Current Streak: <span class="font-bold">{{
              stats[user.username]?.currentStreak > 0 ? stats[user.username]?.currentStreak + ' Wins' :
                stats[user.username]?.currentStreak < 0 ? Math.abs(stats[user.username]?.currentStreak) + ' Losses'
                  : '0' }}</span>
            </div>
            <div v-if="stats[user.username]?.hotCold === 'hot'"
              class="inline-flex items-center px-2 py-1 bg-emerald-200 text-emerald-800 rounded-full font-bold text-xs mt-1">
              🔥 Hot Streak</div>
            <div v-else-if="stats[user.username]?.hotCold === 'cold'"
              class="inline-flex items-center px-2 py-1 bg-rose-200 text-rose-800 rounded-full font-bold text-xs mt-1">
              ❄️ Cold Streak</div>
          </div>
          <!-- Mini Portfolio Chart -->
          <div class="w-full mt-4">
            <svg :width="180" :height="60" viewBox="0 0 180 60">
              <polyline :points="portfolioChartPoints(stats[user.username]?.portfolioHistory)" fill="none"
                stroke="#2563eb" stroke-width="3" />
              <circle v-for="(pt, idx) in stats[user.username]?.portfolioHistory" :key="idx"
                :cx="idx * (180 / (stats[user.username]?.portfolioHistory.length - 1 || 1))"
                :cy="60 - (pt / (Math.max(...stats[user.username]?.portfolioHistory || [100]) + 1) * 50) * 50" r="2.5"
                fill="#2563eb" />
            </svg>
            <div class="text-xs text-slate-400 text-center mt-1">Portfolio Value Over Time</div>
          </div>
          <!-- Collapsible Portfolio Section -->
          <button @click="togglePortfolio(user.username)"
            class="mt-4 w-full bg-blue-50 border border-blue-200 text-blue-900 font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition">
            <span>{{ openPortfolios[user.username] ? 'Hide' : 'Show' }} Portfolio</span>
            <svg :class="{ 'rotate-180': openPortfolios[user.username] }" class="w-4 h-4 transition-transform"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <transition name="fade">
            <div v-if="openPortfolios[user.username]"
              class="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto">
              <table class="min-w-full text-xs text-left">
                <thead>
                  <tr class="text-slate-700">
                    <th class="px-2 py-1">Week</th>
                    <th class="px-2 py-1">Symbol</th>
                    <th class="px-2 py-1">Entry</th>
                    <th class="px-2 py-1">Last Close</th>
                    <th class="px-2 py-1">Return %</th>
                    <th class="px-2 py-1">Win</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pick in userPortfolio(user)" :key="pick.id"
                    :class="[pick.weekWinner ? 'bg-emerald-50' : '', 'hover:bg-slate-100 transition']">
                    <td class="px-2 py-1 font-bold">{{ pick.weekNum }}</td>
                    <td class="px-2 py-1 font-black text-blue-800">{{ pick.symbol.toUpperCase() }}</td>
                    <td class="px-2 py-1">{{ pick.entryPrice }}</td>
                    <td class="px-2 py-1">{{ pick.currentValue ?? '-' }}</td>
                    <td class="px-2 py-1">
                      <span
                        :class="pick.returnPercentage > 0 ? 'bg-emerald-100 text-emerald-700' : pick.returnPercentage < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'"
                        class="font-bold px-2 py-1 rounded">
                        {{ pick.returnPercentage != null ? pick.returnPercentage.toFixed(2) + '%' : '-' }}
                      </span>
                    </td>
                    <td class="px-2 py-1">
                      <span v-if="pick.weekWinner"
                        class="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                        <svg class="w-4 h-4 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.293a1 1 0 00-1.414 0L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" />
                        </svg>
                        WIN
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </transition>
        </div>
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