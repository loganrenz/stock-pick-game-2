<template>
    <div class="animate-pulse">
        <!-- Card Skeleton -->
        <div v-if="type === 'card'" class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center space-x-4 mb-4">
                <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div class="flex-1">
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
            <div class="space-y-3">
                <div class="h-4 bg-gray-200 rounded w-full"></div>
                <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                <div class="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
        </div>

        <!-- Pick Card Skeleton -->
        <div v-else-if="type === 'pick-card'" class="bg-white border-2 border-slate-800 rounded-xl shadow-lg p-4">
            <div class="flex items-center justify-between mb-2">
                <div class="h-4 bg-gray-200 rounded w-20"></div>
                <div class="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div class="space-y-2">
                <div class="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-24"></div>
                <div class="h-3 bg-gray-200 rounded w-20"></div>
                <div class="h-3 bg-gray-200 rounded w-28"></div>
            </div>
        </div>

        <!-- Table Row Skeleton -->
        <div v-else-if="type === 'table-row'" class="flex items-center space-x-4 py-3 border-b border-gray-100">
            <div class="h-4 bg-gray-200 rounded w-16"></div>
            <div class="h-6 bg-gray-200 rounded w-12"></div>
            <div class="h-4 bg-gray-200 rounded w-20"></div>
            <div class="h-4 bg-gray-200 rounded w-20"></div>
            <div class="h-4 bg-gray-200 rounded w-16"></div>
            <div class="h-4 bg-gray-200 rounded w-24"></div>
        </div>

        <!-- Week Header Skeleton -->
        <div v-else-if="type === 'week-header'"
            class="px-4 py-5 sm:px-6 border-b border-blue-100 bg-blue-50 rounded-t-lg">
            <div class="flex justify-between items-center">
                <div class="space-y-2">
                    <div class="h-6 bg-gray-200 rounded w-32"></div>
                    <div class="h-4 bg-gray-200 rounded w-24"></div>
                    <div class="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div class="h-8 bg-gray-200 rounded w-24"></div>
            </div>
        </div>

        <!-- Scoreboard Skeleton -->
        <div v-else-if="type === 'scoreboard'" class="flex gap-1 justify-center">
            <div v-for="i in 3" :key="i" class="bg-gray-200 rounded-lg p-3 min-w-[60px] text-center">
                <div class="h-4 bg-gray-300 rounded w-full mb-1"></div>
                <div class="h-5 bg-gray-300 rounded w-8 mx-auto"></div>
            </div>
        </div>

        <!-- List Skeleton -->
        <div v-else-if="type === 'list'" class="space-y-3">
            <div v-for="i in count" :key="i" class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div class="flex-1">
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div class="h-6 bg-gray-200 rounded w-16"></div>
            </div>
        </div>

        <!-- Custom Skeleton -->
        <div v-else class="space-y-3">
            <div v-for="i in count" :key="i" class="h-4 bg-gray-200 rounded" :style="{ width: getWidth(i) }"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    type?: 'card' | 'pick-card' | 'table-row' | 'week-header' | 'scoreboard' | 'list' | 'custom';
    count?: number;
}

const props = withDefaults(defineProps<Props>(), {
    type: 'custom',
    count: 3,
});

const getWidth = (index: number) => {
    const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3'];
    return widths[index % widths.length];
};
</script>