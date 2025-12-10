import { BaseLotteryDownloader } from './baseLotteryDownloader';
import { BaseLotteryRawData } from './baseLotteryData';
import { fileURLToPath } from 'url';

class Lotto6aus49Downloader extends BaseLotteryDownloader<BaseLotteryRawData, BaseLotteryRawData> {
  constructor() {
    super({
      url: 'https://raw.githubusercontent.com/SlashGordon/howtolosemoneyfast/main/lotto_6aus49_results.json',
      outputFileName: 'historicalLotto6aus49.ts',
      typeImport: "import type { Lotto6aus49Draw } from '../types/lotto6aus49';",
      exportName: 'Lotto6aus49Draw',
      processData: (rawData: BaseLotteryRawData[]) => rawData.map(item => ({
        ...item,
        date: item.draw_date,
        regular_numbers: item.regular_numbers.sort((a, b) => a - b)
      }))
    });
  }
}

export async function downloadLotto6aus49Data() {
  const downloader = new Lotto6aus49Downloader();
  return downloader.download();
}

// Allow running directly as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  downloadLotto6aus49Data().catch(() => process.exit(1));
}