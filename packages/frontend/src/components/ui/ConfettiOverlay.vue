<template>
  <div v-if="show" class="confetti-container fixed inset-0 pointer-events-none z-50">
    <!-- Dollar Bills -->
    <div v-for="i in 20" :key="`dollar-${triggerKey}-${i}`" :class="`dollar dollar-${i}`" :style="getDollarStyle(i)">
    </div>

    <!-- Coins -->
    <div v-for="i in 30" :key="`coin-${triggerKey}-${i}`" :class="`coin coin-${i}`" :style="getCoinStyle(i)">
    </div>

    <!-- Confetti -->
    <div v-for="i in 150" :key="`confetti-${triggerKey}-${i}`" :class="`confetti confetti-${i}`"
      :style="getConfettiStyle(i)">
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';

interface Props {
  trigger?: boolean;
  originElement?: HTMLElement | null;
}

const props = defineProps<Props>();

const show = ref(false);
const triggerKey = ref(0);
const explosionCenter = ref({ x: 50, y: 30 }); // Default center

const confettiColors = ['#146ff5', '#dd1a8f', '#ee6f40', '#3adcc8', '#8154e2', '#8b4513'];
const coinColors = ['#ffd700', '#daa520', '#c0c0c0', '#dcdcdc'];

const random = (max: number) => Math.floor(Math.random() * max) + 1;
const randomFloat = () => Math.random();

const calculateExplosionCenter = () => {
  if (props.originElement) {
    const rect = props.originElement.getBoundingClientRect();
    const centerX = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const centerY = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    explosionCenter.value = { x: centerX, y: centerY };
  }
};

// Generate CSS keyframes with upward explosion then natural fall
const generateKeyframes = () => {
  let css = '';

  // Generate dollar keyframes - upward explosion then fall
  for (let i = 1; i <= 20; i++) {
    const angle = (i / 20) * 360 + (randomFloat() - 0.5) * 45;
    const horizontalDistance = 150 + randomFloat() * 300;
    const upwardForce = 200 + randomFloat() * 150; // Strong upward force
    const endX = Math.cos(angle * Math.PI / 180) * horizontalDistance;
    const peakY = -upwardForce; // Negative = upward
    const fallY = window.innerHeight + 100; // Fall to bottom of screen

    css += `
      @keyframes make-it-rain-${i} {
        0% { 
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          opacity: 1;
        }
        20% { 
          transform: translate3d(${endX * 0.7}px, ${peakY}px, 0px) rotate(180deg) scale(1.1);
          opacity: 1;
        }
        100% { 
          transform: translate3d(${endX}px, ${fallY}px, 0px) rotate(720deg) scale(0.8);
          opacity: 0.7;
        }
      }
    `;
  }

  // Generate coin keyframes - upward explosion then fall
  for (let i = 1; i <= 30; i++) {
    const angle = (i / 30) * 360 + (randomFloat() - 0.5) * 30;
    const horizontalDistance = 120 + randomFloat() * 250;
    const upwardForce = 180 + randomFloat() * 120;
    const endX = Math.cos(angle * Math.PI / 180) * horizontalDistance;
    const peakY = -upwardForce;
    const fallY = window.innerHeight + 50;

    css += `
      @keyframes coins-keep-falling-${i} {
        0% { 
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          opacity: 1;
        }
        25% { 
          transform: translate3d(${endX * 0.8}px, ${peakY}px, 0px) rotate(270deg) scale(1.2);
          opacity: 1;
        }
        100% { 
          transform: translate3d(${endX}px, ${fallY}px, 0px) rotate(900deg) scale(0.9);
          opacity: 0.8;
        }
      }
    `;
  }

  // Generate confetti keyframes - upward explosion then fall
  for (let i = 1; i <= 150; i++) {
    const angle = (i / 150) * 360 + (randomFloat() - 0.5) * 60;
    const horizontalDistance = 100 + randomFloat() * 400;
    const upwardForce = 150 + randomFloat() * 200;
    const endX = Math.cos(angle * Math.PI / 180) * horizontalDistance;
    const peakY = -upwardForce;
    const fallY = window.innerHeight + 20;

    css += `
      @keyframes confetti-explosion-${i} {
        0% { 
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          opacity: 1;
        }
        30% { 
          transform: translate3d(${endX * 0.6}px, ${peakY}px, 0px) rotate(180deg) scale(1);
          opacity: 1;
        }
        100% { 
          transform: translate3d(${endX}px, ${fallY}px, 0px) rotate(540deg) scale(0.7);
          opacity: 0.6;
        }
      }
    `;
  }

  return css;
};

const injectKeyframes = () => {
  calculateExplosionCenter(); // Update explosion center

  const existingStyle = document.getElementById('confetti-keyframes');
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement('style');
  style.id = 'confetti-keyframes';
  style.textContent = generateKeyframes();
  document.head.appendChild(style);
};

const getDollarStyle = (i: number) => {
  const paperSize = 17 + random(20);
  const delay = randomFloat() * 3; // Spread launches over 1.5 seconds

  return {
    width: `${paperSize}px`,
    height: `${paperSize}px`,
    left: `${explosionCenter.value.x}%`,
    top: `${explosionCenter.value.y}%`,
    animationName: `make-it-rain-${i}`,
    animationDuration: '10s', // Full 10 second duration
    animationDelay: `${delay}s`,
    animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    animationFillMode: 'forwards',
    zIndex: random(5) + 3
  };
};

