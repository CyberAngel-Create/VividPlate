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
  
  // Handle placeholder images
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Log malformed URLs for debugging
  if (!url.includes('/uploads/')) {
    console.warn(`Possible malformed image URL: ${url}`);
  }
  
  // Ensure URLs start with a slash for server paths
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * Gets a fallback image in case the original image fails to load
 * @param type The type of fallback image (menu, logo, banner)
 * @returns URL to an appropriate fallback image
 */
export function getFallbackImage(type: 'menu' | 'logo' | 'banner' = 'menu'): string {
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
  return fallbackUrl;
}