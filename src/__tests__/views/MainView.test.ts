import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MainView from '../../views/MainView.vue';
import { useGameStore } from '../../stores/game';
import { useAuthStore } from '../../stores/auth';

describe('MainView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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
    });

    // Check that pick data is rendered
    expect(wrapper.text()).toContain('AAPL');
    expect(wrapper.text()).toContain('testuser');
    expect(wrapper.text()).toContain('150');
  });
});