const getCoinStyle = (i: number) => {
  const coinSize = 8 + random(12);
  const delay = randomFloat() * 1.0; // Quick successive launches

  return {
    width: `${coinSize}px`,
    height: `${coinSize}px`,
    backgroundColor: coinColors[random(4) - 1],
    left: `${explosionCenter.value.x}%`,
    top: `${explosionCenter.value.y}%`,
    animationName: `coins-keep-falling-${i}`,
    animationDuration: '10s',
    animationDelay: `${delay}s`,
    animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    animationFillMode: 'forwards',
    zIndex: random(5) + 2,
    fontSize: `${coinSize - 2}px`
  };
};

const getConfettiStyle = (i: number) => {
  const paperSize = 4 + random(10);
  const delay = randomFloat() * 0.8; // Most confetti launches quickly

  return {
    width: `${paperSize}px`,
    height: `${paperSize * 0.4}px`,
    backgroundColor: confettiColors[random(6) - 1],
    left: `${explosionCenter.value.x}%`,
    top: `${explosionCenter.value.y}%`,
    animationName: `confetti-explosion-${i}`,
    animationDuration: '10s',
    animationDelay: `${delay}s`,
    animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    animationFillMode: 'forwards',
    zIndex: random(5)
  };
};

watch(() => props.trigger, async (newVal, oldVal) => {
  if (newVal !== oldVal && newVal) {
    await nextTick();
    injectKeyframes(); // Generate fresh keyframes with current explosion center
    triggerKey.value++;
    show.value = true;

    setTimeout(() => {
      show.value = false;
    }, 12000); // Show for 12 seconds to let everything fall naturally
  }
}, { immediate: true });

onMounted(() => {
  injectKeyframes();
});
</script>

<style scoped>
.confetti-container {
  overflow: hidden;
}

.dollar,
.coin,
.confetti {
  position: absolute;
}

.dollar {
  background-image: url('data:image/svg+xml,%3Csvg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"%3E%3Cg%3E%3Cg%3E%3Cpath style="fill:%2374D24F;" d="M496,112H16c-8.82,0-16,7.18-16,16v256c0,8.82,7.18,16,16,16h480c8.82,0,16-7.18,16-16V128 C512,119.18,504.82,112,496,112z"/%3E%3C/g%3E%3Cg%3E%3Cpath style="fill:%23FFEFBC;" d="M472,192c-22.055,0-40-17.945-40-40c0-4.422-3.578-8-8-8H88c-4.422,0-8,3.578-8,8 c0,22.055-17.945,40-40,40c-4.422,0-8,3.578-8,8v112c0,4.422,3.578,8,8,8c22.055,0,40,17.945,40,40c0,4.422,3.578,8,8,8h336 c4.422,0,8-3.578,8-8c0-22.055,17.945-40,40-40c4.422,0,8-3.578,8-8V200C480,195.578,476.422,192,472,192z"/%3E%3C/g%3E%3Cg%3E%3Cpath style="fill:%23869B55;" d="M128,256c0,48.221,26.691,90.175,66.081,112h123.839C357.309,346.175,384,304.221,384,256 s-26.691-90.175-66.081-112H194.08C154.691,165.825,128,207.779,128,256z"/%3E%3C/g%3E%3Cg%3E%3Cpath style="fill:%23FFEFBC;" d="M256,244c-16.023,0-28-8.445-28-16c0-7.555,11.977-16,28-16s28,8.445,28,16c0,6.625,5.375,12,12,12 s12-5.375,12-12c0-19.236-16.824-34.862-40-38.932V184c0-6.625-5.375-12-12-12s-12,5.375-12,12v5.068 c-23.176,4.07-40,19.695-40,38.932c0,22.43,22.844,40,52,40c16.023,0,28,8.445,28,16c0,7.555-11.977,16-28,16s-28-8.445-28-16 c0-6.625-5.375-12-12-12s-12,5.375-12,12c0,19.236,16.824,34.862,40,38.932V328c0,6.625,5.375,12,12,12s12-5.375,12-12v-5.068 c23.176-4.07,40-19.695,40-38.932C308,261.57,285.156,244,256,244z"/%3E%3C/g%3E%3Cg%3E%3Ccircle style="fill:%2374D24F;" cx="80" cy="256" r="24"/%3E%3C/g%3E%3Cg%3E%3Ccircle style="fill:%2374D24F;" cx="432" cy="256" r="24"/%3E%3C/g%3E%3Cg%3E%3Ccircle style="fill:%23869B55;" cx="40" cy="152" r="16"/%3E%3C/g%3E%3Cg%3E%3Ccircle style="fill:%23869B55;" cx="472" cy="152" r="16"/%3E%3C/g%3E%3Cg%3E%3Ccircle style="fill:%23869B55;" cx="40" cy="360" r="16"/%3E%3C/g%3E%3Cg%3E%3Ccircle style="fill:%23869B55;" cx="472" cy="360" r="16"/%3E%3C/g%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3C/svg%3E%0A');
  background-size: contain;
  background-repeat: no-repeat;
}

.coin {
  border-radius: 50%;
  font-weight: 900;
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #333;
}

.coin::before {
  content: "$";
  position: relative;
  top: 0.1em;
}

/* Generate keyframes for dollars */
@keyframes make-it-rain-1 {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(0.6);
  }

  100% {
    transform: translate3d(15px, 1200px, 0px) rotate(360deg) scale(0.6);
    top: 110%;
  }
}

@keyframes make-it-rain-2 {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(0.6);
  }

  100% {
    transform: translate3d(25px, 1200px, 0px) rotate(360deg) scale(0.6);
    top: 110%;
  }
}

@keyframes make-it-rain-3 {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(0.6);
  }

  100% {
    transform: translate3d(35px, 1200px, 0px) rotate(360deg) scale(0.6);
    top: 110%;
  }
}

/* Generate more keyframes dynamically if needed */
</style>