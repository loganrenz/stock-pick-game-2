<template>
    <div :class="cardClasses">
        <div v-if="$slots.header" class="px-4 py-5 sm:px-6 border-b border-gray-200">
            <slot name="header" />
        </div>
        <div :class="bodyClasses">
            <slot />
        </div>
        <div v-if="$slots.footer" class="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    padding: 'md',
    hover: false,
});

const cardClasses = computed(() => {
    const baseClasses = 'bg-white rounded-lg border';

    const variantClasses = {
        default: 'border-gray-200 shadow-sm',
        elevated: 'border-gray-200 shadow-lg',
        outlined: 'border-gray-300 shadow-none',
    };

    const hoverClass = props.hover ? 'hover:shadow-md transition-shadow duration-200' : '';

    return [baseClasses, variantClasses[props.variant], hoverClass].join(' ');
});

const bodyClasses = computed(() => {
    const paddingClasses = {
        none: '',
        sm: 'px-3 py-3',
        md: 'px-4 py-5 sm:px-6',
        lg: 'px-6 py-6 sm:px-8',
    };

    return paddingClasses[props.padding];
});
</script>