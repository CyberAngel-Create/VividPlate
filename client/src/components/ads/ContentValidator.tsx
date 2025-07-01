/**
 * Content Validator Component for AdSense Policy Compliance
 * 
 * This component validates page content to ensure compliance with Google AdSense policies.
 * It specifically checks for:
 * - Sufficient meaningful content (minimum 300 words)
 * - Original, non-template content
 * - Dynamic restaurant/menu data
 * - Proper page structure
 * 
 * Only renders children (ads) when content validation passes.
 */

import React, { useState, useEffect } from 'react';
import { validatePageForAds, ContentValidationResult } from '@/lib/adsense-compliance';

interface ContentValidatorProps {
  children: React.ReactNode;
  route: string;
  minContentWords?: number;
  onValidationChange?: (result: ContentValidationResult) => void;
}

const ContentValidator: React.FC<ContentValidatorProps> = ({ 
  children, 
  route, 
  minContentWords = 300,
  onValidationChange 
}) => {
  const [validation, setValidation] = useState<ContentValidationResult>({
    isValid: false,
    reason: 'Content validation pending...'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const validateContent = () => {
      setIsLoading(true);
      
      // Wait for content to fully load before validation
      setTimeout(() => {
        const result = validatePageForAds(route, { minWordCount: minContentWords });
        
        // If content is insufficient and we haven't reached max retries, try again
        if (!result.isValid && retryCount < maxRetries && result.contentType !== 'excluded') {
          retryCount++;
          console.log(`AdSense Policy: Content validation retry ${retryCount}/${maxRetries}`);
          setTimeout(validateContent, 2000); // Wait longer for dynamic content
          return;
        }
        
        setValidation(result);
        setIsLoading(false);
        
        // Notify parent component of validation result
        if (onValidationChange) {
          onValidationChange(result);
        }
        
        // Development logging for compliance tracking
        if (process.env.NODE_ENV === 'development') {
          console.log('AdSense Policy Validation:', {
            route,
            isValid: result.isValid,
            reason: result.reason,
            wordCount: result.wordCount,
            contentType: result.contentType
          });
        }
      }, 1000 + (retryCount * 1000)); // Progressive delay
    };
    
    validateContent();
  }, [route, minContentWords, onValidationChange]);

  // Don't render ads while loading or if validation failed
  if (isLoading || !validation.isValid) {
    return null;
  }

  // Render ads only when content validation passes
  return <>{children}</>;
};

export default ContentValidator;