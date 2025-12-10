import pako from 'pako';

async function loadFromDisk(filename: string): Promise<any[]> {
  try {
    // Only executed on server during SSR
    // @vite-ignore
    const { readFileSync } = await import('fs');
    // @vite-ignore
    const { fileURLToPath } = await import('url');
    // @vite-ignore
    const { dirname, join } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Try multiple possible paths
    let dataPath = join(__dirname, '../../public/data', filename);
    
    // If that doesn't exist, try from project root
    try {
      require('fs').accessSync(dataPath);
    } catch {
      // Try alternative path
      dataPath = join(process.cwd(), 'public/data', filename);
    }
    
    console.log(`[HistoricalDataLoader] Reading from disk: ${dataPath}`);
    
    const gzipData = readFileSync(dataPath);
    const decompressed = pako.ungzip(gzipData, { to: 'string' });
    const data = JSON.parse(decompressed);
    
    return data;
  } catch (error) {
    console.error(`[HistoricalDataLoader] Error reading from disk (${filename}):`, error);
    return [];
  }
}

async function loadFromFetch(filename: string): Promise<any[]> {
  try {
    const url = `/data/${filename}`;
    console.log(`[HistoricalDataLoader] Fetching: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`[HistoricalDataLoader] Failed to fetch ${url} - Status: ${response.status}`);
      return [];
    }
    
    console.log(`[HistoricalDataLoader] Got response for ${url}, Content-Length: ${response.headers.get('content-length')} bytes`);
    
    // The server automatically decompresses .gz files, so we get plain JSON
    const text = await response.text();
    console.log(`[HistoricalDataLoader] Downloaded ${text.length} characters for file`);
    
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error(`[HistoricalDataLoader] Error fetching ${filename}:`, error);
    return [];
  }
}

export async function loadHistoricalDraws(lotteryType: string, startYear: number, maxYearsToLoad: number = 10): Promise<any[]> {
  console.log(`[HistoricalDataLoader] Loading ${lotteryType} data from ${startYear} (max ${maxYearsToLoad} years)`);
  
  const currentYear = new Date().getFullYear();
  
  // Limit the years to load for performance
  const yearsToLoad = Math.min(maxYearsToLoad, currentYear - startYear + 1);
  const loadStartYear = currentYear - yearsToLoad + 1;
  
  const years = Array.from({ length: yearsToLoad }, (_, i) => loadStartYear + i);
  console.log(`[HistoricalDataLoader] Years to fetch: ${years.join(', ')}`);
  
  // Determine if running on server or browser
  const isServer = typeof window === 'undefined';
  
  const chunks = await Promise.all(
    years.map(async year => {
      const filename = `historical${lotteryType}-${year}.json.gz`;
      
      try {
        if (isServer) {
          // Server-side: read from filesystem
          const data = await loadFromDisk(filename);
          if (data.length > 0) {
            console.log(`[HistoricalDataLoader] Loaded ${year}: ${data.length} records from disk`);
          }
          return data;
        } else {
          // Browser-side: use fetch
          const data = await loadFromFetch(filename);
          if (data.length > 0) {
            console.log(`[HistoricalDataLoader] Parsed ${year}: ${data.length} records`);
          }
          return data;
        }
      } catch (error) {
        console.error(`[HistoricalDataLoader] Error loading ${filename}:`, error);
        return [];
      }
    })
  );
  
  const flattened = chunks.flat();
  console.log(`[HistoricalDataLoader] Total records loaded for ${lotteryType}: ${flattened.length}`);
  
  return flattened;
}
