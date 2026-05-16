export {};
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