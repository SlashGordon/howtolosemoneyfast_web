const COOKIE_NAME = 'lotto6aus49_numbers';
const COOKIE_EXPIRY_DAYS = 30;

export interface Lotto6aus49SavedNumbers {
  regular: number[];
  bonus: number[];
  date?: string;
  ticketPrice?: number;
}

export const saveNumbersToCookie = (numbers: Lotto6aus49SavedNumbers[]): void => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  
  const encodedValue = encodeURIComponent(JSON.stringify(numbers));
  document.cookie = `${COOKIE_NAME}=${encodedValue};expires=${expiryDate.toUTCString()};path=/;SameSite=Strict`;
};

export const getNumbersFromCookie = (): Lotto6aus49SavedNumbers[] => {
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie.startsWith(`${COOKIE_NAME}=`)) {
      const cookieValue = trimmedCookie.substring(COOKIE_NAME.length + 1);
      
      try {
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch (error) {
        console.error('Error parsing Lotto 6 aus 49 numbers from cookie:', error);
      }
    }
  }
  
  return [];
};

export const addNumbers = (numbers: Lotto6aus49SavedNumbers): void => {
  const savedNumbers = getNumbersFromCookie();
  savedNumbers.push(numbers);
  saveNumbersToCookie(savedNumbers);
};
