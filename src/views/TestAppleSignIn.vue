<script setup lang="ts">
import { ref } from 'vue';
import AppleSignIn from '../components/AppleSignIn.vue';

const userInfo = ref<{ sub: string; email?: string; email_verified?: boolean } | null>(null);
const error = ref<string | null>(null);

const handleSuccess = (user: { sub: string; email?: string; email_verified?: boolean }) => {
    userInfo.value = user;
    error.value = null;
    console.log('Sign in successful:', user);
};

const handleError = (err: any) => {
    error.value = err.message || 'An error occurred during sign in';
    console.error('Sign in error:', err);
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Test Apple Sign In
                </h2>
            </div>

            <div class="mt-8 space-y-6">
                <AppleSignIn :on-success="handleSuccess" :on-error="handleError" />

                <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-700 rounded">
                    {{ error }}
                </div>

                <div v-if="userInfo" class="mt-4 p-4 bg-green-100 text-green-700 rounded">
                    <h3 class="font-bold">Sign In Successful!</h3>
                    <pre class="mt-2">{{ JSON.stringify(userInfo, null, 2) }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>