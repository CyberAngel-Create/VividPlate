import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Star, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';

interface PremiumFeatureDialogProps {
  featureName: string;
  description?: string;
  children: React.ReactNode;
  isPremium: boolean; // Whether the current user is premium
  isOwner?: boolean; // Whether the current user is the owner of this content
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A dialog component that either renders children if user is premium,
 * or shows a premium upgrade prompt if not premium.
 * 
 * Important: If isPremium is true OR isOwner is true, this will render
 * the children without showing the premium dialog.
 */
const PremiumFeatureDialog: React.FC<PremiumFeatureDialogProps> = ({
  featureName,
  description = "This feature is only available for premium users. Upgrade your subscription to access it.",
  children,
  isPremium,
  isOwner = false,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  // If user is premium or is the owner, just render the children directly
  if (isPremium || isOwner) {
    return <>{children}</>;
  }

  const handleUpgradeClick = () => {
    setIsOpen(false);
    navigate('/subscription');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className={`sm:max-w-${size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'}`}>
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {t('premium.featureRequired', 'Premium Feature Required')}
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            <span className="font-medium">{featureName}</span> {t('premium.isPremium', 'is a premium feature')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground">{description}</p>
          
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-100 dark:border-amber-800/30">
            <div className="flex items-start">
              <Star className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-400">
                  {t('premium.benefitsTitle', 'Premium Benefits')}
                </h4>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• {t('premium.benefit1', 'Ad-free experience for your customers')}</li>
                  <li>• {t('premium.benefit2', 'Manage up to 3 restaurant profiles')}</li>
                  <li>• {t('premium.benefit3', 'Customer feedback collection')}</li>
                  <li>• {t('premium.benefit4', 'Advanced menu analytics')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setIsOpen(false)}
          >
            {t('premium.cancel', 'Cancel')}
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            onClick={handleUpgradeClick}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {t('premium.upgrade', 'Upgrade to Premium')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumFeatureDialog;