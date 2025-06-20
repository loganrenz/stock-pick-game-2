<template>
    <div :class="cardClasses">
        <div class="flex items-center justify-between mb-3">
            <h4 class="text-base font-extrabold text-slate-800 tracking-wide">
                {{ pick.user.username.toUpperCase() }}
            </h4>
            <span v-if="isWinner"
                class="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-extrabold tracking-wide shadow-sm flex items-center gap-1">
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd" />
                </svg>
                <span>WINNER</span>
            </span>
        </div>
        <div class="text-sm text-slate-700">
            <p class="mb-3">
                <span class="block text-4xl font-black text-slate-900 tracking-tight">
                    {{ pick.symbol.toUpperCase() }}
                </span>
            </p>
            <div v-if="loading" class="space-y-2 bg-slate-50 p-3 rounded-lg">
                <p class="text-center text-slate-500">Loading prices...</p>
            </div>
            <div v-else class="space-y-2 bg-slate-50 p-3 rounded-lg">
                <p class="flex justify-between items-center">
                    <span class="text-slate-600">Entry Price:</span>
                    <span class="font-bold">${{ formatPrice(localPick.entryPrice) }}</span>
                </p>
                <p class="flex justify-between items-center">
                    <span class="text-slate-600">Final Price:</span>
                    <span class="font-bold">${{ formatPrice(localPick.currentValue) }}</span>
                </p>
                <p class="flex justify-between items-center">
                    <span class="text-slate-600">Return ($):</span>
                    <span class="font-bold" :class="returnClasses(true)">
                        {{ formatDollarReturn(localPick.entryPrice, localPick.currentValue) }}
                    </span>
                </p>
                <p class="flex justify-between items-center">
                    <span class="text-slate-600">Return (%):</span>
                    <span :class="returnClasses()" class="font-bold px-3 py-1 rounded-full text-sm">
                        {{ formatReturn(localPick.returnPercentage) }}
                    </span>
                </p>
            </div>

            <!-- Total Return Section -->
            <div v-if="localPick.lastClosePrice" class="mt-3 pt-3 border-t border-slate-200 space-y-2">
                <p class="flex justify-between items-center">
                    <span class="text-slate-600 font-semibold">Total Return</span>
                    <span class="text-slate-500 text-xs">(if held until now)</span>
                </p>
                <p class="flex justify-between items-center">
                    <span class="text-slate-600">Last Close:</span>
                    <span class="font-bold">${{ formatPrice(localPick.lastClosePrice) }}</span>
                </p>
                <p class="flex justify-between items-center">
                    <span class="text-slate-600">Return ($):</span>
                    <span class="font-bold" :class="returnClasses(true, totalReturnPercentage)">
                        {{ formatDollarReturn(localPick.entryPrice, localPick.lastClosePrice) }}
                    </span>
                </p>
                <p class="flex justify-between items-center">
                    <span class="text-slate-600">Return (%):</span>
                    <span :class="returnClasses(false, totalReturnPercentage)"
                        class="font-bold px-3 py-1 rounded-full text-sm">
                        {{ formatReturn(totalReturnPercentage) }}
                    </span>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { Pick } from '../../types';
import axios from 'axios';

interface Props {
    pick: Pick;
    isWinner?: boolean;
    variant?: 'default' | 'compact';
}

const props = withDefaults(defineProps<Props>(), {
    isWinner: false,
    variant: 'default',
});

const localPick = ref<Pick>(props.pick);
const loading = ref(false);

onMounted(() => {
    // Data is now pre-fetched by a cron job
});

const totalReturnPercentage = computed(() => {
    if (localPick.value.entryPrice == null || localPick.value.lastClosePrice == null) {
        return null;
    }
    return ((localPick.value.lastClosePrice - localPick.value.entryPrice) / localPick.value.entryPrice) * 100;
});

const cardClasses = computed(() => {
    const baseClasses = 'bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200';
    if (props.isWinner) return `${baseClasses} ring-2 ring-green-500 ring-opacity-50`;
    return baseClasses;
});

const returnClasses = (isText: boolean = false, percentage: number | null | undefined = localPick.value.returnPercentage) => {
    if (percentage == null) {
        return isText ? 'text-slate-700' : 'bg-slate-200 text-slate-700 shadow-sm';
    }
    if (percentage > 0) {
        return isText ? 'text-green-700' : 'bg-green-100 text-green-700 shadow-sm';
    }
    if (percentage < 0) {
        return isText ? 'text-red-700' : 'bg-red-100 text-red-700 shadow-sm';
    }
    return isText ? 'text-slate-700' : 'bg-slate-200 text-slate-700 shadow-sm';
};

const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return 'N/A';
    return price.toFixed(2);
};

const formatReturn = (percentage: number | null | undefined): string => {
    if (percentage == null) return 'N/A';
    return `${percentage.toFixed(2)}%`;
};

const formatDollarReturn = (entry?: number | null, current?: number | null): string => {
    if (entry == null || current == null) return 'N/A';
    const ret = current - entry;
    const sign = ret > 0 ? '+' : ret < 0 ? '-' : '';
    return `${sign}$${Math.abs(ret).toFixed(2)}`;
};
</script>