import { useEffect } from 'react';

export const PWAEngagementTrigger = () => {
  useEffect(() => {
    // Force engagement for PWA installability
    const triggerEngagement = () => {
      // Create multiple user interaction events
      const interactionEvents = [
        new MouseEvent('click', { bubbles: true, cancelable: true }),
        new TouchEvent('touchstart', { bubbles: true, cancelable: true }),
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }),
        new Event('scroll', { bubbles: true }),
        new Event('resize', { bubbles: true })
      ];

      interactionEvents.forEach(event => {
        document.body.dispatchEvent(event);
      });

      // Force a navigation event
      const currentUrl = window.location.href;
      window.history.pushState({}, '', currentUrl + '#pwa-ready');
      setTimeout(() => {
        window.history.pushState({}, '', currentUrl);
      }, 100);

      console.log('🚀 Triggered PWA engagement criteria');
    };

    // Trigger immediately and periodically
    triggerEngagement();
    const interval = setInterval(triggerEngagement, 2000);

    // Monitor for install prompt
    let promptDetected = false;
    const promptHandler = () => {
      promptDetected = true;
      console.log('✅ SUCCESS: PWA install prompt detected!');
      console.log('🎯 Look for install icon in Chrome address bar now');
      clearInterval(interval);
    };

    window.addEventListener('beforeinstallprompt', promptHandler);

    // Check if prompt appears within 10 seconds
    setTimeout(() => {
      if (!promptDetected) {
        console.log('⚠️ PWA install prompt not triggered yet');
        console.log('💡 Try: Chrome menu → More tools → Install VividPlate');
        console.log('💡 Or wait a few more seconds for browser criteria');
      }
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', promptHandler);
    };
  }, []);

  return null; // This component doesn't render anything
};