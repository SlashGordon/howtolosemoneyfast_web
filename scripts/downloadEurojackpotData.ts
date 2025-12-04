// downloadEurojackpotData.ts
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the structure of the raw data from the API
interface RawEurojackpotData {
  regular_numbers: number[];
  bonus_numbers: number[];
  draw_date: string;
  prize_distribution: Record<string, number>;
}

// Define the structure of our processed data
interface EurojackpotNumbers {
  mainNumbers: number[];
  euroNumbers: number[];
  date: string;
  prizeDistribution: Record<string, number>;
}

// GitHub raw content URL for the eurojackpot_results.json file
const url = 'https://raw.githubusercontent.com/SlashGordon/howtolosemoneyfast/main/eurojackpot_results.json';

export async function downloadEurojackpotData() {
  console.log('Downloading Eurojackpot data...');
  
  return new Promise<void>((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data) as RawEurojackpotData[];
          
          // Convert the JSON data to EurojackpotNumbers format
          const eurojackpotData: EurojackpotNumbers[] = jsonData.map(item => ({
            mainNumbers: item.regular_numbers.sort((a, b) => a - b),
            euroNumbers: item.bonus_numbers.sort((a, b) => a - b),
            date: item.draw_date,
            prizeDistribution: item.prize_distribution
          }));

          // Get the output path
          const __dirname = path.dirname(fileURLToPath(import.meta.url));
          const outputDir = path.join(__dirname, '../src/data');
          const outputPath = path.join(outputDir, 'historicalEurojackpot.ts');
          
          // Create the data directory if it doesn't exist
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          // Generate TypeScript file content
          const tsContent = `import type { EurojackpotNumbers } from '../types/eurojackpot';\n\n// Historical EuroJackpot data\n// Auto-generated from https://github.com/SlashGordon/howtolosemoneyfast/blob/main/eurojackpot_results.json\nexport const historicalDraws: EurojackpotNumbers[] = ${JSON.stringify(eurojackpotData, null, 2)};\n`;

          // Write to file
          fs.writeFileSync(outputPath, tsContent);
          console.log(`Successfully updated ${outputPath}`);
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

// Allow running directly as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  downloadEurojackpotData().catch(() => process.exit(1));
}