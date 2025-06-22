<template>
  <div class="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-6 shadow-2xl mb-8">
    <!-- Header -->
    <div class="text-center mb-6">
      <h2 class="text-3xl font-bold text-white mb-2 flex items-center justify-center">
        <span class="mr-2">🏆</span>
        LEADERBOARD
        <span class="ml-2">🏆</span>
      </h2>
      <p class="text-blue-200">Overall Tournament Standings</p>
    </div>

    <!-- Podium for top 3 -->
    <div class="flex justify-center items-end mb-8 space-x-4">
      <!-- 2nd Place -->
      <div v-if="standings[1]" class="text-center">
        <div class="bg-gray-300 rounded-t-lg px-4 py-8 mb-2 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-t from-gray-400 to-gray-200"></div>
          <div class="relative z-10">
            <div class="text-4xl mb-2">🥈</div>
            <div class="text-lg font-bold text-gray-800">{{ standings[1].username }}</div>
            <div class="text-sm text-gray-600">{{ standings[1].totalWins }} wins</div>
          </div>
        </div>
        <div class="bg-gray-400 text-white text-xl font-bold py-2 px-4 rounded-b-lg">
          2nd
        </div>
      </div>

      <!-- 1st Place (highest) -->
      <div v-if="standings[0]" class="text-center">
        <div class="bg-yellow-300 rounded-t-lg px-4 py-12 mb-2 relative overflow-hidden animate-pulse">
          <div class="absolute inset-0 bg-gradient-to-t from-yellow-500 to-yellow-200"></div>
          <div class="relative z-10">
            <div class="text-5xl mb-2 animate-bounce">👑</div>
            <div class="text-xl font-bold text-yellow-900">{{ standings[0].username }}</div>
            <div class="text-sm text-yellow-700">{{ standings[0].totalWins }} wins</div>
          </div>
        </div>
        <div class="bg-yellow-500 text-white text-2xl font-bold py-3 px-6 rounded-b-lg">
          1st
        </div>
      </div>

      <!-- 3rd Place -->
      <div v-if="standings[2]" class="text-center">
        <div class="bg-orange-300 rounded-t-lg px-4 py-6 mb-2 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-t from-orange-400 to-orange-200"></div>
          <div class="relative z-10">
            <div class="text-3xl mb-2">🥉</div>
            <div class="text-lg font-bold text-orange-800">{{ standings[2].username }}</div>
            <div class="text-sm text-orange-600">{{ standings[2].totalWins }} wins</div>
          </div>
        </div>
        <div class="bg-orange-500 text-white text-xl font-bold py-2 px-4 rounded-b-lg">
          3rd
        </div>
      </div>
    </div>

    <!-- Progress bars for all players -->
    <div class="space-y-3">
      <div v-for="(player, index) in standings" :key="player.username" 
           class="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-3">
            <div class="text-2xl">{{ getPlayerEmoji(index) }}</div>
            <div>
              <div class="font-bold text-white">{{ player.username }}</div>
              <div class="text-sm text-blue-200">{{ player.totalWins }} victories</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-white">{{ player.winRate }}%</div>
            <div class="text-xs text-blue-200">win rate</div>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            class="h-full rounded-full transition-all duration-1000 ease-out"
            :class="getProgressBarColor(index)"
            :style="{ width: `${Math.max(player.winRate, 5)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Fun stats -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
        <div class="text-2xl mb-1">🔥</div>
        <div class="text-sm text-blue-200">Most Wins</div>
        <div class="font-bold text-white">{{ mostWinsPlayer?.username || 'TBD' }}</div>
      </div>
      <div class="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
        <div class="text-2xl mb-1">📈</div>
        <div class="text-sm text-blue-200">Best Win Rate</div>
        <div class="font-bold text-white">{{ bestRatePlayer?.username || 'TBD' }}</div>
      </div>
      <div class="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
        <div class="text-2xl mb-1">⚡</div>
        <div class="text-sm text-blue-200">Total Weeks</div>
        <div class="font-bold text-white">{{ totalWeeks }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Week, Pick } from '../../types';

interface Props {
  weeks?: Week[];
  users: Array<{ id: number; username: string }>;
}

const props = defineProps<Props>();

const standings = computed(() => {
  const userStats = props.users.map(user => {
    const userWins = (props.weeks || []).filter(week => 
      week.winnerId === user.id
    ).length;
    
    const totalCompletedWeeks = (props.weeks || []).filter(week => week.winnerId).length;
    const winRate = totalCompletedWeeks > 0 ? Math.round((userWins / totalCompletedWeeks) * 100) : 0;
    
    return {
      username: user.username,
      totalWins: userWins,
      winRate: winRate
    };
  });

  return userStats.sort((a, b) => {
    if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
    return b.winRate - a.winRate;
  });
});

const mostWinsPlayer = computed(() => {
  return standings.value.reduce((prev, current) => 
    current.totalWins > prev.totalWins ? current : prev
  );
});

const bestRatePlayer = computed(() => {
  return standings.value.reduce((prev, current) => 
    current.winRate > prev.winRate ? current : prev
  );
});

const totalWeeks = computed(() => {
  return (props.weeks || []).filter(week => week.winnerId).length;
});

const getPlayerEmoji = (index: number): string => {
  const emojis = ['👑', '🥈', '🥉', '🎯', '⭐', '🎮'];
  return emojis[index] || '🎲';
};

const getProgressBarColor = (index: number): string => {
  const colors = [
    'bg-gradient-to-r from-yellow-400 to-yellow-600', // 1st - Gold
    'bg-gradient-to-r from-gray-300 to-gray-500',     // 2nd - Silver  
    'bg-gradient-to-r from-orange-400 to-orange-600', // 3rd - Bronze
    'bg-gradient-to-r from-blue-400 to-blue-600',     // 4th - Blue
    'bg-gradient-to-r from-green-400 to-green-600',   // 5th - Green
    'bg-gradient-to-r from-purple-400 to-purple-600', // 6th - Purple
  ];
  return colors[index] || 'bg-gradient-to-r from-gray-400 to-gray-600';
};
</script>

<style scoped>
@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.6); }
}

.glow {
  animation: glow 2s ease-in-out infinite;
}
</style> 