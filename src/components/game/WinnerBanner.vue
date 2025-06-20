<template>
    <div v-if="winner" class="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <p class="text-sm leading-5 text-green-700">
                    Congratulations to <span class="font-bold">{{ winner.username }}</span> for winning this week!
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

const show = computed(() => props.isWeekend && props.winner);
</script>

<style scoped>
.winner-banner {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2.5rem;
}
</style>