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
    
    // Get the response as an ArrayBuffer for decompression
    const arrayBuffer = await response.arrayBuffer();
    console.log(`[HistoricalDataLoader] Downloaded ${arrayBuffer.byteLength} bytes for file`);
    
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check if the data is gzipped by looking at the magic number (0x1f8b for gzip)
    const isGzipped = uint8Array.length >= 2 && uint8Array[0] === 0x1f && uint8Array[1] === 0x8b;
    
    let decompressed: string;
    if (isGzipped) {
      // Decompress the gzipped data
      console.log(`[HistoricalDataLoader] Data is gzipped, decompressing...`);
      decompressed = pako.ungzip(uint8Array, { to: 'string' });
    } else {
      // Data is already uncompressed (dev mode)
      console.log(`[HistoricalDataLoader] Data is not gzipped, using as-is`);
      decompressed = new TextDecoder().decode(uint8Array);
    }
    
    console.log(`[HistoricalDataLoader] Final data length: ${decompressed.length} characters`);
    
    const data = JSON.parse(decompressed);
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
