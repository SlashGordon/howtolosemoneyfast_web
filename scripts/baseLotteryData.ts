export interface BaseLotteryRawData {
  draw_date: string;
  regular_numbers: number[];
  bonus_numbers: number[];
  prize_distribution: Record<string, any>;
}