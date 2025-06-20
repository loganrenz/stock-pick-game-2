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

    // Check if fetch is available
    if (typeof fetch === 'undefined') {
      console.warn('[PRICE-UPDATE] Fetch API not available, skipping update');
      return;
    }

    isUpdating.value = true;

    try {
      console.log('[PRICE-UPDATE] Starting background price update...');
      console.log('[PRICE-UPDATE] Making request to /api/update-prices');

      const response = await fetch('/api/update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      console.log('[PRICE-UPDATE] Response status:', response.status);
      console.log('[PRICE-UPDATE] Response ok:', response.ok);

      if (response.ok) {
        try {
          const responseText = await response.text();
          const result = JSON.parse(responseText);
          console.log(
            `[PRICE-UPDATE] Completed: ${result.updated} updated, ${result.failed} failed`,
          );
          lastUpdateTime.value = new Date();
        } catch (jsonError) {
          console.error('[PRICE-UPDATE] Failed to parse JSON response:', jsonError);
          console.error('[PRICE-UPDATE] Raw response:', responseText);
        }
      } else {
        const errorText = await response.text();
        console.error('[PRICE-UPDATE] Failed to update prices:', response.status, errorText);
      }
    } catch (error) {
      console.error('[PRICE-UPDATE] Error updating prices:', error);
    } finally {
      isUpdating.value = false;
    }
  };

  return {
    updatePrices,
    isUpdating,
    lastUpdateTime,
  };
}
