<template>
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100">
        <!-- Current Week Header -->
        <div class="mb-6 text-center">
            <h2 class="text-3xl font-bold text-slate-900 mb-2">{{ isWeekend ? 'This Week' : 'Current Week' }}</h2>
            <div class="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
        </div>

        <!-- Current Week -->
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <WeekHeader :week-num="currentWeek?.weekNum || 0" :start-date="currentWeek?.startDate || ''"
                :end-date="currentWeek?.endDate || ''" :picks="currentWeek?.picks || []" :is-current="true" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WeekHeader from './WeekHeader.vue';
import PickForm from '../forms/PickForm.vue';
import { useGame } from '../../composables/useGame';

interface Props {
    currentWeek: any;
    loading: boolean;
    isAuthenticated: boolean;
    pickLoading: boolean;
    pickError: string | null;
    username: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    pickError: null,
    username: null
});

const emit = defineEmits<{
    (e: 'submit', symbol: string): void;
}>();

const { orderPicksByReturn, isWeekend } = useGame();

const canPick = computed(() => {
    if (!props.currentWeek?.picks) return true;
    return !props.currentWeek.picks.some((pick: any) => pick.user.username === props.username);
});

const handlePickSubmit = (symbol: string) => {
    emit('submit', symbol);
};
</script>