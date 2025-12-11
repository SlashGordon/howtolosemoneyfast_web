import Chart from 'chart.js/auto';
import type { EurojackpotNumbers } from '../types/eurojackpot';

interface Translations {
  frequency: string;
  number: string;
  mainNumbersSum: string;
  euroNumbersSum: string;
  copiedSuccess: string;
  copyError: string;
  pair?: string;
  triplet?: string;
  occurrences?: string;
  mostCommonEuroPairs?: string;
}

interface NumberFrequency {
  [key: number]: number;
}

interface NumberWithFrequency {
  number: number;
  frequency: number;
}

export function initializeHistoryPage(
  translations: Translations,
  downloadFilename: string,
  historicalDraws: EurojackpotNumbers[]
): void {
  console.log('[initializeHistoryPage] Starting with', historicalDraws.length, 'draws');
  console.log('[initializeHistoryPage] First draw:', historicalDraws[0]);
  
  setupDownloadButton(downloadFilename, historicalDraws);
  setupCopyButton(translations, historicalDraws);

  // Initialize charts and statistics
  console.log('[initializeHistoryPage] Calling initializeCharts');
  initializeCharts(translations, historicalDraws);
  console.log('[initializeHistoryPage] Calling displayHotColdNumbers');
  displayHotColdNumbers(historicalDraws);
  console.log('[initializeHistoryPage] Calling displayPairAnalysis');
  displayPairAnalysis(historicalDraws);
  console.log('[initializeHistoryPage] All initialization complete');
}


function setupDownloadButton(
  downloadFilename: string,
  historicalDraws: EurojackpotNumbers[]
): void {
  const downloadBtn = document.getElementById('download-json');
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      // Create a JSON blob and download it
      const jsonData = JSON.stringify(historicalDraws, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

function setupCopyButton(
  translations: Translations,
  historicalDraws: EurojackpotNumbers[]
): void {
  const copyBtn = document.getElementById('copy-json');
  
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      // Copy JSON data to clipboard
      const jsonData = JSON.stringify(historicalDraws, null, 2);
      try {
        await navigator.clipboard.writeText(jsonData);
        alert(translations.copiedSuccess);
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert(translations.copyError);
      }
    });
  }
}

function initializeCharts(
  translations: Translations,
  historicalDraws: EurojackpotNumbers[]
): void {
  console.log('[initializeCharts] Starting with', historicalDraws.length, 'draws');
  
  // Detect ranges from data
  const mainNumbers = historicalDraws
    .flatMap(d => d.mainNumbers || (d as any).regular_numbers || [])
    .filter((n: number) => typeof n === 'number' && n >= 0);
  const euroNumbers = historicalDraws
    .flatMap(d => d.euroNumbers || (d as any).bonus_numbers || [])
    .filter((n: number) => typeof n === 'number' && n >= 0);
  
  console.log('[initializeCharts] Main numbers array:', mainNumbers.slice(0, 10), '... Total:', mainNumbers.length);
  console.log('[initializeCharts] Euro numbers array:', euroNumbers.slice(0, 10), '... Total:', euroNumbers.length);
  
  const maxMain = Math.max(...mainNumbers, 50);
  const maxEuro = Math.max(...euroNumbers, 12);
  
  // Calculate frequency of main numbers
  const mainNumberFrequency: NumberFrequency = {};
  for (let i = 1; i <= maxMain; i++) {
    mainNumberFrequency[i] = 0;
  }
  
  // Calculate frequency of euro numbers
  const euroNumberFrequency: NumberFrequency = {};
  for (let i = 0; i <= maxEuro; i++) {
    euroNumberFrequency[i] = 0;
  }
  
  // Calculate sums over time
  const dates: string[] = [];
  const mainSums: number[] = [];
  const euroSums: number[] = [];
  
  historicalDraws.forEach(draw => {
    // Count main numbers (support both formats)
    const mains = (draw.mainNumbers || (draw as any).regular_numbers || []).filter((n: number) => typeof n === 'number' && n >= 0);
    mains.forEach((num: number) => {
      if (mainNumberFrequency[num] !== undefined) mainNumberFrequency[num]++;
    });
    
    // Count euro numbers (support both formats)
    const euros = (draw.euroNumbers || (draw as any).bonus_numbers || []).filter((n: number) => typeof n === 'number' && n >= 0);
    euros.forEach((num: number) => {
      if (euroNumberFrequency[num] !== undefined) euroNumberFrequency[num]++;
    });
    
    // Calculate sums for trend chart
    const mainSum = mains.reduce((sum: number, num: number) => sum + num, 0);
    const euroSum = euros.reduce((sum: number, num: number) => sum + num, 0);
    
    const date = new Date(draw.date || '');
    const formattedDate = date.toLocaleDateString(navigator.language, { 
      year: 'numeric', 
      month: 'short'
    });
    
    dates.push(formattedDate);
    mainSums.push(mainSum);
    euroSums.push(euroSum);
  });
  
  createMainNumbersChart(translations, mainNumberFrequency);
  createEuroNumbersChart(translations, euroNumberFrequency);
  createSumTrendsChart(translations, dates, mainSums, euroSums);
}

