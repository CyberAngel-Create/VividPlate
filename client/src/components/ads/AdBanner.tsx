import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdSense from './AdSense';

// AdSense configuration with provided client ID
const GOOGLE_ADSENSE_CLIENT = 'ca-pub-8447200389101391'; // Client ID provided
const GOOGLE_ADSENSE_SLOT = '1234567890'; // You may need to replace this with your actual slot ID

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
  const { data: subscriptionData } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
    // Only run query when authenticated
    enabled: typeof window !== 'undefined',
    // Don't show error for unauthenticated users viewing public menus
    retry: false
  });

  useEffect(() => {
    if (subscriptionData?.isPaid) {
      setIsPaidUser(true);
    }
  }, [subscriptionData]);

  // Don't show ads for paid users (including when we don't know the status yet)
  if (isPaidUser || subscriptionData === undefined) {
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