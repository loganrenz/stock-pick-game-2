<template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
        <Input v-model="symbol" label="Stock Symbol" placeholder="e.g. AAPL" :error="error" required
            data-testid="pick-symbol" />
        <Button type="submit" :loading="loading" :disabled="!symbol.trim()" full-width>
            {{ submitText }}
        </Button>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Input from '../ui/Input.vue';
import Button from '../ui/Button.vue';

interface Props {
    loading?: boolean;
    error?: string;
    submitText?: string;
    initialSymbol?: string;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: '',
    submitText: 'Submit Pick',
    initialSymbol: '',
});

const emit = defineEmits<{
    submit: [symbol: string];
}>();

const symbol = ref(props.initialSymbol);

const handleSubmit = () => {
    if (symbol.value.trim()) {
        emit('submit', symbol.value.trim());
    }
};
</script>