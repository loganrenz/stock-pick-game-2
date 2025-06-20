import { ref } from 'vue';

// Global state to track if any price refresh is in progress
const isRefreshing = ref(false);

export function usePriceRefresh() {
  const setRefreshing = (status: boolean) => {
    isRefreshing.value = status;
  };

  return {
    isRefreshing,
    setRefreshing,
  };
}
