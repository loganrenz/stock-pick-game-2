import { computed } from 'vue';
import type { Week, Pick } from '../types';

export function useGame() {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatReturn = (percentage: number | null | undefined): string => {
    if (percentage == null) return 'N/A';
    return `${percentage.toFixed(2)}%`;
  };

  const getReturnClass = (percentage: number | null | undefined): string => {
    if (percentage == null) return 'bg-gray-200 text-gray-700';
    if (percentage > 0) return 'bg-green-100 text-green-700';
    if (percentage < 0) return 'bg-red-100 text-red-700';
    return 'bg-gray-200 text-gray-700';
  };

  const isWeekend = computed(() => {
    const today = new Date();
    return today.getDay() === 0 || today.getDay() === 6;
  });

  const getBestPick = (picks: Pick[]): Pick | null => {
    if (!Array.isArray(picks) || picks.length === 0) return null;
    return (
      [...picks]
        .filter((p) => typeof p.returnPercentage === 'number')
        .sort((a, b) => (b.returnPercentage ?? -Infinity) - (a.returnPercentage ?? -Infinity))[0] ||
      null
    );
  };

  const orderPicksByReturn = (picks: Pick[]): Pick[] => {
    return [...picks].sort(
      (a, b) => (b.returnPercentage ?? -Infinity) - (a.returnPercentage ?? -Infinity),
    );
  };

  const isBestPick = (picks: Pick[], pick: Pick): boolean => {
    const best = getBestPick(picks);
    return best?.id === pick.id;
  };

  const canPickCurrentWeek = (
    week: Week | null,
    isAuthenticated: boolean,
    username?: string,
  ): boolean => {
    if (!isAuthenticated || !week) return false;

    const alreadyPicked = week.picks?.some((p: Pick) => p.user.username === username) ?? false;
    const now = new Date();
    const monday = new Date(week.startDate);
    monday.setHours(0, 0, 0, 0);
    const friday = new Date(week.startDate);
    friday.setDate(friday.getDate() + 4);
    friday.setHours(20, 0, 0, 0);

    return !alreadyPicked && now >= monday && now < friday;
  };

  return {
    formatDate,
    formatPrice,
    formatReturn,
    getReturnClass,
    isWeekend,
    getBestPick,
    orderPicksByReturn,
    isBestPick,
    canPickCurrentWeek,
  };
}
