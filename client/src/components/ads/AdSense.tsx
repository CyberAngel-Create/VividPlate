import { useEffect } from 'react';

interface AdSenseProps {
  client: string;
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdSense = ({ 
  client, 
  slot, 
  format = 'auto', 
  responsive = true, 
  style = {} 
}: AdSenseProps) => {
  useEffect(() => {
    // Load the Google AdSense script if it's not already loaded
    const loadAdSenseScript = () => {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8447200389101391';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      
      // Initialize adsbygoogle when script loads
      script.onload = () => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
          console.error('AdSense error:', error);
        }
      };
    };

    // Check if script is already loaded
    if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      loadAdSenseScript();
    } else {
      // If script is already loaded, just push the ad
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, []);

  return (
    <div className="ad-container my-4">
      <ins 
        className={`adsbygoogle ${responsive ? 'adsbygoogle-responsive' : ''}`}
        style={{ display: 'block', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      ></ins>
    </div>
  );
};

export default AdSense;