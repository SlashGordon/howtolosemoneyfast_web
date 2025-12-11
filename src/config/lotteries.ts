export interface LotteryConfig {
  name: string;
  description: string;
}

export const LOTTERY_CONFIGS: Record<string, LotteryConfig> = {
  eurojackpot: {
    name: 'EuroJackpot',
    description: 'European lottery with draws twice a week'
  },
  lotto6aus49: {
    name: 'Lotto 6 aus 49',
    description: 'German lottery with draws twice a week'
  }
};