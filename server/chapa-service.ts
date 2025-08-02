/**
 * Chapa Payment Gateway Integration Service
 * Ethiopian payment gateway supporting telebirr, CBE Birr, cards, and more
 */

import axios from 'axios';

export interface ChapaPaymentData {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url?: string;
  description?: string;
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

export interface ChapaInitializeResponse {
  status: string;
  message: string;
  data: {
    checkout_url: string;
    tx_ref: string;
  };
}

export interface ChapaVerificationResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    order_ref: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    created_at: string;
    updated_at: string;
  };
}

export class ChapaService {
  private secretKey: string;
  private baseUrl: string;

  constructor(secretKey: string, baseUrl: string = 'https://api.chapa.co/v1') {
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Initialize a payment with Chapa
   */
  async initializePayment(paymentData: ChapaPaymentData): Promise<ChapaInitializeResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Chapa payment initialization error:', error.response?.data || error.message);
        throw new Error(`Payment initialization failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(txRef: string): Promise<ChapaVerificationResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${txRef}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Chapa payment verification error:', error.response?.data || error.message);
        throw new Error(`Payment verification failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate a unique transaction reference
   */
  generateTxRef(prefix: string = 'vividplate'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Format amount for different currencies (minimum amount handling)
   */
  formatAmount(amount: number, currency: string = 'ETB'): number {
    // Minimum amounts per currency
    const minimumAmounts: Record<string, number> = {
      ETB: 1,    // 1 Ethiopian Birr
      USD: 0.5,  // $0.50 USD
      EUR: 0.5,  // €0.50 EUR
      GBP: 0.5,  // £0.50 GBP
    };
    
    const minimum = minimumAmounts[currency] || 1;
    return Math.max(amount, minimum);
  }

  /**
   * Validate payment data before initialization
   */
  validatePaymentData(data: ChapaPaymentData): string[] {
    const errors: string[] = [];

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.currency) {
      errors.push('Currency is required');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.first_name || data.first_name.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!data.last_name || data.last_name.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!data.tx_ref || data.tx_ref.trim().length === 0) {
      errors.push('Transaction reference is required');
    }

    if (!data.callback_url || !this.isValidUrl(data.callback_url)) {
      errors.push('Valid callback URL is required');
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Create and export a singleton instance
export const chapaService = CHAPA_SECRET_KEY 
  ? new ChapaService(CHAPA_SECRET_KEY) 
  : null;

// Currency conversion rates (ETB to other currencies)
const CURRENCY_RATES = {
  ETB: 1,
  USD: 0.018,  // 1 ETB = ~0.018 USD
  EUR: 0.017,  // 1 ETB = ~0.017 EUR
  GBP: 0.014,  // 1 ETB = ~0.014 GBP
};

// Helper function to convert price to different currencies
export function convertPrice(priceInETB: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES[targetCurrency as keyof typeof CURRENCY_RATES];
  if (!rate) return priceInETB; // Default to ETB if currency not supported
  return Math.round(priceInETB * rate * 100) / 100; // Round to 2 decimal places
}

// Helper function to get appropriate currency for user location
export function getCurrencyByLocation(countryCode?: string): string {
  const currencyMap: Record<string, string> = {
    'ET': 'ETB', // Ethiopia
    'US': 'USD', // United States
    'GB': 'GBP', // United Kingdom
    'EU': 'EUR', // European Union
    'DE': 'EUR', // Germany
    'FR': 'EUR', // France
    'IT': 'EUR', // Italy
    'ES': 'EUR', // Spain
    'NL': 'EUR', // Netherlands
    'BE': 'EUR', // Belgium
    'AT': 'EUR', // Austria
    'IE': 'EUR', // Ireland
    'PT': 'EUR', // Portugal
    'FI': 'EUR', // Finland
    'GR': 'EUR', // Greece
    'CA': 'USD', // Canada (international cards)
    'AU': 'USD', // Australia (international cards)
  };
  
  return currencyMap[countryCode || 'ET'] || 'USD'; // Default to USD for international
}

// Subscription plans for VividPlate with international pricing
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'ETB',
    description: 'Basic menu management for 1 restaurant',
    features: [
      '1 Restaurant',
      'Basic Menu Management',
      'QR Code Generation',
      'Standard Support'
    ],
    maxRestaurants: 1,
    maxMenuItems: 50,
    international: true
  },
  premium: {
    name: 'Premium',
    price: 500, // 500 ETB per month (~$9 USD)
    currency: 'ETB',
    description: 'Advanced features for growing restaurants',
    features: [
      '3 Restaurants',
      'Advanced Analytics',
      'Custom Themes',
      'Priority Support',
      'Menu Translation',
      'Advanced QR Codes'
    ],
    maxRestaurants: 3,
    maxMenuItems: 200,
    international: true,
    internationalPricing: {
      USD: 9,   // $9 USD
      EUR: 8,   // €8 EUR
      GBP: 7,   // £7 GBP
    }
  },
  business: {
    name: 'Business',
    price: 1200, // 1200 ETB per month (~$22 USD)
    currency: 'ETB',
    description: 'Complete solution for restaurant chains',
    features: [
      'Unlimited Restaurants',
      'Advanced Analytics & Reports',
      'Custom Branding',
      '24/7 Support',
      'API Access',
      'Multi-language Support',
      'White Label Solution'
    ],
    maxRestaurants: -1, // Unlimited
    maxMenuItems: -1, // Unlimited
    international: true,
    internationalPricing: {
      USD: 22,   // $22 USD
      EUR: 20,   // €20 EUR
      GBP: 17,   // £17 GBP
    }
  }
};

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;