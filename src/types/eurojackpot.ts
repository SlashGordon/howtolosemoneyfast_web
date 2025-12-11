export interface EurojackpotNumbers {
  mainNumbers: number[]; // 5 numbers from 1-50
  euroNumbers: number[]; // 2 numbers from 1-12
  date?: string;
  ticketPrice?: number; // Price of the ticket in euros
  prizeDistribution?: Record<string, number>; // Prize distribution data
  [key: string]: any;
}

export interface EurojackpotResult {
  draw: EurojackpotNumbers;
  matches: {
    mainNumbers: number;
    euroNumbers: number;
  };
  isWinner: boolean;
}

export interface MoneyWastedData {
  dates: string[];
  amounts: number[];
  etfAmounts: number[];
  totalWasted: number;
  totalEtfValue: number;
}

export type MoneySymbol = '💸' | '💰' | '💵' | '💴' | '💶' | '💷' | '🪙';