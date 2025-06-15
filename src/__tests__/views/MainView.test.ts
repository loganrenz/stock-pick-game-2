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

  it('renders daily price data correctly', () => {
    const gameStore = useGameStore();
    const authStore = useAuthStore();

    // Mock the store data
    gameStore.currentWeek = {
      id: 1,
      weekNum: 1,
      startDate: '2024-03-18',
      endDate: '2024-03-22',
      winnerId: null,
      picks: [{
        id: 1,
        userId: 1,
        weekId: 1,
        symbol: 'AAPL',
        entryPrice: 150,
        createdAt: '2024-03-18',
        updatedAt: '2024-03-18',
        user: { id: 1, username: 'testuser' },
        dailyPriceData: {
          monday: { open: 150, close: 155 },
          tuesday: { open: 155, close: 160 },
          wednesday: { open: 160, close: 158 },
          thursday: { open: 158, close: 162 },
          friday: { open: 162, close: 165 }
        },
        currentValue: 165,
        returnPercentage: 10
      }]
    };

    const wrapper = mount(MainView, {
      props: {
        showLoginModal: false
      }
    });

    // Check if daily price data is rendered
    const mondayRow = wrapper.find('[data-testid="daily-price-monday"]');
    expect(mondayRow.exists()).toBe(true);
    expect(mondayRow.find('[data-testid="weekday-label-monday"]').text()).toBe('Monday');
    expect(mondayRow.find('[data-testid="open-price-monday"]').text()).toBe('Open 150');
    expect(mondayRow.find('[data-testid="close-price-monday"]').text()).toBe('Close 155');

    const fridayRow = wrapper.find('[data-testid="daily-price-friday"]');
    expect(fridayRow.exists()).toBe(true);
    expect(fridayRow.find('[data-testid="weekday-label-friday"]').text()).toBe('Friday');
    expect(fridayRow.find('[data-testid="open-price-friday"]').text()).toBe('Open 162');
    expect(fridayRow.find('[data-testid="close-price-friday"]').text()).toBe('Close 165');
  });

  it('handles missing daily price data correctly', () => {
    const gameStore = useGameStore();
    const authStore = useAuthStore();

    // Mock the store data with missing daily prices
    gameStore.currentWeek = {
      id: 1,
      weekNum: 1,
      startDate: '2024-03-18',
      endDate: '2024-03-22',
      winnerId: null,
      picks: [{
        id: 1,
        userId: 1,
        weekId: 1,
        symbol: 'AAPL',
        entryPrice: 150,
        createdAt: '2024-03-18',
        updatedAt: '2024-03-18',
        user: { id: 1, username: 'testuser' },
        dailyPriceData: {
          monday: { open: null, close: null },
          tuesday: { open: null, close: null },
          wednesday: { open: null, close: null },
          thursday: { open: null, close: null },
          friday: { open: null, close: null }
        },
        currentValue: 165,
        returnPercentage: 10
      }]
    };

    const wrapper = mount(MainView, {
      props: {
        showLoginModal: false
      }
    });

    // Check if missing values are displayed as dashes
    const mondayRow = wrapper.find('[data-testid="daily-price-monday"]');
    expect(mondayRow.exists()).toBe(true);
    expect(mondayRow.find('[data-testid="weekday-label-monday"]').text()).toBe('Monday');
    expect(mondayRow.find('[data-testid="open-price-monday"]').text()).toBe('Open -');
    expect(mondayRow.find('[data-testid="close-price-monday"]').text()).toBe('Close -');
  });

  it('does not show daily price data when pick.dailyPriceData is null', () => {
    const gameStore = useGameStore();
    const authStore = useAuthStore();

    // Mock the store data with null dailyPriceData
    gameStore.currentWeek = {
      id: 1,
      weekNum: 1,
      startDate: '2024-03-18',
      endDate: '2024-03-22',
      winnerId: null,
      picks: [{
        id: 1,
        userId: 1,
        weekId: 1,
        symbol: 'AAPL',
        entryPrice: 150,
        createdAt: '2024-03-18',
        updatedAt: '2024-03-18',
        user: { id: 1, username: 'testuser' },
        dailyPriceData: null,
        currentValue: 165,
        returnPercentage: 10
      }]
    };

    const wrapper = mount(MainView, {
      props: {
        showLoginModal: false
      }
    });

    // Check that no daily price data is rendered
    expect(wrapper.find('[data-testid="daily-price-monday"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="daily-price-friday"]').exists()).toBe(false);
  });
}); 