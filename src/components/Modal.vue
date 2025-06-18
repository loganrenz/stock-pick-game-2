<template>
  <transition name="fade">
    <div class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="$emit('close')">
          &times;
        </button>
        <div class="mb-4">
          <slot name="header" />
        </div>
        <div>
          <slot name="body" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['close']);

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}

function handleOverlayClick(event: MouseEvent) {
  // Only close if clicking the overlay itself, not its children
  if (event.target === event.currentTarget) {
    emit('close');
  }
}

onMounted(() => {
  // Add keyboard listener when modal is mounted
  document.addEventListener('keydown', handleKeydown);
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  // Remove keyboard listener when modal is unmounted
  document.removeEventListener('keydown', handleKeydown);
  // Restore body scrolling when modal is closed
  document.body.style.overflow = '';
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.08);
}

.modal-content {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(30, 41, 59, 0.12), 0 1.5px 4px rgba(30, 41, 59, 0.04);
  max-width: 420px;
  width: 100%;
  padding: 2.5rem 2rem 2rem 2rem;
  position: relative;
  animation: modal-pop 0.18s cubic-bezier(.4, 0, .2, 1);
  font-family: 'Inter', system-ui, sans-serif;
}

@keyframes modal-pop {
  0% {
    transform: scale(0.98) translateY(16px);
    opacity: 0.7;
  }

  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #1d4ed8;
  cursor: pointer;
  transition: color 0.15s;
  font-weight: bold;
}

.modal-close:hover {
  color: #334155;
}

.mb-4 {
  margin-bottom: 1.5rem;
}
</style>