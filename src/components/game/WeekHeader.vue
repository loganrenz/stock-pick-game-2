<template>
    <div>
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-50 to-blue-50/50 border-b border-blue-100 px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-baseline gap-3">
                    <h3 class="text-xl font-bold text-blue-900">Week {{ weekNum }}</h3>
                    <time class="text-xs text-blue-500">
                        {{ formatDateRange(startDate, endDate) }}
                    </time>
                </div>

                <!-- Winner Badge -->
                <div v-if="winner" class="flex items-center">
                    <div
                        class="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd" />
                        </svg>
                        <span>{{ winner.username.toUpperCase() }} WON</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Leaderboard Table -->
        <div class="px-6 py-3 bg-white">
            <div class="flow-root">
                <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table class="min-w-full">
                            <thead>
                                <tr class="text-sm">
                                    <th scope="col" class="py-2 pl-0 pr-3 text-left font-medium text-slate-500">Rank
                                    </th>
                                    <th scope="col" class="px-3 py-2 text-left font-medium text-slate-500">Player</th>
                                    <th scope="col" class="px-3 py-2 text-left font-medium text-slate-500">Pick</th>
                                    <th scope="col" class="px-3 py-2 text-right font-medium text-slate-500">Entry Price
                                    </th>
                                    <th scope="col" class="px-3 py-2 text-right font-medium text-slate-500">{{ isCurrent
                                        ? 'Current Price' : 'Final Price' }}</th>
                                    <th scope="col" class="px-3 py-2 text-right font-medium text-slate-500">Return ($)
                                    </th>
                                    <th scope="col" class="px-3 py-2 text-right font-medium text-slate-500">Return (%)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(pick, index) in orderedPicks" :key="pick.id" class="text-sm"
                                    :class="{ 'bg-blue-50/50': index === 0 && !winner }">
                                    <td class="whitespace-nowrap py-2 pl-0 pr-3 font-medium" :class="[
                                        index === 0 && !winner ? 'text-blue-600' : 'text-slate-900'
                                    ]">
                                        #{{ index + 1 }}
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-2 font-semibold" :class="[
                                        index === 0 && !winner ? 'text-blue-600' : 'text-slate-900'
                                    ]">
                                        {{ pick.user.username.toUpperCase() }}
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-2 font-bold" :class="[
                                        index === 0 && !winner ? 'text-blue-600' : 'text-slate-900'
                                    ]">
                                        {{ pick.symbol }}
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-2 text-right font-mono text-slate-700">
                                        ${{ formatPrice(pick.entryPrice) }}
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-2 text-right font-mono text-slate-700">
                                        ${{ formatPrice(pick.currentValue) }}
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-2 text-right font-mono"
                                        :class="returnColor(pick.returnPercentage, 'text')">
                                        {{ formatDollarReturn(pick.entryPrice, pick.currentValue) }}
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-2 text-right">
                                        <span :class="[
                                            returnColor(pick.returnPercentage, 'bg'),
                                            'px-2 py-1 rounded-full text-xs font-semibold'
                                        ]">
                                            {{ formatReturn(pick.returnPercentage) }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { User, Pick } from '../../types';
import { useGame } from '../../composables/useGame';

interface Props {
    weekNum: number;
    startDate: string;
    endDate: string;
    winner?: User | null;
    picks?: Pick[];
    isCurrent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    winner: null,
    picks: () => [],
    isCurrent: false
});

const { orderPicksByReturn } = useGame();

const orderedPicks = computed(() => {
    return orderPicksByReturn(props.picks);
});

const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // If same month, only show month once
    if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
    }

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endDate.getFullYear()}`;
};

const formatReturn = (percentage: number | null | undefined): string => {
    if (percentage == null) return 'N/A';
    return `${percentage.toFixed(2)}%`;
};

const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return 'N/A';
    return price.toFixed(2);
}

const formatDollarReturn = (entry?: number | null, current?: number | null): string => {
    if (entry == null || current == null) return 'N/A';
    const ret = current - entry;
    const sign = ret > 0 ? '+' : ret < 0 ? '-' : '';
    return `${sign}$${Math.abs(ret).toFixed(2)}`;
}

const returnColor = (percentage: number | null | undefined, type: 'bg' | 'text'): string => {
    if (percentage == null) {
        return type === 'bg' ? 'bg-slate-100 text-slate-700' : 'text-slate-700';
    }
    if (percentage > 0) {
        return type === 'bg' ? 'bg-green-100 text-green-700' : 'text-green-700';
    }
    if (percentage < 0) {
        return type === 'bg' ? 'bg-red-100 text-red-700' : 'text-red-700';
    }
    return type === 'bg' ? 'bg-slate-100 text-slate-700' : 'text-slate-700';
}
</script>
