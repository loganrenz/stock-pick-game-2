<template>
  <div class="py-6 max-w-5xl mx-auto">
    <h1 class="text-4xl font-extrabold text-center mb-8">Player Stats</h1>
    <div v-if="loading" class="text-center text-lg">Loading stats...</div>
    <div v-else>
      <div class="mb-4 text-center text-gray-500">
        Debug: {{ users.length }} users, {{ allWeeks.length }} weeks, {{ allPicks.length }} picks
      </div>
      <div v-if="users.length === 0 || allWeeks.length === 0 || allPicks.length === 0"
        class="text-center text-red-500 mb-8">
        No stats data available. Make sure there are completed weeks and picks for Patrick, Taylor, or Logan.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div v-for="user in users" :key="user.id" class="bg-white rounded shadow p-6">
          <h2 class="text-2xl font-bold mb-2 text-center">{{ user.username }}</h2>
          <div class="mb-2 text-center">
            <span class="font-semibold">Total Wins:</span> {{ stats[user.username]?.wins || 0 }}
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Portfolio Value:</span> ${{ stats[user.username]?.portfolioValue?.toFixed(2) ||
              '100.00' }}
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Total Return %:</span> {{ stats[user.username]?.totalReturnPct?.toFixed(2) ||
              '0.00' }}%
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Biggest Win:</span> {{ stats[user.username]?.biggestWin?.toFixed(2) || '0.00'
            }}%
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Longest Win Streak:</span> {{ stats[user.username]?.longestStreak || 0 }}
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Average Return:</span> {{ stats[user.username]?.avgReturn?.toFixed(2) || '0.00'
            }}%
          </div>
          <div class="mb-2 text-center">
            <span class="font-semibold">Total Picks:</span> {{ stats[user.username]?.totalPicks || 0 }}
          </div>
        </div>
      </div>
      <!-- Detailed week-by-week stats table -->
      <div class="overflow-x-auto bg-white rounded shadow p-6 mb-8">
        <table class="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th class="px-2 py-1">User</th>
              <th class="px-2 py-1">Week</th>
              <th class="px-2 py-1">Pick</th>
              <th class="px-2 py-1">Return %</th>
              <th class="px-2 py-1">Win?</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id + '-rows'">
              <template v-for="pick in allPicksForUser(user)" :key="user.id + '-' + pick.weekNum">
            <tr>
              <td class="px-2 py-1">{{ user.username }}</td>
              <td class="px-2 py-1">{{ pick.weekNum }}</td>
              <td class="px-2 py-1">{{ pick.symbol }}</td>
              <td class="px-2 py-1">{{ typeof pick.weekReturnPct === 'number' ? pick.weekReturnPct.toFixed(2) + '%' :
                'N/A' }}</td>
              <td class="px-2 py-1">
                <span v-if="pick.isWinner"
                  class="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Win</span>
                <span v-else class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">-</span>
              </td>
            </tr>
</template>
</tr>
</tbody>
</table>
</div>
<div class="text-center mt-8">
  <router-link to="/" class="text-blue-600 underline">Back to Game</router-link>
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

function calculateStats(usersArr: any[], weeks: any[], picks: any[]) {
  const statsObj: Record<string, any> = {};
  for (const user of usersArr) {
    const userPicks = (Array.isArray(picks) ? picks : []).filter((p: any) => p.userId === user.id);
    const userWins = (Array.isArray(weeks) ? weeks : []).filter((w: any) => w.winnerId === user.id).length;
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

function allPicksForUser(user: any) {
  // Return an array of picks for this user, with weekNum and isWinner
  return allWeeks.value.map(week => {
    const pick = allPicks.value.find(p => p.userId === user.id && p.weekId === week.id) || {};
    return {
      weekNum: week.weekNum,
      symbol: pick.symbol || '-',
      weekReturnPct: pick.weekReturnPct,
      isWinner: week.winnerId === user.id
    };
  });
}

const allStatRows = computed(() => {
  // Returns an array of { username, weekNum, symbol, weekReturnPct, isWinner }
  const rows: any[] = [];
  users.value.forEach(user => {
    allWeeks.value.forEach(week => {
      const pick = allPicks.value.find(p => p.userId === user.id && p.weekId === week.id) || {};
      rows.push({
        username: user.username,
        weekNum: week.weekNum,
        symbol: pick.symbol || '-',
        weekReturnPct: pick.weekReturnPct,
        isWinner: week.winnerId === user.id
      });
    });
  });
  return rows;
});

onMounted(async () => {
  loading.value = true;
  const res = await axios.get('/api/stats');
  users.value = Array.isArray(res.data.users) ? res.data.users.filter((u: any) => playerNames.includes(u.username.toLowerCase())) : [];
  stats.value = calculateStats(users.value, res.data.weeks, res.data.picks);
  allWeeks.value = res.data.weeks;
  allPicks.value = Array.isArray(res.data.picks) ? res.data.picks.filter((p: any) => playerNames.includes(p.user.username.toLowerCase())) : [];
  loading.value = false;
});
</script>

<style scoped>
.bg-white {
  background: #fff;
}

.rounded {
  border-radius: 8px;
}

.shadow {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.25rem;
}

th {
  background: #f3f4f6;
  font-weight: 700;
}
</style>