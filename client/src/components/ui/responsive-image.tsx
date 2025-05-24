import React from 'react';
import { cn } from '@/lib/utils';
import { getFallbackImage } from '@/lib/imageUtils';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackType?: 'menu' | 'logo' | 'banner';
}

const ResponsiveImage = ({
  src,
  alt,
  className,
  fallbackType = 'menu',
  ...props
}: ResponsiveImageProps) => {
  const [error, setError] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(src);

  const handleError = () => {
    console.error('Failed to load image:', imageSrc);
    // If not already using /uploads path, try it
    if (!imageSrc.startsWith('/uploads/') && src.includes('uploads/')) {
      const localPath = `/uploads/${src.split('uploads/').pop()}`;
      console.log('Trying local path:', localPath);
      setImageSrc(localPath);
    } else {
      setError(true);
    }
  };

  return (
    <img
      src={error ? getFallbackImage(fallbackType) : imageSrc}
      alt={alt}
      onError={handleError}
      className={cn('w-full h-full object-cover', className)}
      {...props}
    />
  );
};

export default ResponsiveImage;