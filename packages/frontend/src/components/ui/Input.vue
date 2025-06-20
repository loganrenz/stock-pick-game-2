<template>
    <div class="w-full">
        <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
            {{ label }}
            <span v-if="required" class="text-red-500">*</span>
        </label>
        <input :id="id" :type="type" :value="modelValue" :placeholder="placeholder" :disabled="disabled"
            :required="required" :class="inputClasses"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" @blur="$emit('blur', $event)"
            @focus="$emit('focus', $event)" />
        <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
        <p v-else-if="hint" class="mt-1 text-sm text-gray-500">{{ hint }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    modelValue: string;
    label?: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    disabled?: boolean;
    required?: boolean;
    error?: string;
    hint?: string;
    id?: string;
}

const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    disabled: false,
    required: false,
    id: () => `input-${Math.random().toString(36).substr(2, 9)}`,
});

defineEmits<{
    'update:modelValue': [value: string];
    blur: [event: FocusEvent];
    focus: [event: FocusEvent];
}>();

const inputClasses = computed(() => {
    const baseClasses = 'w-full px-3 py-2 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0';

    if (props.error) {
        return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500`;
    }

    return `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500`;
});
</script>