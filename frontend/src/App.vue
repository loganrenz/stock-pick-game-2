<script setup lang="ts">
import MainView from './views/MainView.vue';
import TopBar from './components/TopBar.vue';
import { ref, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const showLoginModal = ref(false);
const auth = useAuthStore();

onMounted(async () => {
  // Initialize auth state
  if (auth.token) {
    await auth.fetchUser();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar @open-login-modal="showLoginModal = true" />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view v-slot="{ Component }">
        <component :is="Component" :show-login-modal="showLoginModal"
          @update:show-login-modal="showLoginModal = $event" />
      </router-view>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: #f5f6f8;
  min-height: 100vh;
  overflow-x: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #f5f6f8;
  overflow-x: hidden;
}

.top-bar {
  width: 100vw;
  background: #222e3a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  height: 56px;
  min-width: 0;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 1px;
  white-space: nowrap;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.username {
  font-weight: 500;
  font-size: 1.1rem;
  white-space: nowrap;
}

.logout-btn {
  background: #4CAF50;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
  white-space: nowrap;
  min-width: 70px;
}

.logout-btn:hover {
  background: #388e3c;
}

.main-content {
  margin-top: 56px;
  overflow-x: hidden;
}

@media (max-width: 600px) {
  .top-bar {
    flex-direction: column;
    align-items: flex-start;
    height: auto;
    padding: 0.5rem 0.5rem;
  }

  .main-content {
    margin-top: 60px;
  }

  .logo {
    font-size: 1.1rem;
  }

  .logout-btn {
    font-size: 0.95rem;
    padding: 0.4rem 0.7rem;
  }
}
</style>
