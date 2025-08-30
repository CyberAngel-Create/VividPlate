/**
 * Ensures a URL has the correct format with leading slash if needed
 * @param url The URL to normalize
 * @returns A normalized URL that works with the server's static file serving
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || url.trim() === '') {
    // Don't log warnings for expected empty values - just return empty string
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
  
  // Handle permanent image URLs (new database storage system)
  if (url.includes('/api/images/') || url.startsWith('/api/images/')) {
    // These are permanent image URLs served from database, return as is
    return url.startsWith('/') ? url : `/${url}`;
  }
  
  // Handle legacy uploads URLs - convert to absolute URL for proper serving
  if (url.includes('/uploads/') || url.startsWith('/uploads/')) {
    // These are legacy file upload URLs, ensure they have leading slash
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    // For frontend, return as absolute URL path that works with current server
    return cleanUrl;
  }
  
  // Handle cases where the URL might be missing uploads prefix for user-uploaded content
  // This is for backward compatibility with old URL formats
  console.warn(`Possible legacy image URL: ${url}, adding /uploads/ prefix for compatibility`);
  // Add /uploads/ prefix if missing
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  return `/uploads/${cleanUrl}`;
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
  
  console.log(`Using fallback image for ${type}: ${fallbackUrl}`);
  
  // Return fallback URL without cache busting to allow proper browser caching
  return fallbackUrl;
}