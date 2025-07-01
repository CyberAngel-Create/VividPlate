/**
 * AdSense Policy Compliance Module
 * 
 * This module ensures that AdSense ads are only displayed on pages that comply with Google AdSense policies.
 * It validates content quality, length, and appropriateness before allowing ad display.
 * 
 * Key Features:
 * - Content length validation (minimum 300 words for meaningful content)
 * - Page type validation (no ads on empty, navigation-only, or thank-you pages)
 * - Dynamic content detection
 * - Original content verification
 */

export interface ContentValidationResult {
  isValid: boolean;
  reason?: string;
  wordCount?: number;
  contentType?: string;
}

export interface PageValidationConfig {
  minWordCount: number;
  allowedPageTypes: string[];
  excludedRoutes: string[];
  requiredElements: string[];
}

// Default configuration for AdSense compliance
const defaultConfig: PageValidationConfig = {
  minWordCount: 300, // Google AdSense recommendation for meaningful content
  allowedPageTypes: ['menu', 'restaurant', 'home', 'pricing', 'contact'],
  excludedRoutes: [
    '/login',
    '/register', 
    '/logout',
    '/payment-success',
    '/thank-you',
    '/404',
    '/loading',
    '/admin',
    '/tutorial',
    '/subscription'
  ],
  requiredElements: ['h1', 'main', 'content'] // Elements that indicate substantial content
};

/**
 * Validates if the current page has sufficient content for AdSense display
 * @param route - The current page route
 * @param config - Optional configuration override
 * @returns ContentValidationResult with validation status and details
 */
export function validatePageForAds(
  route: string, 
  config: Partial<PageValidationConfig> = {}
): ContentValidationResult {
  const validationConfig = { ...defaultConfig, ...config };
  
  // Check if route is excluded
  const isExcludedRoute = validationConfig.excludedRoutes.some(excludedRoute => 
    route.startsWith(excludedRoute)
  );
  
  if (isExcludedRoute) {
    return {
      isValid: false,
      reason: 'Page type not suitable for ads (navigation, form, or utility page)',
      contentType: 'excluded'
    };
  }
  
  // Validate content on the page
  const contentValidation = validatePageContent(validationConfig);
  
  if (!contentValidation.isValid) {
    return contentValidation;
  }
  
  return {
    isValid: true,
    wordCount: contentValidation.wordCount,
    contentType: 'valid'
  };
}

/**
 * Validates the actual content on the current page
 * @param config - Validation configuration
 * @returns ContentValidationResult with content analysis
 */
export function validatePageContent(config: PageValidationConfig): ContentValidationResult {
  // Check if page has loaded and has content
  if (typeof document === 'undefined') {
    return {
      isValid: false,
      reason: 'Page not yet loaded',
      contentType: 'loading'
    };
  }
  
  // Check for required structural elements
  const hasRequiredElements = config.requiredElements.some(element => {
    const elements = document.querySelectorAll(element);
    return elements.length > 0 && 
           Array.from(elements).some(el => el.textContent && el.textContent.trim().length > 0);
  });
  
  if (!hasRequiredElements) {
    return {
      isValid: false,
      reason: 'Page lacks substantial structural content',
      contentType: 'insufficient-structure'
    };
  }
  
  // Count meaningful text content
  const wordCount = countPageWords();
  
  if (wordCount < config.minWordCount) {
    return {
      isValid: false,
      reason: `Insufficient content (${wordCount} words, minimum ${config.minWordCount} required)`,
      wordCount,
      contentType: 'insufficient-content'
    };
  }
  
  // Check for dynamic content rendering
  if (!hasDynamicContent()) {
    return {
      isValid: false,
      reason: 'Content appears to be static or template-only',
      wordCount,
      contentType: 'static-content'
    };
  }
  
  return {
    isValid: true,
    wordCount,
    contentType: 'valid'
  };
}

/**
 * Counts meaningful words on the current page
 * Excludes navigation, headers, and UI elements
 * @returns Number of meaningful words
 */
export function countPageWords(): number {
  if (typeof document === 'undefined') return 0;
  
  // Select main content areas, excluding navigation and UI elements
  const contentSelectors = [
    'main',
    '[role="main"]',
    '.content',
    '.menu-content',
    '.restaurant-content',
    'article',
    '.description',
    'p',
    '.menu-item-description'
  ];
  
  // Exclude navigation and UI elements
  const excludeSelectors = [
    'nav',
    'header',
    'footer',
    '.navigation',
    '.menu-nav',
    '.breadcrumb',
    'button',
    '.btn',
    'input',
    'select',
    '.pagination'
  ];
  
  let totalWords = 0;
  
  contentSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Skip if element is inside an excluded container
      const isExcluded = excludeSelectors.some(excludeSelector => 
        element.closest(excludeSelector)
      );
      
      if (!isExcluded) {
        const text = element.textContent || '';
        const words = text.trim().split(/\s+/).filter(word => 
          word.length > 2 && // Exclude very short words
          !/^\d+$/.test(word) && // Exclude pure numbers
          !/^[^\w]+$/.test(word) // Exclude punctuation-only
        );
        totalWords += words.length;
      }
    });
  });
  
  return totalWords;
}

/**
 * Checks if the page has dynamic, original content
 * @returns Boolean indicating if dynamic content is present
 */
export function hasDynamicContent(): boolean {
  if (typeof document === 'undefined') return false;
  
  // Check for menu items, restaurant content, or other dynamic elements
  const dynamicContentIndicators = [
    '.menu-item',
    '.restaurant-info',
    '.menu-category',
    '.price',
    '.description',
    '[data-restaurant-id]',
    '[data-menu-item]'
  ];
  
  const hasDynamicElements = dynamicContentIndicators.some(selector => {
    const elements = document.querySelectorAll(selector);
    return elements.length > 0 && 
           Array.from(elements).some(el => {
             const text = el.textContent?.trim();
             return text && text.length > 10; // Has meaningful content
           });
  });
  
  return hasDynamicElements;
}

/**
 * Checks if ads should be displayed based on user subscription and content validation
 * @param isPaidUser - Whether the user has a paid subscription
 * @param currentRoute - The current page route
 * @param customConfig - Optional custom validation configuration
 * @returns Boolean indicating if ads should be shown
 */
export function shouldDisplayAds(
  isPaidUser: boolean,
  currentRoute: string,
  customConfig?: Partial<PageValidationConfig>
): boolean {
  // Never show ads to paid users
  if (isPaidUser) {
    return false;
  }
  
  // Validate page content and route
  const validation = validatePageForAds(currentRoute, customConfig);
  
  // Only show ads if content is valid and substantial
  return validation.isValid;
}

/**
 * Hook for real-time content validation
 * Useful for components that need to react to content changes
 */
export function useContentValidation(route: string, config?: Partial<PageValidationConfig>) {
  // This would require React import - implement in component level instead
  // Return a function that components can call for validation
  return () => validatePageForAds(route, config);
}

// Export for debugging purposes in development
export const debug = {
  countPageWords,
  hasDynamicContent,
  validatePageContent,
  defaultConfig
};