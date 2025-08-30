import React from 'react';
import { cn } from '@/lib/utils';
import { getFallbackImage, normalizeImageUrl } from '@/lib/imageUtils';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackType?: 'menu' | 'logo' | 'banner';
}

const ResponsiveImage = ({
  src,
  alt,
  className,
  imgClassName,
  fallbackType = 'menu',
  ...props
}: ResponsiveImageProps) => {
  const [error, setError] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(() => normalizeImageUrl(src));

  const handleError = () => {
    console.error('Failed to load image:', imageSrc, 'Original src:', src);
    console.error('Image loading failed for fallback type:', fallbackType);
    setError(true);
  };

  // Update image source when src prop changes
  React.useEffect(() => {
    setError(false);
    setImageSrc(normalizeImageUrl(src));
  }, [src]);

  return (
    <img
      src={error ? getFallbackImage(fallbackType) : imageSrc}
      alt={alt}
      onError={handleError}
      className={cn('w-full h-full object-cover', className, imgClassName)}
      {...props}
    />
  );
};

export default ResponsiveImage;