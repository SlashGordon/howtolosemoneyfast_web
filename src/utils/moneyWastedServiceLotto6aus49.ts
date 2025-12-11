import { getNumbersFromCookie } from './lotto6aus49CookieService';
import { historicalDraws } from '../data/historicalLotto6aus49';
import { Lotto6aus49Service } from './lotto6aus49Service';

const ETF_ANNUAL_RETURN = 0.07;

export function calculateMoneyWastedLotto6aus49() {
  const savedNumbers = getNumbersFromCookie();
  const service = Lotto6aus49Service.getInstance();
  
  if (savedNumbers.length === 0) {
    return { dates: [], amounts: [], etfAmounts: [], totalWasted: 0, totalEtfValue: 0 };
  }

  const sortedDraws = [...historicalDraws].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const dates: string[] = [];
  const amounts: number[] = [];
  const etfAmounts: number[] = [];
  let cumulativeSpent = 0;
  let cumulativeWon = 0;
  let cumulativeEtf = 0;

  sortedDraws.forEach((draw, index) => {
    savedNumbers.forEach(ticket => {
      const ticketPrice = ticket.ticketPrice || 1.20;
      cumulativeSpent += ticketPrice;

      // Extract only the number properties for checkNumbers
      const numbers = { regular: ticket.regular, bonus: ticket.bonus };
      const results = service.checkNumbers(numbers, draw.date, draw.date);
      results.forEach(result => {
        if (result.prize) {
          cumulativeWon += result.prize;
        }
      });

      const daysSinceStart = index * 3.5;
      const years = daysSinceStart / 365;
      cumulativeEtf += ticketPrice * Math.pow(1 + ETF_ANNUAL_RETURN, years);
    });

    dates.push(draw.date);
    amounts.push(cumulativeWon - cumulativeSpent);
    etfAmounts.push(cumulativeEtf);
  });

  return {
    dates,
    amounts,
    etfAmounts,
    totalWasted: cumulativeSpent - cumulativeWon,
    totalEtfValue: cumulativeEtf
  };
}
