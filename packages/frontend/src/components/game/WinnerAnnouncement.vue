<template>
  <div v-if="winner && winner.user && winner.user.username" 
       ref="bannerRef"
       class="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-xl p-4 shadow-lg border-2 border-green-600 relative overflow-hidden">
    <!-- Winner Announcement -->
    <div class="text-center relative z-10">
      <div class="text-4xl mb-3 animate-bounce">🏆</div>
      <h2 ref="winnerNameRef" 
          class="text-3xl font-bold text-white mb-3 drop-shadow-lg">
        {{ winner.user.username.toUpperCase() }}
      </h2>
      <p class="text-lg font-bold text-green-100 mb-2">
        WINS WEEK {{ week?.weekNum || '?' }}!
      </p>
      <div class="text-base text-green-200">
        <span class="font-bold">{{ winner.symbol || 'N/A' }}</span> • 
        <span class="text-yellow-300 font-bold">{{ formatReturn(winner.returnPercentage) }}</span>
      </div>
    </div>

    <!-- Confetti Overlay positioned at winner name -->
    <ConfettiOverlay 
      :key="winner.user.username" 
      :trigger="triggerConfetti" 
      :origin-element="winnerNameRef" />

    <!-- Runner-ups -->
    <div v-if="runnerUps.length > 0" class="mt-4 flex justify-center space-x-3">
      <div v-for="(pick, index) in runnerUps" :key="pick.user?.username || index" 
           class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
        <div class="text-center">
          <div class="text-sm">{{ index === 0 ? '🥈' : '🥉' }}</div>
          <div class="text-white font-bold text-xs">{{ pick.user?.username || 'Unknown' }}</div>
          <div class="text-green-200 text-xs">{{ formatReturn(pick.returnPercentage) }}</div>
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
import { computed, ref, onMounted, nextTick, onRenderTriggered } from 'vue';
import type { Week, Pick } from '../../types';
import ConfettiOverlay from '../ui/ConfettiOverlay.vue';

interface Props {
  week?: Week | null;
}

const props = defineProps<Props>();

const bannerRef = ref(null);
const winnerNameRef = ref(null);
const triggerConfetti = ref(false);

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

// Trigger confetti when component mounts and there's a winner
onRenderTriggered(async () => {
  if (winner.value) {
    //await nextTick(); // Wait for DOM to be ready
    setTimeout(() => {
      triggerConfetti.value = true;
    }, 1); // Small delay to ensure everything is mounted
  }
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
/* Winner banner styles - confetti moved to global component */
</style> 