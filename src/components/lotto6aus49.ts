import { BaseLotteryComponent, type LotteryConfig } from './baseLotteryComponent';
import { Lotto6aus49Service } from '../utils/lotto6aus49Service';
import { addNumbers, getNumbersFromCookie, saveNumbersToCookie, type Lotto6aus49SavedNumbers } from '../utils/lotto6aus49CookieService';
import type { Lotto6aus49Draw, Lotto6aus49Numbers } from '../types/lotto6aus49';
import { calculateMoneyWastedLotto6aus49 } from '../utils/moneyWastedServiceLotto6aus49';
import { historicalDraws } from '../data/historicalLotto6aus49';
import { i18n } from '../i18n/i18n';
import type { LotteryResult } from '../utils/baseLotteryService';

const config: LotteryConfig = {
  name: 'Lotto 6 aus 49',
  mainNumbersCount: 6,
  mainNumbersMax: 49,
  bonusNumbersCount: 1,
  bonusNumbersMax: 9,
  mainNumbersLabel: 'Regular Numbers (6 from 1-49)',
  bonusNumbersLabel: 'Bonus Number (1 from 0-9)',
  mainColor: 'blue',
  bonusColor: 'yellow',
  defaultTicketPrice: 1.20,
  i18nPrefix: 'lotto6aus49'
};

export class Lotto6aus49Component extends BaseLotteryComponent<Lotto6aus49Draw, Lotto6aus49Numbers> {
  constructor(containerId: string) {
    super(containerId, Lotto6aus49Service.getInstance(), config);
    this.init();
  }

  protected getSavedNumbers(): Lotto6aus49SavedNumbers[] {
    return getNumbersFromCookie();
  }

  protected handleBulkImport(data: string): void {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) throw new Error('Invalid format');
    const saved: any[] = getNumbersFromCookie();
    let imported = 0;
    parsed.forEach((entry: any) => {
      let ticket: any = null;
      if (Array.isArray(entry)) {
        const regular = entry.slice(0, 6).map((n: any) => Number(n));
        const bonusVal = entry[6];
        const bonus = bonusVal === undefined || bonusVal === null ? [] : [Number(bonusVal)];
        ticket = { regular, bonus, date: new Date().toISOString().split('T')[0], ticketPrice: config.defaultTicketPrice };
      } else if (entry && typeof entry === 'object' && Array.isArray(entry.regular)) {
        const regular = entry.regular.map((n: any) => Number(n));
        const bonusArray = Array.isArray(entry.bonus) ? entry.bonus.map((n: any) => Number(n)) : (entry.bonus != null ? [Number(entry.bonus)] : []);
        const ticketPrice = Number(entry.ticketPrice) || config.defaultTicketPrice;
        const date = typeof entry.date === 'string' ? entry.date : new Date().toISOString().split('T')[0];
        ticket = { regular, bonus: bonusArray, date, ticketPrice };
      }
      if (ticket && this.service['validateNumbers'](ticket)) {
        saved.push(ticket);
        imported++;
      }
    });
    saveNumbersToCookie(saved as any);
    this.loadSavedNumbers();
    this.updateMoneyWastedChart();
    alert(i18n.translate('lotto6aus49.bulkImportSuccess').replace('{count}', String(imported)));
  }

  protected saveNumbers(numbers: Lotto6aus49SavedNumbers): void {
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

  protected getHistoricalDraws(): Lotto6aus49Draw[] {
    return historicalDraws;
  }

  protected calculateMoneyWasted(): any {
    return calculateMoneyWastedLotto6aus49();
  }

  protected handleFormSubmit(form: HTMLFormElement): void {
    const regularInputs = Array.from(
      form.querySelectorAll('input[type="number"][min="1"][max="49"]')
    ) as HTMLInputElement[];
    
    const bonusInput = document.getElementById('bonus-number') as HTMLInputElement;
    const ticketPriceInput = document.getElementById('ticket-price') as HTMLInputElement;
    const ticketPrice = parseFloat(ticketPriceInput.value) || this.config.defaultTicketPrice;
    
    const regular = regularInputs.map(input => parseInt(input.value, 10));
    const bonus = bonusInput?.value ? [parseInt(bonusInput.value, 10)] : [];
    
    const numbers = {
      regular,
      bonus,
      date: new Date().toISOString().split('T')[0],
      ticketPrice
    } as any;
    
    if (!this.service['validateNumbers'](numbers)) {
      alert(i18n.translate('lotto6aus49.invalidNumbers'));
      return;
    }
    
    this.saveNumbers(numbers);
    this.loadSavedNumbers();
    this.compareAndDisplayResults(numbers);
    this.updateMoneyWastedChart();
    
    regularInputs.forEach(input => input.value = '');
    if (bonusInput) bonusInput.value = '';
  }

  protected createSavedNumberElement(numbers: Lotto6aus49SavedNumbers, index: number): HTMLElement {
    const element = document.createElement('div');
    element.className = 'bg-gray-700 p-2 rounded mb-2 flex justify-between items-center';
    
    const regularStr = numbers.regular.join(', ');
    const bonusStr = numbers.bonus.length ? numbers.bonus.join(', ') : '';
    const dateStr = numbers.date ? ` (${numbers.date})` : '';
    const priceStr = numbers.ticketPrice ? ` - €${numbers.ticketPrice.toFixed(2)}` : '';
    
    element.innerHTML = `
      <span>
        <span class="font-semibold">${i18n.translate('lotto6aus49.set')} ${index + 1}${dateStr}${priceStr}:</span> 
        <span class="text-white">${regularStr}</span>${bonusStr ? ` | <span class="text-yellow-400">${bonusStr}</span>` : ''}
      </span>
      <div class="flex gap-2">
        <button class="check-btn text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-sm transition-all duration-300" data-index="${index}">
          ${i18n.translate('lotto6aus49.check')}
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
    const regularStr = result.draw.regular_numbers.join(', ');
    const bonusStr = result.draw.bonus_numbers.filter(n => n !== -1).join(', ');
    const prizeStr = result.prize ? ` - €${result.prize.toFixed(2)}` : '';
    
    element.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="font-semibold">${drawDate}</span>
        ${result.isWinner ? `<span class="text-yellow-400 font-bold">WIN${prizeStr}</span>` : ''}
      </div>
      <div class="mb-1">
        <span class="text-gray-400">Numbers:</span> 
        <span class="text-white">${regularStr}</span> | 
        <span class="text-yellow-400">${bonusStr}</span>
      </div>
      <div>
        <span class="text-gray-400">Matches:</span> 
        <span class="text-white">${result.matches.regular} regular</span>${result.matches.bonus ? `, <span class="text-yellow-400">${result.matches.bonus} bonus</span>` : ''}
      </div>
    `;
    
    return element;
  }
}
