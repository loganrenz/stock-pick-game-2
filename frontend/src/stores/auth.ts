import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

interface User {
  id: number;
  username: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function fetchUser() {
    if (!token.value) return;

    try {
      const response = await fetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      user.value = { id: data.id, username: data.username };
    } catch (error) {
      console.error('Error fetching user:', error);
      // If we can't fetch the user, they're probably not authenticated
      await logout();
    }
  }

  async function login(username: string, password: string) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      token.value = data.token;
      user.value = { id: data.userId, username: data.username };
      localStorage.setItem('token', data.token);

      // Check for new token in response headers
      const newToken = response.headers.get('X-New-Token');
      if (newToken) {
        token.value = newToken;
        localStorage.setItem('token', newToken);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
    }
  }

  async function refreshToken() {
    if (!token.value) return;

    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      token.value = data.token;
      localStorage.setItem('token', data.token);
      
      // After refreshing token, fetch user data
      await fetchUser();
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, log out the user
      await logout();
    }
  }

  // Set up an interceptor to handle token refresh for fetch
  const setupFetchInterceptor = () => {
    const originalFetch = window.fetch;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      if (init?.headers && token.value) {
        init.headers = {
          ...init.headers,
          'Authorization': `Bearer ${token.value}`
        };
      }

      const response = await originalFetch(input, init);

      // Check for new token in response headers
      const newToken = response.headers.get('X-New-Token');
      if (newToken) {
        token.value = newToken;
        localStorage.setItem('token', newToken);
      }

      return response;
    };
  };

  // Set up an interceptor to handle token for axios
  const setupAxiosInterceptor = () => {
    axios.interceptors.request.use(
      (config) => {
        const jwt = token.value || localStorage.getItem('token');
        if (jwt) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${jwt}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  };

  // Initialize the interceptors
  setupFetchInterceptor();
  setupAxiosInterceptor();

  // Initialize user data if we have a token
  if (token.value) {
    fetchUser();
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    fetchUser
  };
}); 