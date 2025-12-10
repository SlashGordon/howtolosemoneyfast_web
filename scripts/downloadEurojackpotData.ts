import { BaseLotteryDownloader } from './baseLotteryDownloader';
import { BaseLotteryRawData } from './baseLotteryData';
import { fileURLToPath } from 'url';

interface EurojackpotNumbers {
  mainNumbers: number[];
  euroNumbers: number[];
  date: string;
  prizeDistribution: Record<string, number>;
}

class EurojackpotDownloader extends BaseLotteryDownloader<BaseLotteryRawData, EurojackpotNumbers> {
  constructor() {
    super({
      url: 'https://raw.githubusercontent.com/SlashGordon/howtolosemoneyfast/main/eurojackpot_results.json',
      outputFileName: 'historicalEurojackpot.ts',
      typeImport: "import type { EurojackpotNumbers } from '../types/eurojackpot';",
      exportName: 'EurojackpotNumbers',
      processData: (rawData: BaseLotteryRawData[]) => rawData.map(item => ({
        mainNumbers: item.regular_numbers.sort((a, b) => a - b),
        euroNumbers: item.bonus_numbers.sort((a, b) => a - b),
        date: item.draw_date,
        prizeDistribution: item.prize_distribution
      }))
    });
  }
}

export async function downloadEurojackpotData() {
  const downloader = new EurojackpotDownloader();
  return downloader.download();
}

// Allow running directly as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  downloadEurojackpotData().catch(() => process.exit(1));
}