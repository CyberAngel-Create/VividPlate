import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      console.log('Browser PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Force show after 3 seconds for demo
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        console.log('No native install prompt, showing manual prompt');
        setShowInstallPrompt(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      console.log('Triggering native PWA install');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA install');
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Manual instructions
      const userAgent = navigator.userAgent;
      let message = '';
      
      if (userAgent.includes('Chrome')) {
        message = 'To install VividPlate:\n\n1. Look for the install icon (⊞) in the address bar\n2. OR click the menu (⋮) → "Install VividPlate"\n3. The app will be added to your desktop';
      } else if (userAgent.includes('Edge')) {
        message = 'To install VividPlate:\n\n1. Click the menu (...) → "Apps" → "Install VividPlate"\n2. The app will be added to your desktop';
      } else {
        message = 'To install VividPlate as an app:\n\n1. Look for install options in your browser menu\n2. Check the address bar for install icons\n3. This will add VividPlate to your desktop';
      }
      
      alert(message);
      setShowInstallPrompt(false);
    }
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 relative">
        <button
          onClick={() => setShowInstallPrompt(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <img 
              src="/icon-72x72.png" 
              alt="VividPlate" 
              className="w-8 h-8 rounded object-cover"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Install VividPlate
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Get quick access with offline functionality and native app experience.
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={handleInstall}
                className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
              
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};