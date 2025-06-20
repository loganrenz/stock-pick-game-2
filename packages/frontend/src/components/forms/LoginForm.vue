<template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
        <Input v-model="form.username" label="Username" placeholder="Enter your username" :error="error" required
            data-testid="login-username" />
        <Input v-model="form.password" type="password" label="Password" :error="error" required
            data-testid="login-password" />
        <Button type="submit" :loading="loading" full-width size="lg">
            Login
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
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: '',
});

const emit = defineEmits<{
    submit: [username: string, password: string];
}>();

const form = ref({
    username: '',
    password: '',
});

const handleSubmit = () => {
    if (form.value.username && form.value.password) {
        emit('submit', form.value.username, form.value.password);
    }
};
</script>