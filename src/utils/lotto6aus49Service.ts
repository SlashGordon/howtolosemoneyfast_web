import type { Lotto6aus49Draw, Lotto6aus49Numbers } from '../types/lotto6aus49';
import { BaseLotteryService } from './baseLotteryService';
import { loadHistoricalDraws } from '../data/historicalLotto6aus49';

export class Lotto6aus49Service extends BaseLotteryService<Lotto6aus49Draw, Lotto6aus49Numbers> {
  private static instance: Lotto6aus49Service;

  private constructor() {
    super();
  }

  public static getInstance(): Lotto6aus49Service {
    if (!Lotto6aus49Service.instance) {
      Lotto6aus49Service.instance = new Lotto6aus49Service();
    }
    return Lotto6aus49Service.instance;
  }

  protected async loadHistoricalData(): Promise<Lotto6aus49Draw[]> {
    return loadHistoricalDraws();
  }

  protected validateNumbers(numbers: Lotto6aus49Numbers): boolean {
    if (numbers.regular.length !== 6) return false;
    
    const uniqueNumbers = new Set(numbers.regular);
    if (uniqueNumbers.size !== 6) return false;
    
    return numbers.regular.every(num => num >= 1 && num <= 49) &&
           numbers.bonus.every(num => num >= 0 && num <= 9);
  }

  protected calculateMatches(userNumbers: Lotto6aus49Numbers, draw: Lotto6aus49Draw): Record<string, number> {
    const regularMatches = userNumbers.regular.filter(num => draw.regular_numbers.includes(num)).length;
    const bonusMatches = userNumbers.bonus.filter(num => draw.bonus_numbers.includes(num)).length;
    
    return {
      regular: regularMatches,
      bonus: bonusMatches
    };
  }

  protected calculatePrize(matches: Record<string, number>): number {
    const regularMatches = matches.regular;
    const bonusMatch = matches.bonus > 0;
    
    if (regularMatches === 6) return 1000000;
    if (regularMatches === 5 && bonusMatch) return 100000;
    if (regularMatches === 5) return 3000;
    if (regularMatches === 4) return 50;
    if (regularMatches === 3) return 10;
    return 0;
  }
}