/**
 * Ensures a URL has the correct format with leading slash if needed
 * @param url The URL to normalize
 * @returns A normalized URL that works with the server's static file serving
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) {
    console.warn('Attempted to normalize a null or undefined image URL');
    return '';
  }
  
  // Handle external URLs (http/https) 
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Handle SVG placeholder images in the public directory
  if (url.includes('placeholder') && (url.endsWith('.svg') || url.includes('.svg?'))) {
    // If it's already a properly formatted path with leading slash, return as is
    return url.startsWith('/') ? url : `/${url}`;
  }
  
  // Handle cases where the URL might be missing uploads prefix for user-uploaded content
  if (!url.includes('/uploads/') && !url.startsWith('/uploads/')) {
    console.warn(`Possible malformed image URL: ${url}, adding /uploads/ prefix`);
    // Add /uploads/ prefix if missing
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `/uploads/${cleanUrl}`;
  }
  
  // Ensure URLs start with a slash for server paths
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * Gets a fallback image in case the original image fails to load
 * Always returns light mode images for the customer menu view
 * @param type The type of fallback image (menu, logo, banner)
 * @returns URL to an appropriate fallback image
 */
export function getFallbackImage(type: 'menu' | 'logo' | 'banner' = 'menu'): string {
  // We've removed dark mode support for the customer menu view
  // Always use light mode images for consistency
  
  let fallbackUrl = '';
  switch (type) {
    case 'logo':
      fallbackUrl = '/placeholder-logo.svg';
      break;
    case 'banner':
      fallbackUrl = '/placeholder-banner.svg';
      break;
    case 'menu':
    default:
      fallbackUrl = '/placeholder-food.svg';
      break;
  }
  
  // Check if the fallback exists, if not use the generic placeholder as final fallback
  const finalFallback = '/placeholder-image.svg';
  
  // We're adding a cache-busting parameter to avoid browser caching issues
  // This ensures the browser doesn't serve a cached image that might be missing
  const cacheBuster = `?t=${Date.now()}`;
  
  console.log(`Using fallback image for ${type}: ${fallbackUrl}`);
  
  // Return with cache buster to prevent cached 404 responses
  return `${fallbackUrl}${cacheBuster}`;
}