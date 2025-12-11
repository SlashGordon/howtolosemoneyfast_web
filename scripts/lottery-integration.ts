// lottery-integration.ts
import type { AstroIntegration } from 'astro';
import { downloadEurojackpotData } from './downloadEurojackpotData';
import { downloadLotto6aus49Data } from './downloadLotto6aus49Data';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export default function lotteryIntegration(): AstroIntegration {
  return {
    name: 'lottery-data-integration',
    hooks: {
      'astro:build:setup': async () => {
        // Download lottery data before build starts
        await downloadEurojackpotData();
        await downloadLotto6aus49Data();
        
        // Copy data files to public/data
        const srcDir = join(process.cwd(), 'src/data');
        const destDir = join(process.cwd(), 'public/data');
        mkdirSync(destDir, { recursive: true });
        
        const files = readdirSync(srcDir).filter(f => f.endsWith('.json.gz'));
        files.forEach(file => {
          copyFileSync(join(srcDir, file), join(destDir, file));
        });
      }
    }
  };
}