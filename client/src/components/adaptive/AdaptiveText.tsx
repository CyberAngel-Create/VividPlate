import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';

interface AdaptiveTextProps {
  children: ReactNode;
  className?: string;
  size?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  weight?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

export function AdaptiveText({ 
  children, 
  className,
  size = { mobile: 'text-base', tablet: 'text-lg', desktop: 'text-xl' },
  weight = { mobile: 'font-normal', tablet: 'font-normal', desktop: 'font-normal' },
  as: Component = 'p'
}: AdaptiveTextProps) {
  const { isMobile, isTablet } = useResponsive();

  const getSize = () => {
    if (isMobile) return size.mobile;
    if (isTablet) return size.tablet;
    return size.desktop;
  };

  const getWeight = () => {
    if (isMobile) return weight.mobile;
    if (isTablet) return weight.tablet;
    return weight.desktop;
  };

  return (
    <Component className={cn(
      getSize(),
      getWeight(),
      className
    )}>
      {children}
    </Component>
  );
}