import { useState, useEffect } from 'react';
import { normalizeImageUrl, getFallbackImage } from '@/lib/imageUtils';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string | null | undefined;
  alt: string;
  fallbackType?: 'menu' | 'logo' | 'banner';
  className?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * A responsive image component with proper fallback handling
 * and loading states - use this for all images in the app
 */
const ResponsiveImage = ({
  src,
  alt,
  fallbackType = 'menu',
  className,
  imgClassName,
  width,
  height,
  priority = false,
  onLoad,
  onError
}: ResponsiveImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Only update if src actually changes
    const normalizedSrc = src ? normalizeImageUrl(src) : getFallbackImage(fallbackType);
    // Add cache buster to prevent browser caching
    const cacheBuster = `${normalizedSrc}${normalizedSrc.includes('?') ? '&' : '?'}t=${Date.now()}`;
    if (cacheBuster !== imageSrc) {
      setLoading(true);
      setError(false);
      setImageSrc(cacheBuster);
    }
  }, [src, fallbackType]);
  
  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
    
    // Log successful image load for debugging
    console.log(`Image loaded successfully: ${imageSrc}`);
  };
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Failed to load image: ${imageSrc}`);
    setLoading(false);
    setError(true);
    
    // Try to get a fallback image
    const fallbackImage = getFallbackImage(fallbackType);
    
    // Only set fallback if we're not already trying to load it
    if (imageSrc !== fallbackImage) {
      console.log(`Using fallback image: ${fallbackImage}`);
      setImageSrc(fallbackImage);
    }
    
    onError?.(e);
  };
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-all duration-300',
            loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
            error ? 'grayscale-[30%]' : '',
            imgClassName
          )}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
};

export { ResponsiveImage };
export default ResponsiveImage;