function createMainNumbersChart(
  translations: Translations,
  mainNumberFrequency: NumberFrequency
): void {
  const mainCtx = document.getElementById('mainNumbersChart') as HTMLCanvasElement | null;
  if (mainCtx) {
    // Sort numbers by frequency (high to low)
    const sortedEntries = Object.entries(mainNumberFrequency)
      .map(([number, frequency]) => ({ number: parseInt(number), frequency }))
      .sort((a, b) => b.frequency - a.frequency);
    
    const sortedLabels = sortedEntries.map(entry => entry.number.toString());
    const sortedData = sortedEntries.map(entry => entry.frequency);
    
    new Chart(mainCtx, {
      type: 'bar',
      data: {
        labels: sortedLabels,
        datasets: [{
          label: translations.frequency,
          data: sortedData,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                return `${translations.number}: ${tooltipItems[0].label}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            }
          }
        }
      }
    });
  }
}

function createEuroNumbersChart(
  translations: Translations,
  euroNumberFrequency: NumberFrequency
): void {
  const euroCtx = document.getElementById('euroNumbersChart') as HTMLCanvasElement | null;
  if (euroCtx) {
    // Sort numbers by frequency (high to low)
    const sortedEntries = Object.entries(euroNumberFrequency)
      .map(([number, frequency]) => ({ number: parseInt(number), frequency }))
      .sort((a, b) => b.frequency - a.frequency);
    
    const sortedLabels = sortedEntries.map(entry => entry.number.toString());
    const sortedData = sortedEntries.map(entry => entry.frequency);
    
    new Chart(euroCtx, {
      type: 'bar',
      data: {
        labels: sortedLabels,
        datasets: [{
          label: translations.frequency,
          data: sortedData,
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                return `${translations.number}: ${tooltipItems[0].label}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        }
      }
    });
  }
}

function createSumTrendsChart(
  translations: Translations,
  dates: string[],
  mainSums: number[],
  euroSums: number[]
): void {
  const sumCtx = document.getElementById('sumTrendsChart') as HTMLCanvasElement | null;
  if (sumCtx) {
    // Get only the last 50 draws for better visibility
    const recentDates = dates.slice(-50);
    const recentMainSums = mainSums.slice(-50);
    const recentEuroSums = euroSums.slice(-50);
    
    new Chart(sumCtx, {
      type: 'line',
      data: {
        labels: recentDates,
        datasets: [
          {
            label: translations.mainNumbersSum,
            data: recentMainSums,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          },
          {
            label: translations.euroNumbersSum,
            data: recentEuroSums,
            borderColor: 'rgba(245, 158, 11, 1)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        },
        scales: {
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 10
            }
          }
        }
      }
    });
  }
}

function displayHotColdNumbers(historicalDraws: EurojackpotNumbers[]): void {
  console.log('[displayHotColdNumbers] Starting with', historicalDraws.length, 'draws');
  
  // Detect ranges from data
  const mainNumbers = historicalDraws
    .flatMap(d => d.mainNumbers || (d as any).regular_numbers || [])
    .filter((n: number) => typeof n === 'number' && n >= 0);
  const euroNumbers = historicalDraws
    .flatMap(d => d.euroNumbers || (d as any).bonus_numbers || [])
    .filter((n: number) => typeof n === 'number' && n >= 0);
  
  console.log('[displayHotColdNumbers] Total main numbers:', mainNumbers.length, 'Total euro numbers:', euroNumbers.length);
  
  const maxMain = Math.max(...mainNumbers, 50);
  const maxEuro = Math.max(...euroNumbers, 12);
  
  console.log('[displayHotColdNumbers] Max main:', maxMain, 'Max euro:', maxEuro);
  
  // Calculate frequency of main numbers
  const mainNumberFrequency: NumberFrequency = {};
  for (let i = 1; i <= maxMain; i++) {
    mainNumberFrequency[i] = 0;
  }
  
  // Calculate frequency of euro numbers
  const euroNumberFrequency: NumberFrequency = {};
  for (let i = 0; i <= maxEuro; i++) {
    euroNumberFrequency[i] = 0;
  }
  
  historicalDraws.forEach(draw => {
    // Count main numbers (support both formats)
    const mains = (draw.mainNumbers || (draw as any).regular_numbers || []).filter((n: number) => typeof n === 'number' && n >= 0);
    mains.forEach((num: number) => {
      if (mainNumberFrequency[num] !== undefined) mainNumberFrequency[num]++;
    });
    
    // Count euro numbers (support both formats)
    const euros = (draw.euroNumbers || (draw as any).bonus_numbers || []).filter((n: number) => typeof n === 'number' && n >= 0);
    euros.forEach((num: number) => {
      if (euroNumberFrequency[num] !== undefined) euroNumberFrequency[num]++;
    });
  });
  
  // Sort main numbers by frequency
  const sortedMainNumbers: NumberWithFrequency[] = Object.entries(mainNumberFrequency)
    .map(([number, frequency]) => ({ number: parseInt(number), frequency }))
    .sort((a, b) => b.frequency - a.frequency);
  
  // Sort euro numbers by frequency
  const sortedEuroNumbers: NumberWithFrequency[] = Object.entries(euroNumberFrequency)
    .map(([number, frequency]) => ({ number: parseInt(number), frequency }))
    .sort((a, b) => b.frequency - a.frequency);
  
  // Get hot numbers (top 5)
  const hotMainNumbers = sortedMainNumbers.slice(0, 5);
  const hotEuroNumbers = sortedEuroNumbers.slice(0, 3);
  
  // Get cold numbers (bottom 5)
  const coldMainNumbers = sortedMainNumbers.slice(-5).reverse();
  const coldEuroNumbers = sortedEuroNumbers.slice(-3).reverse();
  
  console.log('[displayHotColdNumbers] Hot main:', hotMainNumbers);
  console.log('[displayHotColdNumbers] Hot euro:', hotEuroNumbers);
  console.log('[displayHotColdNumbers] Cold main:', coldMainNumbers);
  console.log('[displayHotColdNumbers] Cold euro:', coldEuroNumbers);
  
  displayNumbersInContainer('hotMainNumbers', hotMainNumbers, 'red-500');
  displayNumbersInContainer('hotEuroNumbers', hotEuroNumbers, 'yellow-500');
  displayNumbersInContainer('coldMainNumbers', coldMainNumbers, 'red-900');
  displayNumbersInContainer('coldEuroNumbers', coldEuroNumbers, 'yellow-900');
}

function displayNumbersInContainer(
  containerId: string,
  numbers: NumberWithFrequency[],
  colorClass: string
): void {
  console.log(`[displayNumbersInContainer] ${containerId}: ${numbers.length} numbers to display`);
  const container = document.getElementById(containerId);
  if (container) {
    console.log(`[displayNumbersInContainer] Found container ${containerId}`);
    numbers.forEach(item => {
      const numberBall = document.createElement('div');
      numberBall.className = 'flex flex-col items-center';
      
      // Use specific color values instead of Tailwind classes for better compatibility
      const bgColor = 
        colorClass === 'red-500' ? 'rgb(239, 68, 68)' :
        colorClass === 'yellow-500' ? 'rgb(245, 158, 11)' :
        colorClass === 'red-900' ? 'rgb(127, 29, 29)' :
        colorClass === 'yellow-900' ? 'rgb(120, 53, 15)' : 
        '#888888'; // Fallback gray
      
      numberBall.innerHTML = `
        <span class="inline-block w-8 h-8 rounded-full text-white text-center leading-8" style="background-color: ${bgColor}">${item.number}</span>
        <span class="text-xs text-gray-300 mt-1">${item.frequency}x</span>
      `;
      container.appendChild(numberBall);
    });
  } else {
    console.warn(`[displayNumbersInContainer] Container ${containerId} not found!`);
  }
}

function displayPairAnalysis(historicalDraws: EurojackpotNumbers[]): void {
  // Calculate pair frequencies
  const pairFrequency: { [key: string]: number } = {};
  const tripletFrequency: { [key: string]: number } = {};
  const euroPairFrequency: { [key: string]: number } = {};
  
  historicalDraws.forEach(draw => {
    const mainNumbers = (draw.mainNumbers || (draw as any).regular_numbers || []).slice().sort((a: number, b: number) => a - b);
    const euroNumbers = (draw.euroNumbers || (draw as any).bonus_numbers || []).slice().sort((a: number, b: number) => a - b);
    
    // Generate all pairs from main numbers
    for (let i = 0; i < mainNumbers.length - 1; i++) {
      for (let j = i + 1; j < mainNumbers.length; j++) {
        const pair = `${mainNumbers[i]}-${mainNumbers[j]}`;
        pairFrequency[pair] = (pairFrequency[pair] || 0) + 1;
      }
    }
    
    // Generate all triplets from main numbers
    for (let i = 0; i < mainNumbers.length - 2; i++) {
      for (let j = i + 1; j < mainNumbers.length - 1; j++) {
        for (let k = j + 1; k < mainNumbers.length; k++) {
          const triplet = `${mainNumbers[i]}-${mainNumbers[j]}-${mainNumbers[k]}`;
          tripletFrequency[triplet] = (tripletFrequency[triplet] || 0) + 1;
        }
      }
    }
    
    // Generate Euro number pair (only one pair possible with 2 numbers)
    if (euroNumbers.length === 2) {
      const euroPair = `${euroNumbers[0]}-${euroNumbers[1]}`;
      euroPairFrequency[euroPair] = (euroPairFrequency[euroPair] || 0) + 1;
    }
  });
  
  // Get top results
  const topPairs = Object.entries(pairFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
    
  const topTriplets = Object.entries(tripletFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
    
  const topEuroPairs = Object.entries(euroPairFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  displayPairsInContainer('commonPairs', topPairs);
  displayPairsInContainer('commonTriplets', topTriplets);
  displayEuroPairsInContainer('commonEuroPairs', topEuroPairs);
}

function displayPairsInContainer(
  containerId: string,
  pairs: [string, number][]
): void {
  const container = document.getElementById(containerId);
  if (container) {
    pairs.forEach(([combination, frequency]) => {
      const pairElement = document.createElement('div');
      pairElement.className = 'flex justify-between items-center bg-gray-700 px-3 py-2 rounded';
      
      const numbers = combination.split('-').map(num => parseInt(num));
      const numbersHtml = numbers.map(num => 
        `<span class="inline-block w-6 h-6 rounded-full bg-orange-500 text-white text-center text-xs leading-6">${num}</span>`
      ).join(' ');
      
      pairElement.innerHTML = `
        <div class="flex items-center space-x-1">${numbersHtml}</div>
        <span class="text-orange-300 font-semibold">${frequency}x</span>
      `;
      
      container.appendChild(pairElement);
    });
  }
}

function displayEuroPairsInContainer(
  containerId: string,
  pairs: [string, number][]
): void {
  const container = document.getElementById(containerId);
  if (container) {
    pairs.forEach(([combination, frequency]) => {
      // Guard against invalid frequency
      const freq = Number.isFinite(frequency) ? frequency : 0;
      
      const pairElement = document.createElement('div');
      pairElement.className = 'flex justify-between items-center bg-gray-700 px-3 py-2 rounded';
      
      // Parse numbers safely and filter out NaN
      const numbers = combination
        .split('-')
        .map(part => Number(part))
        .filter(n => Number.isFinite(n) && n >= 0);
      
      if (numbers.length < 2) {
        // Skip invalid or incomplete pairs
        return;
      }
      
      const numbersHtml = numbers.map(num => 
        `<span class="inline-block w-6 h-6 rounded-full bg-yellow-500 text-white text-center text-xs leading-6">${num}</span>`
      ).join(' ');
      
      pairElement.innerHTML = `
        <div class="flex items-center space-x-1">${numbersHtml}</div>
        <span class="text-yellow-300 font-semibold">${freq}x</span>
      `;
      
      container.appendChild(pairElement);
    });
  }
}