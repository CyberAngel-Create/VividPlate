import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdaptiveCardProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  shadow?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  hover?: boolean;
}

export function AdaptiveCard({
  children,
  title,
  description,
  className,
  padding = { mobile: 'p-4', tablet: 'p-6', desktop: 'p-8' },
  shadow = { mobile: 'shadow-sm', tablet: 'shadow-md', desktop: 'shadow-lg' },
  hover = true
}: AdaptiveCardProps) {
  const { isMobile, isTablet } = useResponsive();

  const getPadding = () => {
    if (isMobile) return padding.mobile;
    if (isTablet) return padding.tablet;
    return padding.desktop;
  };

  const getShadow = () => {
    if (isMobile) return shadow.mobile;
    if (isTablet) return shadow.tablet;
    return shadow.desktop;
  };

  const getHoverEffect = () => {
    return hover ? 'hover:shadow-xl transition-shadow duration-200' : '';
  };

  return (
    <Card className={cn(
      getShadow(),
      getHoverEffect(),
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(
          isMobile ? 'pb-3' : 'pb-4'
        )}>
          {title && (
            <CardTitle className={cn(
              isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'
            )}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={cn(
              isMobile ? 'text-sm' : 'text-base'
            )}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      {children && (
        <CardContent className={cn(
          getPadding(),
          title || description ? 'pt-0' : ''
        )}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}