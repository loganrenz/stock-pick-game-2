import { render, screen } from '@testing-library/vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import MainView from './MainView.vue';
import { useGameStore } from '../stores/game';
import { useAuthStore } from '../stores/auth';
import { mount } from '@vue/test-utils';

// Mock router-link component
const RouterLinkStub = {
  name: 'RouterLink',
  template: '<a><slot /></a>',
  props: ['to'],
};

describe('MainView', () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());
    // Mock Date to return a fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-18T12:00:00Z'));

    // Create router instance
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/stats',
          name: 'stats',
          component: { template: '<div>Stats</div>' },
        },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly visually', async () => {
    const { container } = render(MainView, {
      props: {
        showLoginModal: false,
      },
      global: {
        plugins: [createPinia(), router],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });
    expect(container).toMatchSnapshot();
  });

  it('renders pick data correctly', () => {
    const gameStore = useGameStore();
    const authStore = useAuthStore();

    // Mock the store data
    gameStore.currentWeek = {
      id: 1,
      weekNum: 1,
      startDate: '2024-03-18',
      endDate: '2024-03-22',
      winnerId: null,
      picks: [
        {
          id: 1,
          userId: 1,
          weekId: 1,
          symbol: 'AAPL',
          entryPrice: 150,
          createdAt: '2024-03-18',
          updatedAt: '2024-03-18',
          user: { id: 1, username: 'testuser' },
          currentValue: 165,
          returnPercentage: 10,
        },
      ],
    };

    const wrapper = mount(MainView, {
      props: {
        showLoginModal: false,
      },
      global: {
        plugins: [router],
      },
    });

    // Check if pick data is rendered
    expect(wrapper.text()).toContain('AAPL');
    expect(wrapper.text()).toContain('testuser');
    expect(wrapper.text()).toContain('150');
    expect(wrapper.text()).toContain('165');
    expect(wrapper.text()).toContain('10%');
  });

  it('handles missing pick data correctly', () => {
    const gameStore = useGameStore();
    const authStore = useAuthStore();

    // Mock the store data with missing values
    gameStore.currentWeek = {
      id: 1,
      weekNum: 1,
      startDate: '2024-03-18',
      endDate: '2024-03-22',
      winnerId: null,
      picks: [
        {
          id: 1,
          userId: 1,
          weekId: 1,
          symbol: 'AAPL',
          entryPrice: 150,
          createdAt: '2024-03-18',
          updatedAt: '2024-03-18',
          user: { id: 1, username: 'testuser' },
          currentValue: null,
          returnPercentage: null,
        },
      ],
    };

    const wrapper = mount(MainView, {
      props: {
        showLoginModal: false,
      },
      global: {
        plugins: [router],
      },
    });

    // Check if pick data is rendered with missing values
    expect(wrapper.text()).toContain('AAPL');
    expect(wrapper.text()).toContain('testuser');
    expect(wrapper.text()).toContain('150');
  });

  it('handles null pick data correctly', () => {
    const gameStore = useGameStore();
    const authStore = useAuthStore();

    // Mock the store data with null values
    gameStore.currentWeek = {
      id: 1,
      weekNum: 1,
      startDate: '2024-03-18',
      endDate: '2024-03-22',
      winnerId: null,
      picks: [
        {
          id: 1,
          userId: 1,
          weekId: 1,
          symbol: 'AAPL',
          entryPrice: 150,
          createdAt: '2024-03-18',
          updatedAt: '2024-03-18',
          user: { id: 1, username: 'testuser' },
          currentValue: null,
          returnPercentage: null,
        },
      ],
    };

    const wrapper = mount(MainView, {
      props: {
        showLoginModal: false,
      },
      global: {
        plugins: [router],
      },
    });

    // Check that pick data is rendered
    expect(wrapper.text()).toContain('AAPL');
    expect(wrapper.text()).toContain('testuser');
    expect(wrapper.text()).toContain('150');
  });
});
