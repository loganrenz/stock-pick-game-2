<template>
    <div v-if="show" class="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 border-l-4 border-yellow-700 p-6 mb-8 rounded-lg shadow-lg">
        <!-- Celebration background elements -->
        <div class="absolute inset-0 opacity-20">
            <div class="animate-bounce absolute top-2 left-4 text-2xl">🎉</div>
            <div class="animate-bounce absolute top-3 right-4 text-2xl" style="animation-delay: 0.5s;">🏆</div>
            <div class="animate-bounce absolute bottom-2 left-12 text-xl" style="animation-delay: 1s;">⭐</div>
            <div class="animate-bounce absolute bottom-3 right-12 text-xl" style="animation-delay: 1.5s;">🎊</div>
        </div>
        
        <div class="relative z-10 flex items-center">
            <div class="flex-shrink-0 mr-4">
                <div class="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center animate-pulse">
                    <svg class="h-8 w-8 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                </div>
            </div>
            <div class="flex-1">
                <h2 class="text-2xl font-bold text-white mb-2 animate-pulse">
                    🎊 WEEK CHAMPION! 🎊
                </h2>
                <p class="text-xl text-yellow-100 font-semibold">
                    Congratulations to <span class="font-bold text-white bg-yellow-800 px-3 py-1 rounded-full">{{ winner.username }}</span> 
                    for conquering this week's stock picks!
                </p>
                <p class="text-yellow-200 mt-2 text-sm">
                    {{ isWeekend ? "🎉 Celebrate all weekend long! 🎉" : "Victory achieved!" }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { User } from '../../types';

interface Props {
    winner?: {
        username: string;
    } | null;
    isWeekend?: boolean;
}

const props = defineProps<Props>();

const show = computed(() => props.winner && (props.isWeekend || new Date().getDay() === 0 || new Date().getDay() === 6));
</script>

<style scoped>
@keyframes celebration {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.celebrate {
    animation: celebration 2s ease-in-out infinite;
}
</style>