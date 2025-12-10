import { initializeHistoryPage } from './historyPage';

export function initializeHistoryPageFromData(historicalDraws: any[], translations: any, downloadFilename: string) {
  console.log('[HistoryPageInitializer] Starting initialization with', historicalDraws.length, 'draws');
  if (!historicalDraws || historicalDraws.length === 0) {
    console.warn('[HistoryPageInitializer] No data provided');
    return;
  }
  
  try {
    initializeHistoryPage(translations, downloadFilename, historicalDraws);
    console.log('[HistoryPageInitializer] Initialization complete');
  } catch (error) {
    console.error('[HistoryPageInitializer] Error during initialization:', error);
  }
}
