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
   * Format amount for Ethiopian Birr (minimum amount handling)
   */
  formatAmount(amount: number): number {
    // Chapa requires minimum amount of 1 ETB
    return Math.max(amount, 1);
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

// Subscription plans for VividPlate
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
    maxMenuItems: 50
  },
  premium: {
    name: 'Premium',
    price: 500, // 500 ETB per month
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
    maxMenuItems: 200
  },
  business: {
    name: 'Business',
    price: 1200, // 1200 ETB per month
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
    maxMenuItems: -1 // Unlimited
  }
};

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;