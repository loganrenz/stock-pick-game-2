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
  priceAtPick: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  dailyPrices?: {
    monday?: DailyPrice;
    tuesday?: DailyPrice;
    wednesday?: DailyPrice;
    thursday?: DailyPrice;
    friday?: DailyPrice;
    [key: string]: DailyPrice | undefined;
  };
  currentPrice?: number;
  totalReturn?: number;
  weekReturn?: number;
  weekReturnPct?: number;
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