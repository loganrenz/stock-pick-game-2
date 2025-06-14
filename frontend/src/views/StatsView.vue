<template>
  <div class="py-6 max-w-5xl mx-auto">
    <h1 class="text-4xl font-extrabold text-center mb-8">Player Stats</h1>
    <div v-if="loading" class="text-center text-lg">Loading stats...</div>
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div v-for="user in users" :key="user.id" class="bg-white rounded shadow p-6">
          <h2 class="text-2xl font-bold mb-2 text-center">{{ user.username }}</h2>
          <div class="mb-2 text-center">
            <span class="font-semibold">Total Wins:</span> {{ stats[user.username]?.wins || 0 }}
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Portfolio Value:</span> ${{ stats[user.username]?.portfolioValue?.toFixed(2) || '100.00' }}
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Total Return %:</span> {{ stats[user.username]?.totalReturnPct?.toFixed(2) || '0.00' }}%
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Biggest Win:</span> {{ stats[user.username]?.biggestWin?.toFixed(2) || '0.00' }}%
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Longest Win Streak:</span> {{ stats[user.username]?.longestStreak || 0 }}
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Average Return:</span> {{ stats[user.username]?.avgReturn?.toFixed(2) || '0.00' }}%
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Total Picks:</span> {{ stats[user.username]?.totalPicks || 0 }}
          </div>
        </div>
      </div>
      <div class="text-center mt-8">
        <router-link to="/" class="text-blue-600 underline">Back to Game</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const users = ref<any[]>([]);
const stats = ref<Record<string, any>>({});
const loading = ref(true);

function calculateStats(usersArr: any[], weeks: any[], picks: any[]) {
  const statsObj: Record<string, any> = {};
  for (const user of usersArr) {
    const userPicks = picks.filter((p: any) => p.userId === user.id);
    const userWins = weeks.filter((w: any) => w.winnerId === user.id).length;
    // Portfolio value: $100 per pick, fractional shares
    let portfolioValue = 0;
    let totalInvested = 0;
    let totalReturnPct = 0;
    let biggestWin = -Infinity;
    let streak = 0, maxStreak = 0;
    let lastWin = false;
    let avgReturn = 0;
    for (const pick of userPicks) {
      if (pick.priceAtPick && pick.currentPrice) {
        const shares = 100 / pick.priceAtPick;
        const value = shares * pick.currentPrice;
        portfolioValue += value;
        totalInvested += 100;
        const pct = ((pick.currentPrice - pick.priceAtPick) / pick.priceAtPick) * 100;
        totalReturnPct += pct;
        avgReturn += pct;
        if (pct > biggestWin) biggestWin = pct;
      }
    }
    avgReturn = userPicks.length ? avgReturn / userPicks.length : 0;
    // Win streaks
    for (const week of weeks.sort((a: any, b: any) => a.weekNum - b.weekNum)) {
      if (week.winnerId === user.id) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
        lastWin = true;
      } else {
        streak = 0;
        lastWin = false;
      }
    }
    statsObj[user.username] = {
      wins: userWins,
      portfolioValue: portfolioValue || 100,
      totalReturnPct: totalInvested ? (portfolioValue - totalInvested) / totalInvested * 100 : 0,
      biggestWin: biggestWin === -Infinity ? 0 : biggestWin,
      longestStreak: maxStreak,
      avgReturn,
      totalPicks: userPicks.length,
    };
  }
  return statsObj;
}

onMounted(async () => {
  loading.value = true;
  const res = await axios.get('/api/stats');
  users.value = res.data.users;
  stats.value = calculateStats(res.data.users, res.data.weeks, res.data.picks);
  loading.value = false;
});
</script>

<style scoped>
.bg-white { background: #fff; }
.rounded { border-radius: 8px; }
.shadow { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
</style> 