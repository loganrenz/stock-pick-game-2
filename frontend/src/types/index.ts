export interface User {
  id: number;
  username: string;
}

export interface Pick {
  id: number;
  userId: number;
  weekId: number;
  symbol: string;
  priceAtPick: number;
  createdAt: string;
  user: {
    username: string;
  };
  dailyPrices?: {
    [key: string]: number;
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
  winnerId: number | null;
  picks: Pick[];
  winner?: {
    username: string;
  };
} 