<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import api from '../utils/axios.js';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const appleSdkLoaded = ref(false);

// Props
const props = defineProps<{
    onSuccess?: (user: { sub: string; email?: string; email_verified?: boolean }) => void;
    onError?: (error: any) => void;
}>();

const emit = defineEmits<{
    success: [userData: any];
    error: [error: any];
}>();

// Load Apple's JavaScript SDK
const loadAppleScript = () => {
    return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.onload = () => {
            appleSdkLoaded.value = true;
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Apple Sign In SDK'));
        document.head.appendChild(script);
    });
};

// Initialize Apple Sign In
const initAppleSignIn = () => {
    if (!(window as any).AppleID) {
        console.error('Apple Sign In SDK not loaded');
        return;
    }

    (window as any).AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: import.meta.env.DEV
            ? import.meta.env.VITE_APPLE_REDIRECT_URI_DEV
            : import.meta.env.VITE_APPLE_REDIRECT_URI,
        state: 'origin:web',
        usePopup: true,
    });
};

// Handle successful sign in
const handleSuccess = async (data: any) => {
    try {
        const { authorization } = data.detail;
        // Send code and id_token to backend
        const response = await api.post('/auth/apple-auth', {
            code: authorization.code,
            id_token: authorization.id_token,
            user: data.detail.user,
        });
        emit('success', response.data);
    } catch (error) {
        console.error('Apple Sign In failed:', error);
        props.onError?.(error);
        emit('error', error);
    }
};

// Handle sign in failure
const handleError = (event: any) => {
    console.error('Apple Sign In failed:', event.detail);

    // Handle specific Apple Sign In errors
    let errorMessage = 'Apple Sign In failed';
    if (event.detail.error) {
        switch (event.detail.error) {
            case 'popup_closed_by_user':
                errorMessage = 'Sign in was cancelled';
                break;
            case 'invalid_request':
                errorMessage = 'Invalid request. Please try again.';
                break;
            case 'unauthorized_client':
                errorMessage = 'Unauthorized client. Please contact support.';
                break;
            case 'access_denied':
                errorMessage = 'Access denied. Please try again.';
                break;
            case 'unsupported_response_type':
                errorMessage = 'Unsupported response type. Please try again.';
                break;
            case 'invalid_scope':
                errorMessage = 'Invalid scope. Please try again.';
                break;
            case 'server_error':
                errorMessage = 'Server error. Please try again later.';
                break;
            case 'temporarily_unavailable':
                errorMessage = 'Service temporarily unavailable. Please try again later.';
                break;
            default:
                errorMessage = event.detail.error;
        }
    }

    props.onError?.(errorMessage);
    emit('error', errorMessage);
};

// Manual sign in function
const signInWithApple = () => {
    try {
        if ((window as any).AppleID && (window as any).AppleID.auth) {
            (window as any).AppleID.auth.signIn();
        } else {
            console.error('Apple Sign In SDK not available');
            emit('error', 'Apple Sign In not available');
        }
    } catch (error) {
        console.error('Error initiating Apple Sign In:', error);
        emit('error', 'Failed to start Apple Sign In');
    }
};

// Lifecycle hooks
onMounted(async () => {
    try {
        await loadAppleScript();
        // Ensure the DOM is updated before initializing
        await nextTick();
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
    <div class="w-full flex flex-col items-center space-y-3">
        <!-- Apple Sign In Button -->
        <div id="appleid-signin" data-color="black" data-border="true" data-type="sign in"></div>

        <!-- Fallback Button (in case the Apple button doesn't load) -->
        <button v-if="!appleSdkLoaded" @click="signInWithApple"
            class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Sign in with Apple
        </button>
    </div>
</template>

<style scoped>
#appleid-signin {
    width: 100%;
    max-width: 240px;
    margin: 0 auto;
}
</style>