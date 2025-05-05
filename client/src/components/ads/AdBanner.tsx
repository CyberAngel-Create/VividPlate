import React, { useEffect } from 'react';
import { useSubscription } from '@/hooks/use-subscription';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  format?: 'horizontal' | 'vertical' | 'rectangle';
  position?: 'top' | 'bottom' | 'sidebar';
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ format = 'horizontal', position, className = '' }) => {
  const { isPaid } = useSubscription();
  
  // Skip rendering for paid users
  if (isPaid) {
    return null;
  }

  useEffect(() => {
    // Skip for paid users (double-check)
    if (isPaid) return;
    
    let retryCount = 0;
    const maxRetries = 5;
    
    try {
      // Push ad to adsbygoogle when component mounts
      // Make sure we wait for the adsbygoogle array to be defined
      const pushAd = () => {
        try {
          if (window.adsbygoogle) {
            window.adsbygoogle.push({});
          } else {
            // If adsbygoogle is not available yet, retry after a delay with a limit
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(pushAd, 500);
            } else {
              console.log('AdSense not available after maximum retries');
            }
          }
        } catch (innerError) {
          console.log('AdSense push error (handled):', innerError);
        }
      };
      
      // Start the process
      pushAd();
    } catch (error) {
      // This catch covers any errors in the outer scope
      console.log('AdSense initialization error (handled):', error);
    }
  }, [isPaid]);

  // Determine ad dimensions based on format
  let adStyle: React.CSSProperties = {};
  let adClassNames = 'mx-auto overflow-hidden bg-gray-100 flex items-center justify-center text-sm text-gray-400 ';
  
  if (format === 'horizontal') {
    adStyle = { minHeight: '90px' };
    adClassNames += 'w-full h-[90px] ' + className;
  } else if (format === 'vertical') {
    adStyle = { minWidth: '160px', minHeight: '600px' };
    adClassNames += 'w-[160px] h-[600px] ' + className;
  } else if (format === 'rectangle') {
    adStyle = { minWidth: '300px', minHeight: '250px' };
    adClassNames += 'w-[300px] h-[250px] ' + className;
  }

  return (
    <div className={adClassNames} style={adStyle}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-8447200389101391"
        data-ad-slot="5678901234"
        data-ad-format={format === 'horizontal' ? 'horizontal' : format === 'vertical' ? 'vertical' : 'rectangle'}
        data-full-width-responsive="true"
      >
        {/* Fallback content while ad is loading */}
        <div className="w-full h-full flex items-center justify-center">
          <span>Advertisement</span>
        </div>
      </ins>
    </div>
  );
};

export default AdBanner;