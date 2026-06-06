import React from 'react';

interface AdBannerProps {
  position?: string;
  className?: string;
}

// AdBanner removed: return null to avoid loading any ad scripts or IDs
const AdBanner: React.FC<AdBannerProps> = () => null;

export default AdBanner;