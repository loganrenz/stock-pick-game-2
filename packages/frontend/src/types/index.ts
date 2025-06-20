export interface User {
  id: number;
  username: string;
}

export interface DailyPrice {
  open: number | null;
  close: number | null;
}

export interface Pick {
  id: number;
  userId: number;
  weekId: number;
  symbol: string;
  entryPrice: number;
  createdAt: string;
  updatedAt?: string;
  currentValue?: number;
  weekReturn?: number;
  returnPercentage?: number;
  user?: User;
  lastClosePrice?: number | null;
  lastClosePriceUpdatedAt?: string | null;
}

export interface Week {
  id: number;
  weekNum: number;
  startDate: string;
  endDate: string;
  winnerId: number | null;
  picks: Pick[];
  winner?: User | null;
}

export interface Stock {
  symbol: string;
  // ... existing code ...
}
