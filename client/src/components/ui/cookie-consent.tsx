import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CookieConsent: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('menumate-cookie-consent');
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('menumate-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('menumate-cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {t('cookies.title', 'We use cookies')}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('cookies.message', 'We use cookies to ensure that we give you the best experience on our website. By continuing to visit this website you agree to our privacy policy and use of cookies.')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/privacy-policy', '_blank')}
            className="text-xs"
          >
            {t('cookies.privacyPolicy', 'Privacy Policy')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            className="text-xs"
          >
            {t('cookies.decline', 'Decline')}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
          >
            {t('cookies.accept', 'Accept')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;