import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show prompt after a short delay if app is installable and not dismissed
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled && !dismissed) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, dismissed]);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasBeenDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <img 
                src="/icon-72x72.png" 
                alt="VividPlate Icon" 
                className="w-8 h-8 rounded"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Install VividPlate
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Get the full app experience with offline access and quick launch from your home screen.
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
                onClick={handleDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center text-xs text-gray-500">
          <Smartphone className="w-3 h-3 mr-1" />
          <span>Works offline • Fast loading • Native feel</span>
        </div>
      </div>
    </div>
  );
};