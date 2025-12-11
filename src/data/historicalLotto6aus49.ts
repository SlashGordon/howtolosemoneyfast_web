import type { Lotto6aus49Draw } from '../types/lotto6aus49';
import { loadHistoricalDraws as fetchHistoricalDraws } from '../utils/historicalDataLoader';

export let historicalDraws: Lotto6aus49Draw[] = [];
let loadingPromise: Promise<Lotto6aus49Draw[]> | null = null;
let maxYearsLoaded = 0; // Track maximum years loaded so far

export async function getHistoricalDraws(maxYears: number = 10): Promise<Lotto6aus49Draw[]> {
  // If we already have data and it meets or exceeds the requested amount, return it
  // OR if we have cached data and we're just requesting a small amount, return cached
  if (historicalDraws.length > 0 && (maxYearsLoaded >= maxYears || maxYears <= 10)) return historicalDraws;
  
  // If we're currently loading, wait for that to complete
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetchHistoricalDraws('Lotto6aus49', 1955, maxYears).then(data => {
    historicalDraws = data;
    maxYearsLoaded = Math.max(maxYearsLoaded, maxYears);
    return data;
  });

  return loadingPromise;
}

// Backwards-compatible export: some modules import `loadHistoricalDraws`
// directly from this data module. Provide a thin wrapper that returns
// the same data as `getHistoricalDraws()`.
export async function loadHistoricalDraws(maxYears: number = 10): Promise<Lotto6aus49Draw[]> {
  return getHistoricalDraws(maxYears);
}
