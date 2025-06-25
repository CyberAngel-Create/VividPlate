import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        console.log('✅ PWA is running in standalone mode');
      } else if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        console.log('✅ PWA is running in iOS standalone mode');
      } else {
        console.log('📱 PWA not installed, running in browser mode');
      }
    };

    checkIfInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('🚀 beforeinstallprompt event received in hook');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for custom PWA installable event
    const handlePWAInstallable = () => {
      console.log('📲 PWA is installable');
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('✅ PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Debug: Check browser support
    console.log('🔍 Browser PWA support check:', {
      serviceWorker: 'serviceWorker' in navigator,
      beforeInstallPrompt: 'onbeforeinstallprompt' in window,
      standalone: 'standalone' in window.navigator
    });

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Force show install prompt for demonstration
    console.log('Setting up timer to show PWA prompt in 2 seconds');
    const timer = setTimeout(() => {
      console.log('Timer executed: Setting isInstallable to true');
      setIsInstallable(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    // Get the global deferred prompt if our local one is null
    const prompt = deferredPrompt || (window as any).deferredPrompt;
    
    if (!prompt) {
      console.log('❌ No deferred prompt available - this may be expected on some browsers/devices');
      
      // Show manual install instructions for browsers that don't support the API
      alert('To install this app:\n\n' +
            'Chrome/Edge: Look for the install icon in the address bar\n' +
            'Safari: Tap Share → Add to Home Screen\n' +
            'Firefox: Look for the install option in the menu');
      return false;
    }

    try {
      console.log('📲 Showing install prompt');
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('❌ User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('❌ Error during app installation:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
  };
};