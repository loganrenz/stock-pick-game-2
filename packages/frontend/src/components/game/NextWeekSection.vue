<template>
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-100">
        <!-- Next Week Header -->
        <div class="mb-6 text-center">
            <h2 class="text-3xl font-bold text-slate-900 mb-2">Next Week</h2>
            <div class="w-16 h-1 bg-green-500 mx-auto rounded-full"></div>
            <!-- Timing Information -->
            <div v-if="activeNextWeek && !nextWeekPickLocked" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-sm font-medium text-blue-800">
                    {{ getPickDeadlineMessage() }}
                </p>
            </div>
            <div v-else-if="nextWeekPickLocked" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm font-medium text-red-800">
                    🔒 Picks are now locked for next week
                </p>
            </div>
        </div>

        <div class="flex justify-center">
            <Card variant="elevated" class="w-full max-w-xl border-2 border-green-200">
                <template #header>
                    <!-- Loading state for header -->
                    <div v-if="loading"
                        class="bg-gradient-to-r from-blue-50 to-blue-50/50 border-b border-blue-100 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <div class="space-y-2">
                                <div class="h-6 bg-gray-200 rounded w-24"></div>
                                <div class="h-4 bg-gray-200 rounded w-32"></div>
                            </div>
                            <div class="h-8 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>

                    <!-- Header content -->
                    <div v-else class="bg-gradient-to-r from-blue-50 to-blue-50/50 border-b border-blue-100 px-6 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-baseline gap-3">
                                <h3 class="text-xl font-bold text-blue-900">Week {{ activeNextWeek?.weekNum || '?' }}
                                </h3>
                                <time class="text-xs text-blue-500">
                                    <span v-if="activeNextWeek">
                                        {{ formatDateRange(activeNextWeek.startDate, activeNextWeek.endDate) }}
                                    </span>
                                    <span v-else>(-)</span>
                                </time>
                            </div>
                            <button @click="$emit('toggle-visibility')"
                                class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                {{ hidePicks ? 'Show All Picks' : 'Hide All Picks' }}
                            </button>
                        </div>
                    </div>
                </template>

                <div class="space-y-4">
                    <!-- Loading state for user picks -->
                    <div v-if="loading" class="space-y-4">
                        <div v-for="i in 3" :key="i" class="bg-white border-2 border-slate-200 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <div class="h-4 bg-gray-200 rounded w-20"></div>
                                <div class="h-6 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                    </div>

                    <!-- No next week available -->
                    <div v-else-if="!activeNextWeek" class="text-center py-8">
                        <div class="text-gray-500">
                            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                            </svg>
                            <p class="text-lg font-medium">No next week available</p>
                            <p class="text-sm">Check back later for upcoming weeks.</p>
                        </div>
                    </div>

                    <!-- User picks grid -->
                    <div v-else class="grid grid-cols-3 gap-4">
                        <div v-for="user in users" :key="user.id" :class="[
                            'bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow',
                            user.username.toLowerCase() === username?.toLowerCase()
                                ? 'border-blue-300 shadow-md'
                                : 'border-slate-200 opacity-75'
                        ]">
                            <div class="flex flex-col items-center text-center">
                                <h4 :class="[
                                    'font-extrabold mb-2',
                                    user.username.toLowerCase() === username?.toLowerCase()
                                        ? 'text-blue-900 text-lg'
                                        : 'text-slate-600 text-sm'
                                ]">
                                    {{ user.username.toUpperCase() }}
                                    <span v-if="user.username.toLowerCase() === username?.toLowerCase()"
                                        class="block text-xs text-blue-600 font-medium mt-1">
                                        (You)
                                    </span>
                                </h4>
                                <span v-if="!hidePicks || (userNextWeekPick?.user.username === user.username)" :class="[
                                    'font-black',
                                    user.username.toLowerCase() === username?.toLowerCase()
                                        ? 'text-blue-900 text-xl'
                                        : 'text-slate-700 text-base'
                                ]">
                                    {{ getUserNextWeekPick(user)?.symbol || 'No Pick' }}
                                </span>
                                <span v-else class="text-slate-400 font-medium text-sm">Hidden</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action button -->
                    <div v-if="!loading" class="mt-6">
                        <Button v-if="!isAuthenticated" @click="$emit('open-login')" :disabled="nextWeekPickLocked"
                            full-width size="lg">
                            Login to Make Next Week's Pick
                        </Button>
                        <Button v-else @click="$emit('open-next-week-modal')" :disabled="nextWeekPickLocked" full-width
                            size="lg">
                            {{ userNextWeekPick ? 'Change Pick' : 'Make Pick' }}
                        </Button>

                        <div v-if="nextWeekPickLocked" class="mt-2 text-center text-red-600">
                            Picks for week {{ nextAvailableWeek?.weekNum }} are now locked. You cannot make or change
                            your
                            pick.
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import { useGame } from '../../composables/useGame';
import type { Week, Pick, User } from '../../types';

interface Props {
    activeNextWeek: Week | null;
    nextAvailableWeek: Week | null;
    users: User[];
    isAuthenticated: boolean;
    hidePicks: boolean;
    nextWeekPickLocked: boolean;
    userNextWeekPick: Pick | null;
    loading?: boolean;
    username?: string;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    username: '',
});

const emit = defineEmits<{
    'toggle-visibility': [];
    'open-login': [];
    'open-next-week-modal': [];
}>();

const { formatDate } = useGame();

const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} - ${end}`;
};

const getUserNextWeekPick = (user: User): Pick | null => {
    if (!props.activeNextWeek?.picks) return null;
    return props.activeNextWeek.picks.find(
        (p) => p.user.username?.toLowerCase().trim() === user.username?.toLowerCase().trim()
    ) || null;
};

const getPickDeadlineMessage = (): string => {
    if (!props.activeNextWeek) return '';
    
    const now = new Date();
    const week = props.activeNextWeek;
    
    // Deadline is just before the next week starts (end of current week)
    const deadline = new Date(week.startDate);
    deadline.setHours(4, 0, 0, 0); // 4 AM when the week starts
    
    const timeLeft = deadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
    
    if (timeLeft <= 0) {
        return '⏰ Deadline has passed';
    } else if (daysLeft <= 1) {
        if (hoursLeft <= 1) {
            return '🚨 Less than 1 hour left to make your pick!';
        } else {
            return `⏰ ${hoursLeft} hours left to make your pick`;
        }
    } else if (daysLeft <= 2) {
        return `⏰ ${daysLeft} day${daysLeft > 1 ? 's' : ''} left to make your pick`;
    } else {
        return `📅 You have ${daysLeft} days to make your pick`;
    }
};
</script>