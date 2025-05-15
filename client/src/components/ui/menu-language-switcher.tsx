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
  size?: 'default' | 'sm';
}

const MenuLanguageSwitcher = ({
  variant = 'outline',
  showLabel = false,
  size = 'default',
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
          size={showLabel ? size : 'icon'}
          className={`${showLabel ? 'gap-2' : size === 'sm' ? 'h-7 w-7 rounded-full p-0' : 'h-9 w-9 rounded-full p-0'} bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-700`}
        >
          <Globe className={`${size === 'sm' ? "h-3.5 w-3.5" : "h-4 w-4"} dark:text-white`} />
          {showLabel && <span>{t('common.translateMenu')}</span>}
          <span className="sr-only">Translate Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] bg-white dark:bg-gray-800 dark:border-gray-700">
        <DropdownMenuLabel className="dark:text-white">{t('common.language', 'Language')}</DropdownMenuLabel>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer flex items-center justify-between dark:text-white dark:hover:bg-gray-700 ${
              i18n.language === language.code ? 'bg-muted font-medium dark:bg-gray-700' : ''
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