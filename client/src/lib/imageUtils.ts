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
  
  // Handle cases where the URL might be missing uploads prefix
  if (!url.includes('/uploads/') && !url.startsWith('/uploads/') && !url.includes('placeholder')) {
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
 * Takes into account dark mode preferences
 * @param type The type of fallback image (menu, logo, banner)
 * @returns URL to an appropriate fallback image
 */
export function getFallbackImage(type: 'menu' | 'logo' | 'banner' = 'menu'): string {
  // Check if we should use dark mode images
  // This will detect system preference or user-selected dark mode
  const isDarkMode = document.documentElement.classList.contains('dark') || 
                    window.matchMedia?.('(prefers-color-scheme: dark)').matches || 
                    localStorage.getItem('theme') === 'dark';
  
  let fallbackUrl = '';
  switch (type) {
    case 'logo':
      fallbackUrl = isDarkMode ? '/placeholder-logo-dark.svg' : '/placeholder-logo.svg';
      break;
    case 'banner':
      fallbackUrl = isDarkMode ? '/placeholder-banner-dark.svg' : '/placeholder-banner.svg';
      break;
    case 'menu':
    default:
      fallbackUrl = isDarkMode ? '/placeholder-food-dark.svg' : '/placeholder-food.svg';
      break;
  }
  
  console.log(`Using fallback image for ${type}: ${fallbackUrl} (dark mode: ${isDarkMode})`);
  return fallbackUrl;
}