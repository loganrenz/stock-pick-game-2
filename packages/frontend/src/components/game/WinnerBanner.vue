<template>
    <div v-if="show" class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded">
        <div class="flex items-center">
            <div class="flex-shrink-0 mr-3">
                <svg class="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
            </div>
            <div>
                <p class="text-sm font-medium text-yellow-800">
                    🏆 <span class="font-bold">{{ winner.username }}</span> won this week!
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