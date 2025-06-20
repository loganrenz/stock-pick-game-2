<template>
    <div class="mt-12">
        <h2 class="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">History</h2>

        <!-- Loading state -->
        <div v-if="loading" class="space-y-8">
            <div v-for="i in 3" :key="i" class="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
                <SkeletonLoader type="week-header" />
                <div class="px-6 py-5">
                    <div class="space-y-3">
                        <SkeletonLoader v-for="j in 3" :key="j" type="table-row" />
                    </div>
                </div>
            </div>
        </div>

        <!-- No history -->
        <div v-else-if="completedWeeks.length === 0"
            class="text-center py-12 bg-blue-50 rounded-xl border border-blue-100">
            <p class="text-blue-800 font-medium">No completed weeks yet</p>
        </div>

        <!-- History List -->
        <div v-else class="space-y-8">
            <div v-for="week in completedWeeks" :key="week.id"
                class="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
                <WeekHeader :week-num="week.weekNum" :start-date="week.startDate" :end-date="week.endDate"
                    :winner="getWinner(week)" :picks="week.picks" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Week, User } from '../../types';
import WeekHeader from './WeekHeader.vue';
import SkeletonLoader from '../ui/SkeletonLoader.vue';

interface Props {
    completedWeeks: Week[];
    loading: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    completedWeeks: () => []
});

const getWinner = (week: Week): User | null => {
    if (!week.winnerId || !week.picks) return null;
    const winningPick = week.picks.find(pick => pick.user.id === week.winnerId);
    return winningPick?.user || null;
};
</script>