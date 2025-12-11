import { type MoneyWastedData } from '../types/eurojackpot';
import { getNumbersFromCookie } from './cookieService';


const DEFAULT_TICKET_PRICE = 2.60; // Default price in euros

// Average annual ETF return (8% is a reasonable estimate for long-term market returns)
const ANNUAL_ETF_RETURN = 0.08;

export const calculateMoneyWasted = (historicalDrawsData?: any[]): MoneyWastedData => {
  const savedNumbers = getNumbersFromCookie();
  console.log('Calculating money wasted for saved numbers:', savedNumbers);
  
  if (savedNumbers.length === 0) {
    return {
      dates: [],
      amounts: [],
      etfAmounts: [],
      totalWasted: 0,
      totalEtfValue: 0
    };
  }
  
  // Use provided historical draws or empty array
  const historicalDraws = historicalDrawsData || [];
  
  if (historicalDraws.length === 0) {
    console.warn('No historical draws available for money wasted calculation');
    return {
      dates: [],
      amounts: [],
      etfAmounts: [],
      totalWasted: 0,
      totalEtfValue: 0
    };
  }
  
  // Sort historical draws by date
  const sortedDraws = [...historicalDraws]
    .filter(draw => draw.date)
    .sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateA.localeCompare(dateB);
    });
  
  const dates: string[] = [];
  const amounts: number[] = [];
  const etfAmounts: number[] = [];
  let cumulativeAmount = 0;
  let cumulativeEtfAmount = 0;
  
  // For each draw, calculate profit/loss for all tickets (standing orders)
  sortedDraws.forEach(draw => {
    if (!draw.date) return;

    
    // Calculate total spent and won for this draw
    let drawSpent = 0;
    let drawWon = 0;
    
    // For each saved number set (standing order)
    savedNumbers.forEach(ticket => {
      const ticketPrice = ticket.ticketPrice || DEFAULT_TICKET_PRICE;
      drawSpent += ticketPrice;
      
      // Count matches
      const matchedMain = ticket.mainNumbers.filter(num => 
        draw.mainNumbers.includes(num)).length;
      
      const matchedEuro = ticket.euroNumbers.filter(num => 
        draw.euroNumbers.includes(num)).length;
      
      // Calculate profit/loss
      if (draw.prizeDistribution) {
        const matchKey = `${matchedMain} + ${matchedEuro}`;
        const prize = draw.prizeDistribution[matchKey] || 0;
        drawWon += prize;
      }
    });
    
    // Update cumulative amount (money spent minus winnings)
    // This is money wasted when negative, profit when positive
    const drawResult = drawWon - drawSpent;
    cumulativeAmount += drawResult;
    
    // Calculate ETF growth
    // First apply growth to existing investment
    if (cumulativeEtfAmount > 0) {
      // Apply ETF growth - daily rate based on annual return
      const dailyReturn = Math.pow(1 + ANNUAL_ETF_RETURN, 1/365) - 1;
      cumulativeEtfAmount *= (1 + dailyReturn);
    }
    
    // Then add the new investment (amount spent on tickets)
    cumulativeEtfAmount += drawSpent;
    
    // Format date for display - use month and year only if there are many draws
    const drawDate = new Date(draw.date);
    const formattedDate = drawDate.toLocaleDateString('en-US', { 
      month: 'short',
      year: '2-digit'
    });
    
    dates.push(formattedDate);
    amounts.push(cumulativeAmount);
    etfAmounts.push(parseFloat(cumulativeEtfAmount.toFixed(2)));
  });
  
  return {
    dates,
    amounts,
    etfAmounts,
    totalWasted: cumulativeAmount,
    totalEtfValue: parseFloat(cumulativeEtfAmount.toFixed(2))
  };
};
