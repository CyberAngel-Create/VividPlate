/**
 * Phone number utility functions for normalization and matching
 */

export interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const countryCodes: CountryCode[] = [
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", dialCode: "+251" },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  // Add more as needed...
];

/**
 * Normalize a phone number to a consistent format for storage and comparison
 * @param phoneNumber - The phone number in any format
 * @returns Normalized phone number (digits only, with country code)
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";
  
  // Remove all non-digit characters
  let digits = phoneNumber.replace(/\D/g, "");
  
  // Handle different formats for Ethiopian numbers
  if (digits.startsWith("251")) {
    // Already has country code
    return digits;
  } else if (digits.startsWith("0")) {
    // Ethiopian number starting with 0 - replace with 251
    return "251" + digits.substring(1);
  } else if (digits.length === 9) {
    // 9-digit Ethiopian number without country code or leading 0
    return "251" + digits;
  }
  
  // For other countries, try to detect country code
  for (const country of countryCodes) {
    const countryDigits = country.dialCode.replace(/\D/g, "");
    if (digits.startsWith(countryDigits)) {
      return digits;
    }
  }
  
  // If no country code detected and not Ethiopian format, assume Ethiopian
  if (digits.length >= 9 && digits.length <= 10) {
    // Remove leading 0 if present and add Ethiopian country code
    if (digits.startsWith("0")) {
      return "251" + digits.substring(1);
    } else {
      return "251" + digits;
    }
  }
  
  return digits;
}

/**
 * Check if two phone numbers match (considering different formats)
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns true if they represent the same phone number
 */
export function phoneNumbersMatch(phone1: string, phone2: string): boolean {
  if (!phone1 || !phone2) return false;
  
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  
  return normalized1 === normalized2;
}

/**
 * Format a phone number for display
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number with country code prefix
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";
  
  const normalized = normalizePhoneNumber(phoneNumber);
  
  // Find matching country code
  for (const country of countryCodes) {
    const countryDigits = country.dialCode.replace(/\D/g, "");
    if (normalized.startsWith(countryDigits)) {
      return country.dialCode + normalized.substring(countryDigits.length);
    }
  }
  
  return "+" + normalized;
}

/**
 * Get possible phone number variations for login matching
 * @param identifier - The identifier that might be a phone number
 * @returns Array of possible phone number formats to check
 */
export function getPhoneNumberVariations(identifier: string): string[] {
  if (!identifier) return [];
  
  const variations = [identifier];
  
  // If it looks like a phone number, add normalized versions
  if (/^\+?[\d\s\-\(\)]+$/.test(identifier)) {
    const normalized = normalizePhoneNumber(identifier);
    variations.push(normalized);
    
    // Add formatted version
    const formatted = formatPhoneNumber(identifier);
    if (formatted !== identifier) {
      variations.push(formatted);
    }
    
    // For Ethiopian numbers, add all possible variations
    if (normalized.startsWith("251") || identifier.startsWith("+251") || identifier.startsWith("0")) {
      const localPart = normalized.startsWith("251") ? normalized.substring(3) : identifier.replace(/^\+?251/, "").replace(/^0/, "");
      
      // Add all common Ethiopian formats
      variations.push("251" + localPart); // Country code + number
      variations.push("+251" + localPart); // +251 format
      variations.push("0" + localPart); // Local format with 0
      variations.push(localPart); // Just the local part
    }
    
    // For other countries, try common formats
    for (const country of countryCodes) {
      const countryDigits = country.dialCode.replace(/\D/g, "");
      if (normalized.startsWith(countryDigits)) {
        const localPart = normalized.substring(countryDigits.length);
        variations.push(country.dialCode + localPart); // +XX format
        variations.push(countryDigits + localPart); // Just digits
      }
    }
  }
  
  // Remove duplicates
  return [...new Set(variations)];
}