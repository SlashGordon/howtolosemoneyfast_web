import './styles.css';
import { EurojackpotComponent } from './components/eurojackpot';
import { i18n } from './i18n/i18n';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing i18n...');
  
  // Initialize i18n first
  i18n.init();
  
  // Then initialize the EuroJackpot component
  try {
    new EurojackpotComponent('eurojackpot-container');
    console.log('EuroJackpot component initialized');
  } catch (error) {
    console.error('Failed to initialize EuroJackpot component:', error);
  }
  
  // Add structured data for SEO
  addStructuredData();
});

// Add structured data for better SEO
function addStructuredData(): void {
  interface StructuredData {
    "@context": string;
    "@type": string;
    name: string;
    description: string;
    url: string;
    potentialAction: {
      "@type": string;
      target: string;
      "query-input": string;
    };
  }

  const structuredData: StructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "How To Lose Money Fast",
    "description": "Learn about financial mistakes and track lottery spending with our EuroJackpot simulator",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(structuredData);
  document.head.appendChild(script);
}