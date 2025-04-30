import React, { useEffect } from 'react';

interface AdSenseProps {
  adClient: string;
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical';
  adLayout?: string;
  className?: string;
  style?: React.CSSProperties;
  responsive?: 'true' | 'false';
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdSense({
  adClient,
  adSlot,
  adFormat = 'auto',
  adLayout,
  className = '',
  style = {},
  responsive = 'true',
}: AdSenseProps) {
  useEffect(() => {
    try {
      // Check if adsense is already loaded
      const hasAds = Array.isArray(window.adsbygoogle);
      
      // Push the current ad to be rendered
      if (hasAds) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Combine passed in styles with default styles
  const combinedStyle: React.CSSProperties = {
    display: 'block',
    textAlign: 'center',
    ...style,
  };

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={combinedStyle}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive}
        {...(adLayout ? { 'data-ad-layout': adLayout } : {})}
      ></ins>
    </div>
  );
}