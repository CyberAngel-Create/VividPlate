import { ReactNode, ButtonHTMLAttributes } from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdaptiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  size?: {
    mobile?: 'sm' | 'default' | 'lg' | 'icon';
    tablet?: 'sm' | 'default' | 'lg' | 'icon';
    desktop?: 'sm' | 'default' | 'lg' | 'icon';
  };
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  fullWidth?: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
}

export function AdaptiveButton({ 
  children, 
  className,
  size = { mobile: 'default', tablet: 'default', desktop: 'lg' },
  variant = 'default',
  fullWidth = { mobile: true, tablet: false, desktop: false },
  ...props
}: AdaptiveButtonProps) {
  const { isMobile, isTablet } = useResponsive();

  const getSize = () => {
    if (isMobile) return size.mobile;
    if (isTablet) return size.tablet;
    return size.desktop;
  };

  const getWidth = () => {
    if (isMobile && fullWidth.mobile) return 'w-full';
    if (isTablet && fullWidth.tablet) return 'w-full';
    if (!isMobile && !isTablet && fullWidth.desktop) return 'w-full';
    return '';
  };

  return (
    <Button
      className={cn(getWidth(), className)}
      size={getSize()}
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  );
}