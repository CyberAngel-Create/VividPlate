import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';

interface AdaptiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export function AdaptiveGrid({ 
  children, 
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 4, tablet: 6, desktop: 8 }
}: AdaptiveGridProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getGridCols = () => {
    if (isMobile) return `grid-cols-${cols.mobile || 1}`;
    if (isTablet) return `grid-cols-${cols.tablet || 2}`;
    return `grid-cols-${cols.desktop || 3}`;
  };

  const getGap = () => {
    if (isMobile) return `gap-${gap.mobile || 4}`;
    if (isTablet) return `gap-${gap.tablet || 6}`;
    return `gap-${gap.desktop || 8}`;
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      getGap(),
      className
    )}>
      {children}
    </div>
  );
}