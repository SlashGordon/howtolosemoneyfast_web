import type { BaseLotteryService, LotteryNumbers, LotteryResult } from '../utils/baseLotteryService';

export abstract class BaseLotteryComponent<T extends LotteryNumbers> {
  protected service: BaseLotteryService<any, T>;
  protected savedNumbers: Array<{ numbers: T; price: number; date: string }> = [];
  protected storageKey: string;

  constructor(service: BaseLotteryService<any, T>, storageKey: string) {
    this.service = service;
    this.storageKey = storageKey;
    this.init();
  }

  protected async init(): Promise<void> {
    await this.service.initialize();
    this.loadSavedNumbers();
    this.bindEvents();
    this.updateStats();
  }

  protected abstract bindEvents(): void;
  protected abstract getFormNumbers(): T;
  protected abstract validateFormNumbers(numbers: T): boolean;
  protected abstract displayResults(results: LotteryResult[], numbers: T): void;

  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const numbers = this.getFormNumbers();
    const price = this.getTicketPrice();
    
    if (!this.validateFormNumbers(numbers)) return;

    const startDate = (document.getElementById('start-date') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('end-date') as HTMLInputElement)?.value;

    const results = this.service.checkNumbers(numbers, startDate, endDate);
    
    this.savedNumbers.push({
      numbers,
      price,
      date: new Date().toISOString()
    });
    
    this.saveNumbers();
    this.displayResults(results, numbers);
    this.updateStats();
  }

  protected getTicketPrice(): number {
    const input = document.getElementById('ticket-price') as HTMLInputElement;
    return parseFloat(input?.value || '2.00');
  }

  protected updateStats(): void {
    const totalTickets = this.savedNumbers.length;
    const totalSpent = this.savedNumbers.reduce((sum, entry) => sum + entry.price, 0);
    
    document.getElementById('total-tickets')!.textContent = totalTickets.toString();
    document.getElementById('total-spent')!.textContent = `€${totalSpent.toFixed(2)}`;
  }

  protected loadSavedNumbers(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.savedNumbers = JSON.parse(saved);
    }
  }

  protected saveNumbers(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.savedNumbers));
  }
}