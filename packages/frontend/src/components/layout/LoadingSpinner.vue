<template>
    <div :class="containerClasses">
        <svg class="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p v-if="message" class="mt-4 text-gray-600">{{ message }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    message?: string;
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
    message: '',
    fullScreen: false,
    size: 'md',
});

const containerClasses = computed(() => {
    const baseClasses = 'flex flex-col items-center justify-center';

    if (props.fullScreen) {
        return `${baseClasses} fixed inset-0 z-50 bg-white bg-opacity-70`;
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