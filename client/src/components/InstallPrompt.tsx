import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstallability } from '@/hooks/usePWAInstallability';

export const InstallPrompt = () => {
  const { isInstallable, isInstalled, installPWA, canInstall } = usePWAInstallability();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setShowPrompt(false);
      return;
    }

    // Show prompt when installable or after 3 seconds for demo
    if (isInstallable && !hasShownPrompt) {
      setShowPrompt(true);
      setHasShownPrompt(true);
    } else if (!isInstallable && !hasShownPrompt) {
      const timer = setTimeout(() => {
        console.log('Showing manual install prompt - look for install icon in address bar');
        setShowPrompt(true);
        setHasShownPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, hasShownPrompt]);

  const handleInstall = async () => {
    // Try global PWA install function first
    if ((window as any).installPWA) {
      (window as any).installPWA();
      setShowPrompt(false);
      return;
    }
    
    if (canInstall) {
      const success = await installPWA();
      if (success) {
        setShowPrompt(false);
        return;
      }
    }
    
    // Show manual instructions
    const userAgent = navigator.userAgent;
    let instructions = '';
    
    if (userAgent.includes('Chrome') || userAgent.includes('Chromium')) {
      instructions = `Chrome Installation:

✓ Look for the install icon (⊞) in the address bar
✓ OR click menu (⋮) → "Install VividPlate"
✓ Click "Install" to add to desktop

The VividPlate app will appear with your custom icon!`;
    } else if (userAgent.includes('Edge')) {
      instructions = `Edge Installation:

✓ Click menu (...) → "Apps" → "Install VividPlate"
✓ The app will be added to your desktop`;
    } else {
      instructions = `Install VividPlate:

✓ Look for install options in browser menu
✓ Check address bar for install icons
✓ Add to desktop for quick access`;
    }
    
    alert(instructions);
    setShowPrompt(false);
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 relative">
        <button
          onClick={() => setShowPrompt(false)}
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
                <span>Install VividPlate</span>
              </button>
              
              <button
                onClick={() => setShowPrompt(false)}
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