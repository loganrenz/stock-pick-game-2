<template>
    <div class="scoreboard-main mb-8">
        <!-- Loading state -->
        <div v-if="loading" class="flex gap-1 justify-center">
            <SkeletonLoader type="scoreboard" />
        </div>

        <!-- Scoreboard content -->
        <div v-else class="flex gap-1 justify-center">
            <div v-for="score in scoreboard" :key="score.username" class="scoreboard-box">
                <div class="scoreboard-user">
                    {{ score.username }}
                </div>
                <div class="scoreboard-wins">
                    {{ score.wins }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import SkeletonLoader from '../ui/SkeletonLoader.vue';

interface ScoreboardEntry {
    username: string;
    wins: number;
}

interface Props {
    scoreboard?: ScoreboardEntry[];
    loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
});
</script>

<style scoped>
.scoreboard-main {
    margin-bottom: 2.5rem;
}

.scoreboard-box {
    background: #f3f4f6;
    border-radius: 10px;
    padding: 0.7rem 1.2rem;
    min-width: 60px;
    text-align: center;
    font-size: 1.1rem;
    margin-right: 8px;
    box-shadow: 0 1px 4px rgba(30, 41, 59, 0.07);
}

.scoreboard-user {
    font-weight: 700;
    font-size: 1.1rem;
}

.scoreboard-wins {
    font-size: 1.2rem;
    font-weight: 800;
    color: #1d4ed8;
}

@media (max-width: 700px) {
    .scoreboard-box {
        padding: 0.5rem 0.7rem;
        font-size: 1rem;
    }
}
</style>