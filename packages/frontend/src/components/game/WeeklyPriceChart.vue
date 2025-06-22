<template>
  <div class="bg-gradient-to-br from-green-700 via-green-600 to-green-800 rounded-xl p-4 shadow-lg border-2 border-green-500">
    <!-- Header -->
    <div class="text-center mb-3">
      <h3 class="text-xl font-bold text-white flex items-center justify-center">
        <span class="mr-2">📈</span>
        Week {{ week?.weekNum || '?' }} Stock Performance
        <span class="ml-2">📉</span>
      </h3>
      <p class="text-green-200 text-sm">Daily Price Progress</p>
    </div>

    <!-- Chart Container -->
    <div class="bg-white/90 rounded-lg p-4 mb-4 relative" style="height: 200px;">
      <!-- Grid lines -->
      <div class="absolute inset-4 grid grid-cols-5 grid-rows-4 pointer-events-none">
        <!-- Vertical grid lines -->
        <div v-for="i in 4" :key="`v-${i}`" class="border-r border-gray-300"></div>
        <!-- Horizontal grid lines -->
        <div v-for="i in 3" :key="`h-${i}`" class="col-span-5 border-b border-gray-300"></div>
      </div>

      <!-- Y-axis labels -->
      <div class="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-600 font-semibold">
        <div>{{ maxPrice.toFixed(0) }}</div>
        <div>{{ ((maxPrice + minPrice) / 2).toFixed(0) }}</div>
        <div>{{ minPrice.toFixed(0) }}</div>
      </div>

      <!-- X-axis labels -->
      <div class="absolute bottom-0 left-4 right-4 flex justify-between text-xs text-gray-600 font-semibold">
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
      </div>

      <!-- Price lines for each player -->
      <svg class="absolute inset-4" viewBox="0 0 320 120" preserveAspectRatio="none">
        <g v-for="(line, index) in priceLines" :key="index">
          <!-- Price line -->
          <polyline
            :points="line.points"
            :stroke="line.color"
            stroke-width="3"
            fill="none"
            class="drop-shadow-sm"
          />
          <!-- Data points -->
          <circle
            v-for="(point, pointIndex) in line.dataPoints"
            :key="pointIndex"
            :cx="point.x"
            :cy="point.y"
            r="4"
            :fill="line.color"
            :stroke="line.color"
            stroke-width="2"
            class="drop-shadow-sm"
          />
        </g>
      </svg>
    </div>

    <!-- Player Legend -->
    <div class="flex justify-center space-x-4">
      <div v-for="(pick, index) in validPicks" :key="pick.user.username" 
           class="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
        <div class="flex items-center space-x-2">
          <div :class="getPlayerEmoji(index)" class="text-lg">{{ getPlayerEmoji(index) }}</div>
          <div>
            <div class="text-white font-bold text-sm">{{ pick.user.username }}</div>
            <div class="text-green-200 text-xs">{{ pick.symbol }}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-white font-bold text-sm">
            {{ formatReturn(pick.returnPercentage) }}
          </div>
          <div class="text-green-200 text-xs">final</div>
        </div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="mt-3 text-center">
      <p class="text-green-200 text-xs">
        * Prices shown are approximated daily progressions. Actual market data may vary.
      </p>
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

const validPicks = computed(() => {
  if (!props.week?.picks) return [];
  return props.week.picks.filter(pick => 
    pick.symbol && 
    pick.startPrice !== null && 
    pick.endPrice !== null &&
    pick.returnPercentage !== null
  );
});

const priceRange = computed(() => {
  const prices = validPicks.value.flatMap(pick => [pick.startPrice!, pick.endPrice!]);
  if (prices.length === 0) return { min: 0, max: 100 };
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.1;
  
  return {
    min: Math.max(0, min - padding),
    max: max + padding
  };
});

const minPrice = computed(() => priceRange.value.min);
const maxPrice = computed(() => priceRange.value.max);

const priceLines = computed(() => {
  if (validPicks.value.length === 0) return [];
  
  const colors = [
    '#ef4444', // Red
    '#3b82f6', // Blue  
    '#f59e0b', // Orange
    '#10b981', // Emerald
    '#8b5cf6', // Purple
    '#f97316', // Orange
  ];

  return validPicks.value.map((pick, index) => {
    const startPrice = pick.startPrice!;
    const endPrice = pick.endPrice!;
    const color = colors[index % colors.length];
    
    // Generate 5 data points (Monday through Friday)
    const dataPoints = [];
    const points = [];
    
    for (let day = 0; day < 5; day++) {
      // Create a realistic price progression with some volatility
      let progress = day / 4; // 0 to 1
      
      // Add some realistic market volatility
      const volatilityFactor = 0.1 + (Math.sin(day + index) * 0.05);
      const trendFactor = Math.pow(progress, 1 + volatilityFactor);
      
      const price = startPrice + (endPrice - startPrice) * trendFactor;
      
      const x = (day / 4) * 320; // 0 to 320 (width)
      const y = 120 - ((price - minPrice.value) / (maxPrice.value - minPrice.value)) * 120; // Inverted Y
      
      dataPoints.push({ x, y, price });
      points.push(`${x},${y}`);
    }
    
    return {
      color,
      points: points.join(' '),
      dataPoints,
      pick
    };
  });
});

const getPlayerEmoji = (index: number): string => {
  const emojis = ['👑', '🥈', '🥉', '⭐', '🎯', '🎮'];
  return emojis[index] || '🎲';
};

const formatReturn = (percentage: number | null | undefined): string => {
  if (percentage == null) return 'N/A';
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};
</script>

<style scoped>
/* Mario Party style animations */
@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.sparkle {
  animation: sparkle 2s ease-in-out infinite;
}
</style> 