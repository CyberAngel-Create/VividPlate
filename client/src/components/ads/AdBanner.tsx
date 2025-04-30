import React from 'react';
import AdSense from './AdSense';

interface AdBannerProps {
  adSlot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical';
  layout?: string;
  className?: string;
  style?: React.CSSProperties;
  isPremium?: boolean; // Pass this from the parent component
}

// DigitaMenuMate AdSense publisher ID
const PUBLISHER_ID = 'ca-pub-8447200389101391';

function AdBanner({ 
  adSlot, 
  format = 'auto', 
  layout,
  className = '', 
  style,
  isPremium = false // Default to showing ads
}: AdBannerProps) {
  
  // Don't show ads for premium users
  if (isPremium) {
    return null;
  }
  
  return (
    <div 
      className={`ad-banner ${className}`}
      data-testid="ad-banner"
    >
      <div className="text-xs text-gray-400 text-center mb-1">Advertisement</div>
      <AdSense
        adClient={PUBLISHER_ID}
        adSlot={adSlot}
        adFormat={format}
        adLayout={layout}
        style={style}
      />
    </div>
  );
}

export default AdBanner;