<template>
  <div v-if="winner && winner.user && winner.user.username" class="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl p-6 shadow-lg border-2 border-yellow-500 relative overflow-hidden">
    <!-- Confetti -->
    <div class="absolute inset-0 pointer-events-none">
      <div v-for="i in 20" :key="i" 
           class="confetti absolute animate-bounce"
           :style="{ 
             left: Math.random() * 100 + '%', 
             top: Math.random() * 100 + '%',
             animationDelay: Math.random() * 2 + 's',
             animationDuration: (2 + Math.random() * 2) + 's'
           }">
        {{ ['🎉', '🎊', '⭐', '🏆', '✨'][Math.floor(Math.random() * 5)] }}
      </div>
    </div>

    <!-- Winner Announcement -->
    <div class="text-center relative z-10">
      <div class="text-6xl mb-4 animate-bounce">🏆</div>
      <h2 class="text-5xl font-black text-white mb-4 shake-animation drop-shadow-lg">
        {{ winner.user.username.toUpperCase() }}
      </h2>
      <p class="text-2xl font-bold text-yellow-100 mb-2">
        WINS WEEK {{ week?.weekNum || '?' }}!
      </p>
      <div class="text-xl text-yellow-200">
        <span class="font-bold">{{ winner.symbol || 'N/A' }}</span> • 
        <span class="text-green-300 font-bold">{{ formatReturn(winner.returnPercentage) }}</span>
      </div>
    </div>

    <!-- Runner-ups -->
    <div v-if="runnerUps.length > 0" class="mt-6 flex justify-center space-x-4">
      <div v-for="(pick, index) in runnerUps" :key="pick.user?.username || index" 
           class="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
        <div class="text-center">
          <div class="text-lg">{{ index === 0 ? '🥈' : '🥉' }}</div>
          <div class="text-white font-bold text-sm">{{ pick.user?.username || 'Unknown' }}</div>
          <div class="text-yellow-200 text-xs">{{ formatReturn(pick.returnPercentage) }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- No winner yet -->
  <div v-else class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-100">
    <div class="text-center">
      <div class="text-4xl mb-3">⏳</div>
      <h3 class="text-2xl font-bold text-slate-900 mb-2">Week {{ week?.weekNum || '?' }} In Progress</h3>
      <p v-if="!week?.picks?.length" class="text-slate-600">No picks have been made yet!</p>
      <p v-else-if="hasIncompletePicks" class="text-slate-600">Results pending - winner will be announced when the week ends!</p>
      <p v-else class="text-slate-600">Winner will be announced when the week ends!</p>
      
      <!-- Current picks -->
      <div v-if="week?.picks?.length > 0" class="mt-4 flex justify-center space-x-3 flex-wrap gap-2">
        <div v-for="pick in week.picks" :key="pick.user?.username || pick.id"
             class="bg-white rounded-lg px-3 py-2 shadow-sm">
          <div class="text-center">
            <div class="font-bold text-slate-900 text-sm">{{ pick.user?.username || 'Unknown' }}</div>
            <div class="text-blue-600 text-xs">{{ pick.symbol || 'N/A' }}</div>
            <div v-if="pick.returnPercentage !== null && pick.returnPercentage !== undefined" 
                 class="text-xs font-medium" 
                 :class="pick.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatReturn(pick.returnPercentage) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Week, Pick } from '../../types';

interface Props {
  week?: Week | null;
}

const props = defineProps<Props>();

const winner = computed(() => {
  if (!props.week?.picks?.length) return null;
  
  // Find the pick with the highest return percentage
  const validPicks = props.week.picks.filter(pick => 
    pick && 
    pick.user && 
    pick.user.username &&
    pick.symbol &&
    pick.returnPercentage !== null && 
    pick.returnPercentage !== undefined &&
    typeof pick.returnPercentage === 'number' &&
    !isNaN(pick.returnPercentage)
  );
  
  if (validPicks.length === 0) return null;
  
  return validPicks.reduce((prev, current) => 
    current.returnPercentage! > prev.returnPercentage! ? current : prev
  );
});

const runnerUps = computed(() => {
  if (!props.week?.picks?.length || !winner.value) return [];
  
  const validPicks = props.week.picks.filter(pick => 
    pick &&
    pick.user && 
    pick.user.username &&
    pick.returnPercentage !== null && 
    pick.returnPercentage !== undefined &&
    typeof pick.returnPercentage === 'number' &&
    !isNaN(pick.returnPercentage) &&
    pick.user.username !== winner.value?.user?.username
  );
  
  return validPicks
    .sort((a, b) => b.returnPercentage! - a.returnPercentage!)
    .slice(0, 2); // Top 2 runner-ups
});

const hasIncompletePicks = computed(() => {
  if (!props.week?.picks?.length) return false;
  
  // Check if there are picks but some don't have return percentages
  return props.week.picks.some(pick => 
    pick && 
    pick.user && 
    pick.symbol &&
    (pick.returnPercentage === null || pick.returnPercentage === undefined)
  );
});

const formatReturn = (percentage: number | null | undefined): string => {
  if (percentage == null) return 'N/A';
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
  20%, 40%, 60%, 80% { transform: translateX(3px); }
}

@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}

.shake-animation {
  animation: shake 0.6s ease-in-out infinite;
}

.confetti {
  font-size: 1.5rem;
  animation: confetti-fall linear infinite;
}
</style> 