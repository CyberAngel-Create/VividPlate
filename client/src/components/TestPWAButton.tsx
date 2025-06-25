import { useState } from 'react';
import { Download } from 'lucide-react';

export const TestPWAButton = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  const handleTestPrompt = () => {
    setShowPrompt(true);
  };

  const handleInstall = () => {
    alert('PWA Install functionality working! In a real browser with PWA support, this would install the app.');
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <img 
                  src="/vividplate-icon.png" 
                  alt="VividPlate Icon" 
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    console.log('Test button icon failed to load');
                    const target = e.currentTarget;
                    target.src = '/icon-72x72.png';
                  }}
                  onLoad={() => console.log('Test button icon loaded')}
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Install VividPlate
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Install VividPlate as an app for quick access and offline functionality.
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
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleTestPrompt}
      className="fixed bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2 z-40"
    >
      <Download className="w-4 h-4" />
      <span>Test PWA Install</span>
    </button>
  );
};