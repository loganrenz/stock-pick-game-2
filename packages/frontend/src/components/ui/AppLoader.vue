<template>
    <div class="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div class="text-center">
            <!-- Animated logo/icon -->
            <div class="relative mb-8">
                <div
                    class="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center animate-pulse">
                    <svg class="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>

                <!-- Floating particles -->
                <div class="absolute inset-0">
                    <div v-for="i in 6" :key="i" class="absolute w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        :style="{
                            left: `${20 + (i * 10)}%`,
                            top: `${30 + (i * 5)}%`,
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: `${1 + (i * 0.1)}s`
                        }"></div>
                </div>
            </div>

            <!-- App title -->
            <h1 class="text-3xl font-bold text-gray-800 mb-2 animate-fade-in">
                Stock Pick Game
            </h1>

            <!-- Loading message -->
            <p class="text-gray-600 mb-8 animate-fade-in-delay">
                {{ message || 'Loading your game data...' }}
            </p>

            <!-- Progress bar -->
            <div class="w-64 mx-auto bg-gray-200 rounded-full h-2 mb-4">
                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                    :style="{ width: `${progress}%` }"></div>
            </div>

            <!-- Loading dots -->
            <div class="flex justify-center space-x-1">
                <div v-for="i in 3" :key="i" class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                    :style="{ animationDelay: `${i * 0.2}s` }"></div>
            </div>

            <!-- Fun loading messages -->
            <div class="mt-6 text-sm text-gray-500 animate-fade-in-delay-2">
                <p v-if="loadingStep === 1">📈 Fetching market data...</p>
                <p v-else-if="loadingStep === 2">🎯 Loading your picks...</p>
                <p v-else-if="loadingStep === 3">🏆 Calculating winners...</p>
                <p v-else-if="loadingStep === 4">🚀 Almost ready...</p>
                <p v-else>⚡ Preparing your game...</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
    message?: string;
    duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
    message: '',
    duration: 3000,
});

const progress = ref(0);
const loadingStep = ref(1);

onMounted(() => {
    const startTime = Date.now();
    const endTime = startTime + props.duration;

    const updateProgress = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const newProgress = Math.min((elapsed / props.duration) * 100, 100);

        progress.value = newProgress;

        // Update loading step based on progress
        if (newProgress < 25) {
            loadingStep.value = 1;
        } else if (newProgress < 50) {
            loadingStep.value = 2;
        } else if (newProgress < 75) {
            loadingStep.value = 3;
        } else {
            loadingStep.value = 4;
        }

        if (now < endTime) {
            requestAnimationFrame(updateProgress);
        }
    };

    requestAnimationFrame(updateProgress);
});
</script>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fade-in-delay {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }

    50% {
        opacity: 0;
        transform: translateY(10px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fade-in-delay-2 {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }

    70% {
        opacity: 0;
        transform: translateY(10px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.6s ease-out;
}

.animate-fade-in-delay {
    animation: fade-in-delay 1.2s ease-out;
}

.animate-fade-in-delay-2 {
    animation: fade-in-delay-2 1.8s ease-out;
}
</style>