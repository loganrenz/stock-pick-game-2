<template>
  <div v-if="show" class="fixed inset-0 pointer-events-none z-50" style="contain: layout style paint;">
    <div v-for="i in 600" :key="`${triggerKey}-${i}`" 
         class="confetti-piece"
         :class="confettiTypes[i % 16]"
         :style="confettiStyles[i]">
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';

interface Props {
  trigger?: boolean;
  originElement?: HTMLElement | null;
}

const props = defineProps<Props>();

const show = ref(false);
const triggerKey = ref(0);
const explosionCenter = ref({ x: 50, y: 40 }); // Default center

// Pre-defined types for better performance (avoid modulo on large array)
const confettiTypes = [
  'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7',
  'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15'
];

const calculateExplosionCenter = () => {
  if (props.originElement) {
    const rect = props.originElement.getBoundingClientRect();
    const centerX = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const centerY = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    explosionCenter.value = { x: centerX, y: centerY };
  }
};

const confettiStyles = computed(() => {
  const centerX = explosionCenter.value.x;
  const centerY = explosionCenter.value.y;
  
  // Pre-calculate for better performance
  return Array.from({ length: 600 }, (_, i) => {
    const angle = (i / 600) * 360 + Math.random() * 30; // More even distribution
    const angleRad = angle * Math.PI / 180;
    const velocity = 300 + (i % 300); // Deterministic spread
    
    const endX = Math.cos(angleRad) * velocity;
    const endY = Math.sin(angleRad) * velocity + 300;
    
    return {
      '--start-x': centerX + '%',
      '--start-y': centerY + '%',
      '--end-x': endX + 'px',
      '--end-y': endY + 'px',
      '--delay': (i % 20) * 0.005 + 's', // Micro-stagger
      '--duration': (7 + (i % 5)) + 's',
      width: (3 + (i % 3)) + 'px',
      height: (3 + (i % 3)) + 'px'
    };
  });
});

watch(() => props.trigger, async (newVal, oldVal) => {
  if (newVal !== oldVal && newVal) {
    await nextTick();
    calculateExplosionCenter();
    
    triggerKey.value++;
    show.value = true;
    
    setTimeout(() => {
      show.value = false;
    }, 12000);
  }
}, { immediate: true });
</script>

<style scoped>
@keyframes confetti-fly {
  from { 
    transform: translate3d(0, 0, 0) rotate(0deg);
    opacity: 1; 
  }
  to { 
    transform: translate3d(var(--end-x), var(--end-y), 0) rotate(360deg);
    opacity: 0; 
  }
}

.confetti-piece {
  position: absolute;
  left: var(--start-x);
  top: var(--start-y);
  animation: confetti-fly linear forwards;
  animation-delay: var(--delay);
  animation-duration: var(--duration);
  will-change: transform;
  transform: translateZ(0);
  contain: layout style paint;
}

/* Optimized color classes */
.c0 { background: #ef4444; } /* red square */
.c1 { background: #3b82f6; } /* blue square */
.c2 { background: #eab308; } /* yellow square */
.c3 { background: #22c55e; } /* green square */
.c4 { background: #a855f7; } /* purple square */
.c5 { background: #f97316; } /* orange square */
.c6 { background: #ec4899; } /* pink square */
.c7 { background: #06b6d4; } /* cyan square */
.c8 { background: #ef4444; height: 6px; } /* red rect */
.c9 { background: #3b82f6; height: 6px; } /* blue rect */
.c10 { background: #eab308; height: 6px; } /* yellow rect */
.c11 { background: #22c55e; height: 6px; } /* green rect */
.c12 { background: #a855f7; height: 6px; } /* purple rect */
.c13 { background: #f97316; height: 6px; } /* orange rect */
.c14 { background: #ec4899; height: 6px; } /* pink rect */
.c15 { background: #06b6d4; height: 6px; } /* cyan rect */
</style> 