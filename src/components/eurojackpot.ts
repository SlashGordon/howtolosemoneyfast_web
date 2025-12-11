import { BaseLotteryComponent, type LotteryConfig } from './baseLotteryComponent';
import { EurojackpotService } from '../utils/eurojackpotService';
import { addNumbers, getNumbersFromCookie, saveNumbersToCookie } from '../utils/cookieService';
import type { EurojackpotNumbers } from '../types/eurojackpot';
import { calculateMoneyWasted } from '../utils/moneyWastedService';
import { i18n } from '../i18n/i18n';
import type { LotteryResult } from '../utils/baseLotteryService';

const config: LotteryConfig = {
  name: 'EuroJackpot',
  mainNumbersCount: 5,
  mainNumbersMax: 50,
  bonusNumbersCount: 2,
  bonusNumbersMax: 12,
  mainNumbersLabel: 'Main Numbers (5 from 1-50)',
  bonusNumbersLabel: 'Euro Numbers (2 from 1-12)',
  mainColor: 'red',
  bonusColor: 'yellow',
  defaultTicketPrice: 2.60,
  i18nPrefix: 'eurojackpot'
};

export class EurojackpotComponentNew extends BaseLotteryComponent<any, EurojackpotNumbers> {
  constructor(containerId: string) {
    super(containerId, EurojackpotService.getInstance(), config);
    this.init();
  }

  protected getSavedNumbers(): EurojackpotNumbers[] {
    return getNumbersFromCookie();
  }

  protected saveNumbers(numbers: EurojackpotNumbers): void {
    addNumbers(numbers);
  }

  protected deleteSavedNumber(index: number): void {
    const savedNumbers = getNumbersFromCookie();
    if (index >= 0 && index < savedNumbers.length) {
      savedNumbers.splice(index, 1);
      saveNumbersToCookie(savedNumbers);
      this.loadSavedNumbers();
      this.updateMoneyWastedChart();
    }
  }

  protected getHistoricalDraws(): any[] {
    return this.service['historicalData'] || [];
  }

  protected calculateMoneyWasted(): any {
    const historicalDraws = this.getHistoricalDraws();
    return calculateMoneyWasted(historicalDraws);
  }

  protected handleFormSubmit(form: HTMLFormElement): void {
    const mainNumberInputs = Array.from(
      form.querySelectorAll('input[type="number"][min="1"][max="50"]')
    ) as HTMLInputElement[];
    
    const euroNumberInputs = Array.from(
      form.querySelectorAll('input[type="number"][min="1"][max="12"]')
    ) as HTMLInputElement[];
    
    const ticketPriceInput = document.getElementById('ticket-price') as HTMLInputElement;
    const ticketPrice = parseFloat(ticketPriceInput.value) || this.config.defaultTicketPrice;
    
    const mainNumbers = mainNumberInputs.map(input => parseInt(input.value, 10));
    const euroNumbers = euroNumberInputs.map(input => parseInt(input.value, 10));
    
    const numbers: EurojackpotNumbers = {
      mainNumbers,
      euroNumbers,
      date: new Date().toISOString().split('T')[0],
      ticketPrice
    };
    
    if (!this.service['validateNumbers'](numbers)) {
      alert(i18n.translate('eurojackpot.invalidNumbers'));
      return;
    }
    
    this.saveNumbers(numbers);
    this.loadSavedNumbers();
    this.compareAndDisplayResults(numbers);
    this.updateMoneyWastedChart();
    
    mainNumberInputs.forEach(input => input.value = '');
    euroNumberInputs.forEach(input => input.value = '');
  }

