import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';

interface AdaptiveContainerProps {
  children: ReactNode;
  className?: string;
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  maxWidth?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export function AdaptiveContainer({ 
  children, 
  className,
  padding = { mobile: 'px-4 py-6', tablet: 'px-6 py-8', desktop: 'px-8 py-12' },
  maxWidth = { mobile: 'max-w-full', tablet: 'max-w-4xl', desktop: 'max-w-6xl' }
}: AdaptiveContainerProps) {
  const { isMobile, isTablet } = useResponsive();

  const getPadding = () => {
    if (isMobile) return padding.mobile;
    if (isTablet) return padding.tablet;
    return padding.desktop;
  };

  const getMaxWidth = () => {
    if (isMobile) return maxWidth.mobile;
    if (isTablet) return maxWidth.tablet;
    return maxWidth.desktop;
  };

  return (
    <div className={cn(
      'mx-auto',
      getPadding(),
      getMaxWidth(),
      className
    )}>
      {children}
    </div>
  );
}