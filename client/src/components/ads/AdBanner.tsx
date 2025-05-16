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

  // Determine ad dimensions based on format - made smaller as requested
  let adStyle: React.CSSProperties = {};
  let adClassNames = 'mx-auto overflow-hidden bg-gray-100 flex items-center justify-center text-sm text-gray-400 ';
  
  if (format === 'horizontal') {
    adStyle = { minHeight: '60px' }; // Reduced from 90px to 60px
    adClassNames += 'w-full h-[60px] ' + className;
  } else if (format === 'vertical') {
    adStyle = { minWidth: '120px', minHeight: '400px' }; // Reduced from 160x600 to 120x400
    adClassNames += 'w-[120px] h-[400px] ' + className;
  } else if (format === 'rectangle') {
    adStyle = { minWidth: '250px', minHeight: '200px' }; // Reduced from 300x250 to 250x200
    adClassNames += 'w-[250px] h-[200px] ' + className;
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