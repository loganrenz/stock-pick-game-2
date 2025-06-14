<script setup lang="ts">
// No need for HelloWorld or logo imports
</script>

<template>
  <div id="app">
    <svg style="position: absolute; width: 0; height: 0;">
      <defs>
        <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur1" />
          <feGaussianBlur in="blur1" stdDeviation="2" result="blur2" />
          <feGaussianBlur in="blur2" stdDeviation="4" result="blur3" />
          <feMerge>
            <feMergeNode in="blur3" />
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
    <router-view />
  </div>
</template>

<style>
#app {
  touch-action: pan-y pinch-zoom;
}
</style>
