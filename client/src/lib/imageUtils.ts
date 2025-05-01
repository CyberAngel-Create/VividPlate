/**
 * Ensures a URL has the correct format with leading slash if needed
 * @param url The URL to normalize
 * @returns A normalized URL that works with the server's static file serving
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }
  
  // Handle placeholder images
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
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
  switch (type) {
    case 'logo':
      return '/placeholder-logo.jpg';
    case 'banner':
      return '/placeholder-banner.jpg';
    case 'menu':
    default:
      return '/placeholder-food.jpg';
  }
}