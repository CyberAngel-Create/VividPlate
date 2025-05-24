
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Cookie, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    essential: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const hasConsented = localStorage.getItem('menumate-cookie-consent');
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('menumate-cookie-consent', 'accepted');
    localStorage.setItem('menumate-cookie-settings', JSON.stringify(settings));
    setIsVisible(false);
  };

  const handleDecline = () => {
    const minimalSettings = { essential: true, analytics: false, marketing: false };
    localStorage.setItem('menumate-cookie-consent', 'declined');
    localStorage.setItem('menumate-cookie-settings', JSON.stringify(minimalSettings));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t shadow-lg z-50 p-4 md:p-6 max-h-[90vh] overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-start gap-3">
          <Cookie className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('cookies.title', 'We value your privacy')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('cookies.message', 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.')}
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-4 border-t pt-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Essential</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Required for basic site functionality</p>
              </div>
              <div className="opacity-50">
                <input type="checkbox" checked disabled className="rounded" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Analytics</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Help us improve our website</p>
              </div>
              <div>
                <input
                  type="checkbox"
                  checked={settings.analytics}
                  onChange={(e) => setSettings({ ...settings, analytics: e.target.checked })}
                  className="rounded"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Marketing</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Personalized advertisements</p>
              </div>
              <div>
                <input
                  type="checkbox"
                  checked={settings.marketing}
                  onChange={(e) => setSettings({ ...settings, marketing: e.target.checked })}
                  className="rounded"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/privacy-policy#cookies', '_blank')}
            className="text-xs w-full sm:w-auto"
          >
            {t('cookies.privacyPolicy', 'Privacy Policy')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-1" />
            {showDetails ? t('cookies.hideSettings', 'Hide Settings') : t('cookies.showSettings', 'Cookie Settings')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            className="text-xs w-full sm:w-auto"
          >
            {t('cookies.decline', 'Decline Optional')}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs w-full sm:w-auto"
          >
            {t('cookies.accept', 'Accept All')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
