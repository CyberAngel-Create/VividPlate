import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Legacy subscription route.
 * The active payment flow is LemonSqueezy at /ls-subscribe, so this page
 * simply redirects there to keep a single source of truth for subscriptions.
 */
const SubscriptionPage = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/ls-subscribe');
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex items-center gap-3 text-gray-500">
        <span className="animate-spin h-5 w-5 border-t-2 border-primary border-r-2 rounded-full" />
        <span>Redirecting to subscription…</span>
      </div>
    </div>
  );
};

export default SubscriptionPage;
