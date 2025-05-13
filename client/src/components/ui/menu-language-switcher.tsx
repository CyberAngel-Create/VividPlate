import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

interface MenuLanguageSwitcherProps {
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
}

const MenuLanguageSwitcher = ({
  variant = 'outline',
  showLabel = false,
}: MenuLanguageSwitcherProps) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Support for common languages including Amharic and Chinese
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'am', name: 'አማርኛ (Amharic)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'zh', name: '中文 (Chinese)' },
  ];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={showLabel ? 'default' : 'icon'}
          className={showLabel ? 'gap-2' : 'h-9 w-9 rounded-full p-0'}
        >
          <Globe className="h-4 w-4" />
          {showLabel && <span>{t('common.translateMenu')}</span>}
          <span className="sr-only">Translate Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer flex items-center justify-between ${
              i18n.language === language.code ? 'bg-muted font-medium' : ''
            }`}
          >
            <span>{language.name}</span>
            {i18n.language === language.code && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MenuLanguageSwitcher;