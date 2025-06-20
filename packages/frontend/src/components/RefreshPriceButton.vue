<template>
  <button @click="refreshPrice" :disabled="isRefreshing" class="refresh-price-btn"
    :class="{ 'refreshing': isRefreshing }" title="Refresh price">
    <span v-if="isRefreshing" class="spinner">↻</span>
    <span v-else>↻</span>
  </button>
</template>

<script setup lang="ts">
import api from '../utils/axios.js'
import { usePriceRefresh } from '../composables/usePriceRefresh'

interface Props {
  symbol: string
}

const props = defineProps<Props>()
const { isRefreshing, setRefreshing } = usePriceRefresh()

const emit = defineEmits<{
  refreshed: [data: any]
  error: [error: string]
}>()

const refreshPrice = async () => {
  if (isRefreshing.value) {
    console.log(`[REFRESH] Already refreshing, ignoring click for ${props.symbol}`)
    return
  }

  setRefreshing(true)

  try {
    console.log(`[REFRESH] Refreshing price for ${props.symbol}...`)

    const response = await api.post('/stocks/refresh-price', {
      symbol: props.symbol
    })

    console.log(`[REFRESH] Successfully refreshed ${props.symbol}:`, response.data)

    emit('refreshed', response.data)
  } catch (error: any) {
    console.error(`[REFRESH] Failed to refresh ${props.symbol}:`, error)

    const errorMessage = error.response?.data?.error || error.message || 'Failed to refresh price'
    emit('error', errorMessage)
  } finally {
    setRefreshing(false)
  }
}
</script>

<style scoped>
.refresh-price-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  transition: all 0.2s ease;
}

.refresh-price-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  color: #333;
}

.refresh-price-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.refresh-price-btn.refreshing .spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>