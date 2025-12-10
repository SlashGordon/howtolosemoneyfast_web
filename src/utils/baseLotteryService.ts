export interface LotteryDraw {
  date: string;
  [key: string]: any;
}

export interface LotteryNumbers {
  [key: string]: number[];
}

export interface LotteryResult {
  draw: LotteryDraw;
  matches: Record<string, number>;
  isWinner: boolean;
  prize?: number;
}

export abstract class BaseLotteryService<T extends LotteryDraw, N extends LotteryNumbers> {
  protected historicalData: T[] = [];

  public async initialize(): Promise<void> {
    this.historicalData = await this.loadHistoricalData();
  }

  protected abstract loadHistoricalData(): Promise<T[]>;
  protected abstract validateNumbers(numbers: N): boolean;
  protected abstract calculateMatches(userNumbers: N, draw: T): Record<string, number>;
  protected abstract calculatePrize(matches: Record<string, number>): number;

  public checkNumbers(numbers: N, startDate?: string, endDate?: string): LotteryResult[] {
    if (!this.validateNumbers(numbers)) {
      throw new Error('Invalid numbers provided');
    }

    const filteredData = this.filterByDateRange(startDate, endDate);
    
    return filteredData.map(draw => {
      const matches = this.calculateMatches(numbers, draw);
      const totalMatches = Object.values(matches).reduce((sum, count) => sum + count, 0);
      const prize = this.calculatePrize(matches);
      
      return {
        draw,
        matches,
        isWinner: prize > 0,
        prize
      };
    }).filter(result => Object.values(result.matches).some(count => count > 0));
  }

  protected filterByDateRange(startDate?: string, endDate?: string): T[] {
    if (!startDate && !endDate) return this.historicalData;
    
    return this.historicalData.filter(draw => {
      const drawDate = new Date(draw.date);
      if (startDate && drawDate < new Date(startDate)) return false;
      if (endDate && drawDate > new Date(endDate)) return false;
      return true;
    });
  }
}