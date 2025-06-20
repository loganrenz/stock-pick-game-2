<template>
    <div :class="containerClasses">
        <!-- Pulse Loading -->
        <div v-if="variant === 'pulse'" class="flex flex-col items-center justify-center">
            <div class="relative">
                <div class="w-12 h-12 bg-blue-600 rounded-full animate-ping opacity-75"></div>
                <div class="absolute top-0 left-0 w-12 h-12 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
            <p v-if="message" class="mt-4 text-gray-600 animate-pulse">{{ message }}</p>
        </div>

        <!-- Bounce Loading -->
        <div v-else-if="variant === 'bounce'" class="flex flex-col items-center justify-center">
            <div class="flex space-x-1">
                <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
            <p v-if="message" class="mt-4 text-gray-600">{{ message }}</p>
        </div>

        <!-- Spinner Loading -->
        <div v-else-if="variant === 'spinner'" class="flex flex-col items-center justify-center">
            <svg :class="spinnerSize" class="animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p v-if="message" class="mt-4 text-gray-600">{{ message }}</p>
        </div>

        <!-- Skeleton Loading -->
        <div v-else-if="variant === 'skeleton'" class="w-full">
            <div class="animate-pulse space-y-4">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                <div class="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
        </div>

        <!-- Wave Loading -->
        <div v-else-if="variant === 'wave'" class="flex flex-col items-center justify-center">
            <div class="flex space-x-1">
                <div class="w-2 h-8 bg-blue-600 rounded-full animate-pulse" style="animation-delay: 0ms"></div>
                <div class="w-2 h-8 bg-blue-600 rounded-full animate-pulse" style="animation-delay: 100ms"></div>
                <div class="w-2 h-8 bg-blue-600 rounded-full animate-pulse" style="animation-delay: 200ms"></div>
                <div class="w-2 h-8 bg-blue-600 rounded-full animate-pulse" style="animation-delay: 300ms"></div>
                <div class="w-2 h-8 bg-blue-600 rounded-full animate-pulse" style="animation-delay: 400ms"></div>
            </div>
            <p v-if="message" class="mt-4 text-gray-600">{{ message }}</p>
        </div>

        <!-- Default Loading -->
        <div v-else class="flex flex-col items-center justify-center">
            <svg :class="spinnerSize" class="animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p v-if="message" class="mt-4 text-gray-600">{{ message }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    message?: string;
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'pulse' | 'bounce' | 'spinner' | 'skeleton' | 'wave';
}

const props = withDefaults(defineProps<Props>(), {
    message: '',
    fullScreen: false,
    size: 'md',
    variant: 'default',
});

const containerClasses = computed(() => {
    const baseClasses = 'flex flex-col items-center justify-center';

    if (props.fullScreen) {
        return `${baseClasses} fixed inset-0 z-50 bg-white bg-opacity-90 backdrop-blur-sm`;
    }

    return `${baseClasses} py-8`;
});

const spinnerSize = computed(() => {
    const sizes = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
    };
    return sizes[props.size];
});
</script>