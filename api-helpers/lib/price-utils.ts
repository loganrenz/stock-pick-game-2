/**
 * Checks if a stock's price change is realistic.
 * @param changePercent The percentage change of the stock price.
 * @returns True if the price change is realistic, false otherwise.
 */
export function isPriceChangeRealistic(changePercent: number | null | undefined): boolean {
  if (changePercent === null || changePercent === undefined) {
    return true; // No data to check, assume it's fine
  }
  const realistic = Math.abs(changePercent) <= 100;
  if (!realistic) {
    console.warn(`[PRICE-CHECK] Unrealistic price change detected: ${changePercent}%`);
  }
  return realistic;
}
