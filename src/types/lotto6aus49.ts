export interface Lotto6aus49Draw {
  date: string;
  draw_date: string;
  regular_numbers: number[];
  bonus_numbers: [number, number]; // [super_number (SZ), extra_number (ZZ)]
  prize_distribution: Record<string, number>;
}

export interface Lotto6aus49Numbers {
  regular: number[];
  bonus: number[];
  [key: string]: number[];
}