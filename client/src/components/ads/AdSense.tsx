import React, { useEffect } from 'react';
import { useSubscription } from '@/hooks/use-subscription';

const AdSense: React.FC = () => {
  const { isPaid } = useSubscription();
  
  useEffect(() => {
    // Skip loading AdSense for paid users
    if (isPaid) return;
    
    // Only add the script if it doesn't already exist
    if (!document.getElementById('google-adsense-script')) {
      const script = document.createElement('script');
      script.id = 'google-adsense-script';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8447200389101391';
      
      // Add script to document head
      document.head.appendChild(script);

      // Create and append ads.txt if it doesn't exist
      const metaTag = document.createElement('meta');
      metaTag.name = 'google-adsense-account';
      metaTag.content = 'ca-pub-8447200389101391';
      document.head.appendChild(metaTag);
    }

    // Initialize AdSense
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }
    
    return () => {
      // Cleanup function - in practice, we wouldn't remove the script
      // But we could handle other cleanup if needed
    };
  }, [isPaid]);

  // This component doesn't render anything visible
  return null;
};

export default AdSense;