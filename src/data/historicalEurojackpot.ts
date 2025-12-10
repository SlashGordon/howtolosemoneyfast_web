import type { EurojackpotNumbers } from '../types/eurojackpot';
import { loadHistoricalDraws } from '../utils/historicalDataLoader';

let historicalDrawsCache: EurojackpotNumbers[] = [];
let loadingPromise: Promise<EurojackpotNumbers[]> | null = null;
let maxYearsLoaded = 0; // Track maximum years loaded so far

export async function getHistoricalDraws(maxYears: number = 10): Promise<EurojackpotNumbers[]> {
  // If we already have data and it meets or exceeds the requested amount, return it
  // OR if we have cached data and we're just requesting a small amount, return cached
  if (historicalDrawsCache.length > 0 && (maxYearsLoaded >= maxYears || maxYears <= 10)) return historicalDrawsCache;
  
  // If we're currently loading, wait for that to complete
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = loadHistoricalDraws('Eurojackpot', 2017, maxYears).then(data => {
    historicalDrawsCache = data;
    maxYearsLoaded = Math.max(maxYearsLoaded, maxYears);
    return data;
  });
  
  return loadingPromise;
}
