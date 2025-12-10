import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

export interface LotteryDownloadConfig<TRaw, TProcessed> {
  url: string;
  outputFileName: string;
  typeImport: string;
  exportName: string;
  processData: (rawData: TRaw[]) => TProcessed[];
}

export abstract class BaseLotteryDownloader<TRaw, TProcessed> {
  protected config: LotteryDownloadConfig<TRaw, TProcessed>;

  constructor(config: LotteryDownloadConfig<TRaw, TProcessed>) {
    this.config = config;
  }

  public async download(): Promise<void> {
    console.log(`Downloading ${this.config.exportName} data...`);
    
    return new Promise<void>((resolve, reject) => {
      https.get(this.config.url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data) as TRaw[];
            const processedData = this.config.processData(jsonData);

            const __dirname = path.dirname(fileURLToPath(import.meta.url));
            const outputDir = path.join(__dirname, '../src/data');
            
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

            const byYear = new Map<number, TProcessed[]>();
            processedData.forEach(draw => {
              const year = new Date((draw as any).date).getFullYear();
              if (!byYear.has(year)) byYear.set(year, []);
              byYear.get(year)!.push(draw);
            });

            byYear.forEach((draws, year) => {
              const outputPath = path.join(outputDir, `${this.config.outputFileName.replace('.ts', '')}-${year}.json.gz`);
              const content = JSON.stringify(draws);
              const compressed = gzipSync(content);
              fs.writeFileSync(outputPath, compressed);
            });

            console.log(`Successfully created ${byYear.size} year partitions`);
            resolve();
          } catch (error) {
            console.error('Error processing data:', error);
            reject(error);
          }
        });
      }).on('error', (error) => {
        console.error('Error downloading data:', error);
        reject(error);
      });
    });
  }
}