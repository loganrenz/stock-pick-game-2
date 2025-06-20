import { ref } from 'vue';

const isUpdating = ref(false);
const lastUpdateTime = ref<Date | null>(null);

export function usePriceUpdates() {
  const updatePrices = async () => {
    if (isUpdating.value) {
      console.log('[PRICE-UPDATE] Already updating, skipping...');
      return;
    }

    // Don't update more than once every 5 minutes
    if (lastUpdateTime.value && Date.now() - lastUpdateTime.value.getTime() < 5 * 60 * 1000) {
      console.log('[PRICE-UPDATE] Updated recently, skipping...');
      return;
    }

    isUpdating.value = true;

    try {
      console.log('[PRICE-UPDATE] Starting background price update...');

      const response = await fetch('/api/update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize: 5,
          maxConcurrent: 5,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[PRICE-UPDATE] Completed: ${result.updated} updated, ${result.failed} failed`);
        lastUpdateTime.value = new Date();
      } else {
        console.error('[PRICE-UPDATE] Failed to update prices:', response.status);
      }
    } catch (error) {
      console.error('[PRICE-UPDATE] Error updating prices:', error);
    } finally {
      isUpdating.value = false;
    }
  };

  // Auto-update when the composable is used
  const startAutoUpdate = () => {
    // Update immediately if it's been more than 5 minutes
    if (!lastUpdateTime.value || Date.now() - lastUpdateTime.value.getTime() > 5 * 60 * 1000) {
      updatePrices();
    }
  };

  return {
    updatePrices,
    startAutoUpdate,
    isUpdating,
    lastUpdateTime,
  };
}
