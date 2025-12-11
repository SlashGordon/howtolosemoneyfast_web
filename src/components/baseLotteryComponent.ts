import Chart from 'chart.js/auto';
import { i18n } from '../i18n/i18n';
import type { BaseLotteryService, LotteryResult, LotteryDraw, LotteryNumbers } from '../utils/baseLotteryService';

export interface LotteryConfig {
  name: string;
  mainNumbersCount: number;
  mainNumbersMax: number;
  bonusNumbersCount: number;
  bonusNumbersMax: number;
  mainNumbersLabel: string;
  bonusNumbersLabel: string;
  mainColor: string;
  bonusColor: string;
  defaultTicketPrice: number;
  i18nPrefix: string;
}

export abstract class BaseLotteryComponent<T extends LotteryDraw, N extends LotteryNumbers> {
  protected container: HTMLElement;
  protected service: BaseLotteryService<T, N>;
  protected savedNumbersContainer: HTMLElement | null = null;
  protected resultsContainer: HTMLElement | null = null;
  protected moneyWastedChart: Chart | null = null;
  protected config: LotteryConfig;
  // Removed spinner overlays; rely on Chart.js animation callbacks

  constructor(containerId: string, service: BaseLotteryService<T, N>, config: LotteryConfig) {
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }
    this.service = service;
    this.config = config;
  }

  protected async init(): Promise<void> {
    // Render without spinners
    this.render();
    // Show chart spinner immediately so users see feedback at page start
    this.ensureChartSpinner('money-wasted-chart').show();
    await this.service.initialize();
    this.render();
    this.savedNumbersContainer = document.getElementById('saved-numbers');
    this.resultsContainer = document.getElementById('results-container');
    this.updateTranslations();
    this.bindEvents();
    this.loadSavedNumbers();
    // Build chart; spinner will hide on animation complete
    this.initMoneyWastedChart();
    
    document.addEventListener('languageChanged', () => {
      this.updateTranslations();
    });
  }

  protected abstract getSavedNumbers(): any[];
  protected abstract saveNumbers(numbers: any): void;
  protected abstract deleteSavedNumber(index: number): void;
  protected abstract getHistoricalDraws(): any[];
  protected abstract calculateMoneyWasted(): any;

  protected render(): void {
    const mainInputs = Array.from({ length: this.config.mainNumbersCount }, (_, i) => 
      `<input type="number" min="1" max="${this.config.mainNumbersMax}" class="w-16 px-3 py-2 bg-gray-800 border-b-2 border-${this.config.mainColor}-400 focus:border-${this.config.mainColor}-300 outline-none text-white text-center transition-all" required aria-label="${this.config.mainNumbersLabel} ${i + 1}">`
    ).join('\n                ');

    const bonusInputs = Array.from({ length: this.config.bonusNumbersCount }, (_, i) => 
      `<input type="number" id="${this.config.bonusNumbersCount === 1 ? 'bonus-number' : ''}" min="${this.config.bonusNumbersMax === 9 ? '0' : '1'}" max="${this.config.bonusNumbersMax}" class="w-16 px-3 py-2 bg-gray-800 border-b-2 border-${this.config.bonusColor}-400 focus:border-${this.config.bonusColor}-300 outline-none text-white text-center transition-all" ${this.config.bonusNumbersCount === 1 ? '' : 'required'} aria-label="${this.config.bonusNumbersLabel} ${i + 1}">`
    ).join('\n                ');

    this.container.innerHTML = `
      <div class="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4 text-${this.config.mainColor}-300" data-i18n="${this.config.i18nPrefix}.title">${this.config.name}</h2>
        <p class="text-gray-300 mb-6" data-i18n="${this.config.i18nPrefix}.description">Enter your numbers</p>
        
        <div class="flex flex-wrap lg:flex-nowrap gap-6">
          <form id="lottery-form" class="mb-6 flex-1">
            <div class="mb-6">
              <label class="block text-gray-300 mb-3 text-sm font-medium" data-i18n="${this.config.i18nPrefix}.mainNumbers">${this.config.mainNumbersLabel}</label>
              <div class="flex flex-wrap gap-3 mb-2">
                ${mainInputs}
              </div>
            </div>
            
            ${this.config.bonusNumbersCount > 0 ? `<div class="mb-6">
              <label class="block text-gray-300 mb-3 text-sm font-medium" data-i18n="${this.config.i18nPrefix}.euroNumbers">${this.config.bonusNumbersLabel}</label>
              <div class="flex gap-3 mb-2">
                ${bonusInputs}
              </div>
            </div>` : ''}
            
            <div class="mb-6">
              <label class="block text-gray-300 mb-3 text-sm font-medium" data-i18n="${this.config.i18nPrefix}.ticketPrice">Ticket Price (€)</label>
              <div class="flex gap-3 mb-2">
                <input type="number" id="ticket-price" min="0" step="0.10" value="${this.config.defaultTicketPrice}" class="w-24 px-3 py-2 bg-gray-800 border-b-2 border-green-400 focus:border-green-300 outline-none text-white text-center transition-all">
              </div>
            </div>
            
            <div class="mb-6">
              <label class="block text-gray-300 mb-3 text-sm font-medium" data-i18n="${this.config.i18nPrefix}.dateRange">Date Range</label>
              <div class="flex flex-wrap gap-3 mb-2">
                <div>
                  <label class="text-xs text-gray-400 mb-1 block" data-i18n="${this.config.i18nPrefix}.startDate">Start</label>
                  <input type="date" id="start-date" class="w-40 px-3 py-2 bg-gray-800 border-b-2 border-blue-400 focus:border-blue-300 outline-none text-white text-center transition-all">
                </div>
                <div>
                  <label class="text-xs text-gray-400 mb-1 block" data-i18n="${this.config.i18nPrefix}.endDate">End</label>
                  <input type="date" id="end-date" class="w-40 px-3 py-2 bg-gray-800 border-b-2 border-blue-400 focus:border-blue-300 outline-none text-white text-center transition-all">
                </div>
              </div>
            </div>
            
            <div class="flex flex-wrap gap-3 items-center">
              <button type="submit" class="inline-flex bg-${this.config.mainColor}-500 hover:bg-${this.config.mainColor}-600 text-white font-medium py-3 px-6 rounded-md transition-all duration-300 shadow-md hover:shadow-lg items-center justify-center">
                <span data-i18n="${this.config.i18nPrefix}.saveCheck">Save & Check</span>
              </button>
              <button id="bulk-import-open" type="button" class="inline-flex bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-md transition-all duration-300 shadow-md hover:shadow-lg items-center justify-center">
                <span data-i18n="${this.config.i18nPrefix}.bulkImport">Bulk Import</span>
              </button>
            </div>
          </form>
          
          <div id="overall-stats" class="bg-gray-700 rounded-lg p-4 shadow-md w-full lg:w-80 h-fit">
            <h3 class="text-xl font-semibold mb-3 text-${this.config.mainColor}-300" data-i18n="${this.config.i18nPrefix}.overallStats">Stats</h3>
            <div class="space-y-4">
              <div>
                <p class="text-gray-300 text-sm mb-1" data-i18n="${this.config.i18nPrefix}.totalTickets">Tickets</p>
                <p class="text-2xl font-bold text-white" id="total-tickets">0</p>
              </div>
              <div>
                <p class="text-gray-300 text-sm mb-1" data-i18n="${this.config.i18nPrefix}.totalSpent">Spent</p>
                <p class="text-2xl font-bold text-red-400" id="total-spent">€0.00</p>
              </div>
              <div>
                <p class="text-gray-300 text-sm mb-1" data-i18n="${this.config.i18nPrefix}.totalWon">Won</p>
                <p class="text-2xl font-bold text-green-400" id="total-won">€0.00</p>
              </div>
              <div class="pt-2 border-t border-gray-600">
                <p class="text-gray-300 text-sm mb-1" data-i18n="${this.config.i18nPrefix}.netProfit">Net</p>
                <p class="text-2xl font-bold" id="net-profit">€0.00</p>
              </div>
              <div class="pt-2 border-t border-gray-600">
                <p class="text-gray-300 text-sm mb-1" data-i18n="${this.config.i18nPrefix}.bestWin">Best</p>
                <p class="text-xl font-bold text-green-400" id="best-win">€0.00</p>
              </div>
              <div>
                <p class="text-gray-300 text-sm mb-1" data-i18n="${this.config.i18nPrefix}.roi">ROI</p>
                <p class="text-xl font-bold" id="roi">0%</p>
              </div>
            </div>
          </div>
        </div>
        
        <div id="saved-numbers" class="mb-6">
          <h3 class="text-xl font-semibold mb-2 text-${this.config.mainColor}-300" data-i18n="${this.config.i18nPrefix}.savedNumbers">Saved</h3>
          <div class="saved-numbers-list text-gray-300">
            <p class="text-gray-500 italic" data-i18n="${this.config.i18nPrefix}.noNumbersSaved">None</p>
          </div>
        </div>

        <!-- Overlay Modal for Bulk Import -->
        <div id="bulk-import-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden z-50 flex items-center justify-center">
          <div class="bg-gray-800 w-full max-w-2xl mx-4 rounded-lg shadow-xl border border-gray-700">
            <div class="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
              <h4 class="text-lg font-semibold text-${this.config.mainColor}-300" data-i18n="${this.config.i18nPrefix}.bulkImport">Bulk Import</h4>
              <button id="bulk-import-close" class="text-gray-400 hover:text-white">✕</button>
            </div>
            <div class="px-5 py-4">
              <p class="text-gray-400 text-sm mb-2" data-i18n="${this.config.i18nPrefix}.bulkImportDescription">Paste JSON array of number sets.</p>
              <textarea id="bulk-import" class="w-full h-48 p-3 bg-gray-900 border border-gray-700 rounded text-white text-sm" placeholder="Paste JSON here..."></textarea>
            </div>
            <div class="px-5 py-4 border-t border-gray-700 flex justify-end gap-2">
              <button id="bulk-import-cancel" class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded-md">Cancel</button>
              <button id="bulk-import-btn" class="bg-${this.config.mainColor}-500 hover:bg-${this.config.mainColor}-600 text-white text-sm font-medium py-2 px-4 rounded-md">Import</button>
            </div>
          </div>
        </div>
        
        <div id="results-container" class="hidden">
          <h3 class="text-xl font-semibold mb-2 text-${this.config.mainColor}-300" data-i18n="${this.config.i18nPrefix}.results">Results</h3>
          <div class="results-list"></div>
        </div>

        <div id="money-wasted-container" class="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 p-6 mt-8">
          <h3 class="text-xl font-semibold mb-4 text-${this.config.mainColor}-300" data-i18n="moneyWasted.title">Money Wasted</h3>
          <div class="h-80">
            <canvas id="money-wasted-chart"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  protected updateTranslations(): void {
    this.container.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = i18n.translate(key);
      }
    });
    this.loadSavedNumbers();
  }

  protected bindEvents(): void {
    const form = document.getElementById('lottery-form') as HTMLFormElement;
    const startDateInput = document.getElementById('start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('end-date') as HTMLInputElement;
    const bulkOpen = document.getElementById('bulk-import-open') as HTMLButtonElement | null;
    const bulkOverlay = document.getElementById('bulk-import-overlay') as HTMLDivElement | null;
    const bulkClose = document.getElementById('bulk-import-close') as HTMLButtonElement | null;
    const bulkCancel = document.getElementById('bulk-import-cancel') as HTMLButtonElement | null;
    const bulkBtn = document.getElementById('bulk-import-btn') as HTMLButtonElement | null;
    const bulkText = document.getElementById('bulk-import') as HTMLTextAreaElement | null;
    
    const dateRange = this.getDateRange();
    if (dateRange.firstDate) startDateInput.value = dateRange.firstDate;
    if (dateRange.latestDate) endDateInput.value = dateRange.latestDate;
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(form);
    });
    
    startDateInput.addEventListener('change', () => this.updateResultsForDateChange());
    endDateInput.addEventListener('change', () => this.updateResultsForDateChange());

    if (bulkOpen && bulkOverlay) {
      bulkOpen.addEventListener('click', () => {
        bulkOverlay.classList.remove('hidden');
      });
    }

    const closeOverlay = () => {
      if (bulkOverlay) bulkOverlay.classList.add('hidden');
    };

    if (bulkClose) bulkClose.addEventListener('click', closeOverlay);
    if (bulkCancel) bulkCancel.addEventListener('click', closeOverlay);

    if (bulkBtn && bulkText) {
      bulkBtn.addEventListener('click', () => {
        const payload = bulkText.value.trim();
        if (!payload) return;
        try {
          this.handleBulkImport(payload);
          bulkText.value = '';
          closeOverlay();
        } catch (e) {
          alert('Invalid bulk import format');
        }
      });
    }
  }

  protected getDateRange(): { firstDate: string | null; latestDate: string | null } {
    const draws = this.getHistoricalDraws();
    if (draws.length === 0) return { firstDate: null, latestDate: null };
    
    const dates = draws.map(d => d.date).filter(Boolean).sort();
    return {
      firstDate: dates[0] || null,
      latestDate: dates[dates.length - 1] || null
    };
  }

  protected abstract handleFormSubmit(form: HTMLFormElement): void;
  protected handleBulkImport(_data: string): void { /* optional override in child components */ }
  
  protected updateResultsForDateChange(): void {
    const savedNumbers = this.getSavedNumbers();
    this.updateOverallStats(savedNumbers);
    this.updateMoneyWastedChart();
    
    if (!this.resultsContainer?.classList.contains('hidden')) {
      const lastCheckedNumbers = this.resultsContainer?.dataset.lastCheckedNumbers;
      if (lastCheckedNumbers) {
        const numbers = JSON.parse(lastCheckedNumbers);
        this.compareAndDisplayResults(numbers);
      }
    }
  }

  protected loadSavedNumbers(): void {
    const savedNumbers = this.getSavedNumbers();
    if (!this.savedNumbersContainer) return;
    const listContainer = this.savedNumbersContainer.querySelector('.saved-numbers-list') as HTMLElement;
    
    if (savedNumbers.length === 0) {
      listContainer.innerHTML = `<p class="text-gray-500 italic">${i18n.translate(this.config.i18nPrefix + '.noNumbersSaved')}</p>`;
      this.updateOverallStats(savedNumbers);
      return;
    }
    
    listContainer.innerHTML = '';
    savedNumbers.forEach((numbers: any, index: number) => {
      const element = this.createSavedNumberElement(numbers, index);
      listContainer.appendChild(element);
    });
    
    this.updateOverallStats(savedNumbers);
  }

  protected abstract createSavedNumberElement(numbers: any, index: number): HTMLElement;

  protected updateOverallStats(savedNumbers: any[]): void {
    const totalTicketsEl = document.getElementById('total-tickets') as HTMLElement;
    const totalSpentEl = document.getElementById('total-spent') as HTMLElement;
    const totalWonEl = document.getElementById('total-won') as HTMLElement;
    const netProfitEl = document.getElementById('net-profit') as HTMLElement;
    const bestWinEl = document.getElementById('best-win') as HTMLElement;
    const roiEl = document.getElementById('roi') as HTMLElement;
    
    if (!totalTicketsEl) return;
    
    const startDateInput = document.getElementById('start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('end-date') as HTMLInputElement;
    const startDate = startDateInput?.value || undefined;
    const endDate = endDateInput?.value || undefined;
    
    const drawsInRange = this.getHistoricalDraws().filter(draw => {
      if (!draw.date) return false;
      if (startDate && draw.date < startDate) return false;
      if (endDate && draw.date > endDate) return false;
      return true;
    });
    
    const numberOfDraws = drawsInRange.length || this.getHistoricalDraws().length;
    
    let totalSpent = 0;
    let totalWon = 0;
    let bestWin = 0;
    let bestWinDate = '';
    
    savedNumbers.forEach(ticket => {
      const ticketPrice = ticket.ticketPrice || this.config.defaultTicketPrice;
      totalSpent += ticketPrice * numberOfDraws;
      
      const results = this.service.checkNumbers(ticket, startDate, endDate);
      results.forEach(result => {
        if (result.isWinner && result.prize) {
          totalWon += result.prize;
          if (result.prize > bestWin) {
            bestWin = result.prize;
            bestWinDate = result.draw.date || '';
          }
        }
      });
    });
    
    const netProfit = totalWon - totalSpent;
    const roi = totalSpent > 0 ? (totalWon / totalSpent) * 100 : 0;
    
    totalTicketsEl.textContent = savedNumbers.length.toString();
    totalSpentEl.textContent = `€${totalSpent.toFixed(2)}`;
    totalWonEl.textContent = `€${totalWon.toFixed(2)}`;
    netProfitEl.textContent = `€${netProfit.toFixed(2)}`;
    netProfitEl.className = netProfit >= 0 ? 'text-2xl font-bold text-green-400' : 'text-2xl font-bold text-red-400';
    
    if (bestWin > 0 && bestWinDate) {
      bestWinEl.textContent = `€${bestWin.toFixed(2)} (${new Date(bestWinDate).toLocaleDateString()})`;
    } else {
      bestWinEl.textContent = `€${bestWin.toFixed(2)}`;
    }
    
    roiEl.textContent = `${roi.toFixed(1)}%`;
    roiEl.className = roi >= 100 ? 'text-xl font-bold text-green-400' : 'text-xl font-bold text-red-400';
  }

  protected compareAndDisplayResults(numbers: any): void {
    const startDateInput = document.getElementById('start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('end-date') as HTMLInputElement;
    const startDate = startDateInput?.value || undefined;
    const endDate = endDateInput?.value || undefined;
    
    const results = this.service.checkNumbers(numbers, startDate, endDate);
    
    if (this.resultsContainer) {
      this.resultsContainer.dataset.lastCheckedNumbers = JSON.stringify(numbers);
    }
    
    this.displayResults(results);
  }

  protected displayResults(results: LotteryResult[]): void {
    if (!this.resultsContainer) return;
    this.resultsContainer.classList.remove('hidden');
    const resultsListContainer = this.resultsContainer.querySelector('.results-list') as HTMLElement;
    
    resultsListContainer.innerHTML = '';
    
    if (results.length === 0) {
      resultsListContainer.innerHTML = `<p class="text-gray-500 italic">${i18n.translate(this.config.i18nPrefix + '.noResults')}</p>`;
      return;
    }
    
    const sortedResults = results.sort((a, b) => {
      if (a.isWinner && !b.isWinner) return -1;
      if (!a.isWinner && b.isWinner) return 1;
      if (a.prize !== b.prize) return (b.prize || 0) - (a.prize || 0);
      return new Date(b.draw.date).getTime() - new Date(a.draw.date).getTime();
    });
    
    const matchCount = sortedResults.filter(r => r.isWinner).length;
    const totalResults = sortedResults.length;
    const winPercentage = totalResults > 0 ? ((matchCount / totalResults) * 100).toFixed(1) : '0';
    
    const statsElement = document.createElement('div');
    statsElement.className = 'mb-4 p-3 rounded bg-gray-700';
    statsElement.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <p class="text-gray-300">Checked: <span class="font-bold text-white">${totalResults}</span></p>
          <p class="text-gray-300">Wins: <span class="font-bold ${matchCount > 0 ? 'text-green-400' : 'text-white'}">${matchCount}</span></p>
        </div>
        <div class="text-right">
          <p class="text-gray-300">Win %</p>
          <p class="text-2xl font-bold ${Number(winPercentage) > 0 ? 'text-green-400' : 'text-white'}">${winPercentage}%</p>
        </div>
      </div>
    `;
    resultsListContainer.appendChild(statsElement);
    
    sortedResults.forEach(result => {
      const element = this.createResultElement(result);
      resultsListContainer.appendChild(element);
    });
  }

  protected abstract createResultElement(result: LotteryResult): HTMLElement;

  protected initMoneyWastedChart(): void {
    const chartCanvas = document.getElementById('money-wasted-chart') as HTMLCanvasElement;
    if (!chartCanvas) return;
    
    const savedNumbers = this.getSavedNumbers();
    if (savedNumbers.length === 0) {
      const chartParent = chartCanvas.parentElement;
      if (chartParent) {
        chartParent.innerHTML = `<p class="text-gray-500 italic text-center py-12">${i18n.translate(this.config.i18nPrefix + '.noNumbersSaved')}</p>`;
        return;
      }
      return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) { return; }
    
    const data = this.calculateMoneyWasted();
    if (data.dates.length === 0) { return; }
    
    if (this.moneyWastedChart) {
      this.moneyWastedChart.destroy();
    }
    
    // Create and show a spinner while chart animates
    const spinner = this.ensureChartSpinner('money-wasted-chart');
    spinner.show();

    this.moneyWastedChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.dates,
        datasets: [
          {
            label: i18n.translate('moneyWasted.title'),
            data: data.amounts,
            backgroundColor: (context) => {
              const value = context.dataset.data[context.dataIndex];
              return (value as number) >= 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)';
            },
            borderColor: (context) => {
              const value = context.dataset.data[context.dataIndex];
              return (value as number) >= 0 ? 'rgba(74, 222, 128, 1)' : 'rgba(239, 68, 68, 1)';
            },
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: i18n.translate('moneyWasted.etfGrowth'),
            data: data.etfAmounts,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          onProgress: () => spinner.show(),
          onComplete: () => { chartCanvas.classList.add('chart-ready'); spinner.hide(); }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: 'rgba(255, 255, 255, 0.7)' }
          },
          tooltip: {
            callbacks: {
              label: (context) => `€${Number(context.raw).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              callback: (value) => '€' + Number(value).toFixed(2)
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              maxTicksLimit: 12,
              autoSkip: true,
              maxRotation: 0
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  protected updateMoneyWastedChart(): void {
    if (!this.moneyWastedChart) {
      this.initMoneyWastedChart();
      return;
    }
    
    const data = this.calculateMoneyWasted();
    if (data.dates.length === 0) {
      this.moneyWastedChart.destroy();
      this.moneyWastedChart = null;
      return;
    }
    
    const spinner = this.ensureChartSpinner('money-wasted-chart');
    spinner.show();
    this.moneyWastedChart!.data.labels = data.dates;
    this.moneyWastedChart!.data.datasets[0].data = data.amounts;
    this.moneyWastedChart!.data.datasets[1].data = data.etfAmounts;
    this.moneyWastedChart!.options.animation = {
      onProgress: () => spinner.show(),
      onComplete: () => spinner.hide()
    };
    this.moneyWastedChart!.update();
  }

  private ensureChartSpinner(canvasId: string): { show: () => void; hide: () => void } {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return { show: () => {}, hide: () => {} };
    let spinner = canvas.previousElementSibling as HTMLElement | null;
    if (!spinner || !spinner.classList.contains('chart-spinner')) {
      spinner = document.createElement('div');
      spinner.className = 'chart-spinner flex items-center gap-2 text-gray-300 mb-3';
      spinner.innerHTML = '<span class="animate-spin h-5 w-5 border-2 border-white/60 border-t-transparent rounded-full"></span> <span>Loading…</span>';
      canvas.parentElement?.insertBefore(spinner, canvas);
    }
    return {
      show: () => spinner && spinner.classList.remove('hidden'),
      hide: () => spinner && spinner.classList.add('hidden')
    };
  }
}