  protected handleBulkImport(data: string): void {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) throw new Error('Invalid format');
    const saved = getNumbersFromCookie();
    let imported = 0;
    parsed.forEach((entry: any) => {
      let ticket: any = null;
      if (Array.isArray(entry)) {
        const mainNumbers = entry.slice(0, 5).map((n: any) => Number(n));
        const euro = entry.slice(5, 7).map((n: any) => Number(n));
        ticket = { mainNumbers, euroNumbers: euro, date: new Date().toISOString().split('T')[0], ticketPrice: config.defaultTicketPrice };
      } else if (entry && typeof entry === 'object' && Array.isArray(entry.mainNumbers) && Array.isArray(entry.euroNumbers)) {
        const mainNumbers = entry.mainNumbers.map((n: any) => Number(n));
        const euroNumbers = entry.euroNumbers.map((n: any) => Number(n));
        const ticketPrice = Number(entry.ticketPrice) || config.defaultTicketPrice;
        const date = typeof entry.date === 'string' ? entry.date : new Date().toISOString().split('T')[0];
        ticket = { mainNumbers, euroNumbers, date, ticketPrice };
      }
      if (ticket && this.service['validateNumbers'](ticket)) {
        saved.push(ticket);
        imported++;
      }
    });
    saveNumbersToCookie(saved);
    this.loadSavedNumbers();
    this.updateMoneyWastedChart();
    alert(i18n.translate('eurojackpot.bulkImportSuccess').replace('{count}', String(imported)));
  }

  protected createSavedNumberElement(numbers: EurojackpotNumbers, index: number): HTMLElement {
    const element = document.createElement('div');
    element.className = 'bg-gray-700 p-2 rounded mb-2 flex justify-between items-center';
    
    const mainNumbersStr = numbers.mainNumbers.join(', ');
    const euroNumbersStr = numbers.euroNumbers.join(', ');
    const dateStr = numbers.date ? ` (${numbers.date})` : '';
    const priceStr = numbers.ticketPrice ? ` - €${numbers.ticketPrice.toFixed(2)}` : '';
    
    element.innerHTML = `
      <span>
        <span class="font-semibold">${i18n.translate('eurojackpot.set')} ${index + 1}${dateStr}${priceStr}:</span> 
        <span class="text-white">${mainNumbersStr}</span> | 
        <span class="text-yellow-400">${euroNumbersStr}</span>
      </span>
      <div class="flex gap-2">
        <button class="check-btn text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md shadow-sm transition-all duration-300" data-index="${index}">
          ${i18n.translate('eurojackpot.check')}
        </button>
        <button class="delete-btn text-xs bg-gray-600 hover:bg-gray-500 text-white p-1.5 rounded-md shadow-sm transition-all duration-300" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
    
    const checkBtn = element.querySelector('.check-btn') as HTMLButtonElement;
    checkBtn.addEventListener('click', () => this.compareAndDisplayResults(numbers));
    
    const deleteBtn = element.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.addEventListener('click', () => this.deleteSavedNumber(index));
    
    return element;
  }

  protected createResultElement(result: LotteryResult): HTMLElement {
    const element = document.createElement('div');
    element.className = `bg-gray-700 p-4 rounded-md mb-3 shadow-md ${result.isWinner ? 'border-l-4 border-yellow-400' : ''}`;
    
    const drawDate = result.draw.date || 'Unknown';
    const mainNumbersStr = result.draw.mainNumbers.join(', ');
    const euroNumbersStr = result.draw.euroNumbers.join(', ');
    const prizeStr = result.prize ? ` - €${result.prize.toFixed(2)}` : '';
    
    element.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="font-semibold">${drawDate}</span>
        ${result.isWinner ? `<span class="text-yellow-400 font-bold">WIN${prizeStr}</span>` : ''}
      </div>
      <div class="mb-1">
        <span class="text-gray-400">Numbers:</span> 
        <span class="text-white">${mainNumbersStr}</span> | 
        <span class="text-yellow-400">${euroNumbersStr}</span>
      </div>
      <div>
        <span class="text-gray-400">Matches:</span> 
        <span class="text-white">${result.matches.main} main</span>, 
        <span class="text-yellow-400">${result.matches.euro} euro</span>
      </div>
    `;
    
    return element;
  }
}

export { EurojackpotComponentNew as EurojackpotComponent };
