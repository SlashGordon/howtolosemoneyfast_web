import { BaseLotteryService } from './baseLotteryService';
import type { EurojackpotNumbers } from '../types/eurojackpot';
import { getHistoricalDraws } from '../data/historicalEurojackpot';

interface EurojackpotDraw extends EurojackpotNumbers {
  date: string;
}

export class EurojackpotService extends BaseLotteryService<EurojackpotDraw, EurojackpotNumbers> {
  private static instance: EurojackpotService;

  private constructor() {
    super();
  }

  public static getInstance(): EurojackpotService {
    if (!EurojackpotService.instance) {
      EurojackpotService.instance = new EurojackpotService();
    }
    return EurojackpotService.instance;
  }

  protected async loadHistoricalData(): Promise<EurojackpotDraw[]> {
    const draws = await getHistoricalDraws();
    return draws.map(draw => ({
      date: draw.date || '',
      mainNumbers: draw.mainNumbers,
      euroNumbers: draw.euroNumbers,
      prizeDistribution: draw.prizeDistribution
    }));
  }

  protected validateNumbers(numbers: EurojackpotNumbers): boolean {
    if (numbers.mainNumbers.length !== 5 || numbers.euroNumbers.length !== 2) return false;
    
    const uniqueMain = new Set(numbers.mainNumbers);
    const uniqueEuro = new Set(numbers.euroNumbers);
    if (uniqueMain.size !== 5 || uniqueEuro.size !== 2) return false;
    
    return numbers.mainNumbers.every(num => num >= 1 && num <= 50) &&
           numbers.euroNumbers.every(num => num >= 1 && num <= 12);
  }

  protected calculateMatches(userNumbers: EurojackpotNumbers, draw: EurojackpotDraw): Record<string, number> {
    const mainMatches = userNumbers.mainNumbers.filter(num => draw.mainNumbers.includes(num)).length;
    const euroMatches = userNumbers.euroNumbers.filter(num => draw.euroNumbers.includes(num)).length;
    
    return {
      main: mainMatches,
      euro: euroMatches,
      draw: draw as any // Store draw reference for prize calculation
    };
  }

  protected calculatePrize(matches: Record<string, number>): number {
    const mainMatches = matches.main;
    const euroMatches = matches.euro;
    const draw = matches.draw as unknown as EurojackpotDraw;
    
    // Use actual prize distribution from the draw if available
    if (draw?.prizeDistribution) {
      const matchKey = `${mainMatches} + ${euroMatches}`;
      return draw.prizeDistribution[matchKey] || 0;
    }
    
    // Fallback to estimated prizes if no prize distribution available
    if (mainMatches === 5 && euroMatches === 2) return 10000000;
    if (mainMatches === 5 && euroMatches === 1) return 500000;
    if (mainMatches === 5 && euroMatches === 0) return 100000;
    if (mainMatches === 4 && euroMatches === 2) return 5000;
    if (mainMatches === 4 && euroMatches === 1) return 300;
    if (mainMatches === 4 && euroMatches === 0) return 150;
    if (mainMatches === 3 && euroMatches === 2) return 70;
    if (mainMatches === 2 && euroMatches === 2) return 25;
    if (mainMatches === 3 && euroMatches === 1) return 20;
    if (mainMatches === 3 && euroMatches === 0) return 15;
    if (mainMatches === 1 && euroMatches === 2) return 10;
    if (mainMatches === 2 && euroMatches === 1) return 8;
    return 0;
  }
}
