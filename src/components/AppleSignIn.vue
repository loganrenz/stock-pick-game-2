<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import axios from 'axios';

// Props
const props = defineProps<{
    onSuccess?: (user: { sub: string; email?: string; email_verified?: boolean }) => void;
    onError?: (error: any) => void;
}>();

// Load Apple's JavaScript SDK
const loadAppleScript = () => {
    return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Apple Sign In SDK'));
        document.head.appendChild(script);
    });
};

// Initialize Apple Sign In
const initAppleSignIn = () => {
    if (!window.AppleID) {
        console.error('Apple Sign In SDK not loaded');
        return;
    }

    const redirectURI = import.meta.env.DEV
        ? 'http://localhost:3004/api/auth/apple-auth'
        : 'https://stockpickgame.tideye.com/api/apple-auth';

    window.AppleID.auth.init({
        clientId: 'com.apple.stockpickgame',
        scope: '',
        redirectURI,
        state: '',
        usePopup: true,
    });
};

// Handle successful sign in
const handleSuccess = async (event: any) => {
    try {
        const { authorization } = event.detail;

        // Send code and id_token to backend
        const response = await axios.post('/api/auth/apple-auth', {
            code: authorization.code,
            id_token: authorization.id_token,
        });

        // Call success callback with user info
        props.onSuccess?.(response.data);
    } catch (error) {
        console.error('Apple Sign In error:', error);
        props.onError?.(error);
    }
};

// Handle sign in failure
const handleError = (event: any) => {
    console.error('Apple Sign In failed:', event.detail.error);
    props.onError?.(event.detail.error);
};

// Lifecycle hooks
onMounted(async () => {
    try {
        await loadAppleScript();
        initAppleSignIn();

        // Add event listeners
        document.addEventListener('AppleIDSignInOnSuccess', handleSuccess);
        document.addEventListener('AppleIDSignInOnFailure', handleError);
    } catch (error) {
        console.error('Failed to initialize Apple Sign In:', error);
        props.onError?.(error);
    }
});

onUnmounted(() => {
    // Remove event listeners
    document.removeEventListener('AppleIDSignInOnSuccess', handleSuccess);
    document.removeEventListener('AppleIDSignInOnFailure', handleError);
});
</script>

<template>
    <div id="appleid-signin" data-color="black" data-border="true" data-type="sign in">
    </div>
</template>

<style scoped>
#appleid-signin {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
}
</style>