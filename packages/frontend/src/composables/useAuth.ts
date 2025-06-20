import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

export function useAuth() {
  const authStore = useAuthStore();

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.user);
  const isAdmin = computed(() => user.value?.username === 'admin');

  const login = async (username: string, password: string) => {
    return await authStore.login(username, password);
  };

  const logout = () => {
    authStore.logout();
  };

  const checkAuth = () => {
    return authStore.checkAuth();
  };

  return {
    isAuthenticated,
    user,
    isAdmin,
    login,
    logout,
    checkAuth,
  };
}
