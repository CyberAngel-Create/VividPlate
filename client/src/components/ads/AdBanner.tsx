import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdSense from './AdSense';

// AdSense configuration - these should come from environment variables
const GOOGLE_ADSENSE_CLIENT = 'ca-pub-xxxxxxxxxxxxxxxx'; // Replace with your AdSense client ID
const GOOGLE_ADSENSE_SLOT = 'xxxxxxxxxx'; // Replace with your AdSense slot

// Define subscription status interface
interface SubscriptionStatus {
  tier: string;
  isPaid: boolean;
  maxRestaurants: number;
  currentRestaurants: number;
  expiresAt: string | null;
}

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'sidebar';
  className?: string;
}

const AdBanner = ({ position = 'top', className = '' }: AdBannerProps) => {
  const [isPaidUser, setIsPaidUser] = useState<boolean>(false);

  // Check if user has premium subscription
  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/user/subscription-status'],
  });

  useEffect(() => {
    if (subscriptionData && 'isPaid' in subscriptionData) {
      setIsPaidUser(subscriptionData.isPaid === true);
    }
  }, [subscriptionData]);

  // Don't show ads for paid users
  if (isPaidUser) {
    return null;
  }

  // Different ad styles based on position
  let adStyle: React.CSSProperties = {};
  let adSlot = GOOGLE_ADSENSE_SLOT;

  switch (position) {
    case 'sidebar':
      adStyle = { minHeight: '600px', width: '300px' };
      break;
    case 'bottom':
      adStyle = { minHeight: '90px', width: '100%' };
      break;
    default: // top
      adStyle = { minHeight: '90px', width: '100%' };
  }

  return (
    <div className={`ad-banner ${position}-ad ${className}`}>
      <div className="text-xs text-center text-gray-500 mb-1">Advertisement</div>
      <AdSense
        client={GOOGLE_ADSENSE_CLIENT}
        slot={adSlot}
        style={adStyle}
      />
    </div>
  );
};

export default AdBanner;