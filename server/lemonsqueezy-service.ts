/**
 * LemonSqueezy Payment Integration Service
 * Handles $25/month and $250/year per-restaurant subscriptions
 */

import axios from 'axios';
import crypto from 'crypto';

// ─── Constants ─────────────────────────────────────────────────────────────
export const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';
export const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '338030';
export const LS_MONTHLY_VARIANT_ID = process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID || '1713315';
export const LS_YEARLY_VARIANT_ID = process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID || '1713296';
// Website Builder add-on — Product ID 1106224, Variant ID 1732293
export const LS_WEBSITE_ADDON_VARIANT_ID = process.env.LEMONSQUEEZY_WEBSITE_ADDON_VARIANT_ID || '1732293';

export const LS_PLANS = {
  monthly: {
    variantId: LS_MONTHLY_VARIANT_ID,
    name: 'VividPlate Monthly',
    price: 25,
    currency: 'USD',
    billingPeriod: 'month' as const,
    description: 'Full access to all VividPlate features, billed monthly',
    features: [
      '1 Restaurant Profile',
      'Unlimited Menu Items',
      'Unlimited Image Uploads',
      'QR Code Generation',
      'Custom Themes & Branding',
      'Analytics Dashboard',
      'Priority Support',
      'Ad-Free Experience',
    ],
    badge: null,
  },
  yearly: {
    variantId: LS_YEARLY_VARIANT_ID,
    name: 'VividPlate Yearly',
    price: 250,
    currency: 'USD',
    billingPeriod: 'year' as const,
    description: 'Full access to all VividPlate features, billed yearly — save $50!',
    features: [
      '1 Restaurant Profile',
      'Unlimited Menu Items',
      'Unlimited Image Uploads',
      'QR Code Generation',
      'Custom Themes & Branding',
      'Advanced Analytics',
      'Priority 24/7 Support',
      'Ad-Free Experience',
      'Early Access to New Features',
    ],
    badge: 'Save $50/year',
  },
};

export type LsPlan = keyof typeof LS_PLANS | 'website_addon';

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface LsCheckoutOptions {
  variantId: string;
  userEmail: string;
  userName: string;
  userId: number;
  planKey: LsPlan;
  successUrl: string;
  cancelUrl: string;
}

export interface LsCheckoutResponse {
  checkoutUrl: string;
  checkoutId: string;
}

export interface LsSubscriptionData {
  id: string;
  status: string; // 'active' | 'cancelled' | 'expired' | 'on_trial' | 'paused' | 'past_due' | 'unpaid'
  variantId: string;
  customerId: string;
  customerEmail: string;
  renewsAt: string | null;
  endsAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Service Class ───────────────────────────────────────────────────────────
export class LemonSqueezyService {
  private apiKey: string;
  private webhookSecret: string | null;

  constructor(apiKey: string, webhookSecret?: string) {
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret || null;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    };
  }

  /**
   * Create a hosted LemonSqueezy checkout URL
   */
  async createCheckout(opts: LsCheckoutOptions): Promise<LsCheckoutResponse> {
    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            redirect_url: opts.successUrl,
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
            desc: true,
            discount: true,
            dark: false,
            subscription_preview: true,
            button_color: '#f97316', // orange accent
          },
          checkout_data: {
            email: opts.userEmail,
            name: opts.userName,
            custom: {
              user_id: String(opts.userId),
              plan_key: opts.planKey,
            },
          },
          expires_at: null,
          preview: false,
        },
        relationships: {
          store: {
            data: { type: 'stores', id: LS_STORE_ID },
          },
          variant: {
            data: { type: 'variants', id: opts.variantId },
          },
        },
      },
    };

    try {
      const response = await axios.post(`${LS_API_BASE}/checkouts`, payload, {
        headers: this.headers,
      });

      const checkoutData = response.data?.data;
      const checkoutUrl = checkoutData?.attributes?.url;
      const checkoutId = checkoutData?.id;

      if (!checkoutUrl) {
        throw new Error('No checkout URL returned from LemonSqueezy');
      }

      return { checkoutUrl, checkoutId };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const firstError = error.response?.data?.errors?.[0];
        const detail = firstError?.detail || error.message;
        const status = firstError?.status;
        
        // Provide clearer error messages for common issues
        if (detail?.includes('related resource does not exist')) {
          console.error('LemonSqueezy config error:', {
            storeId: LS_STORE_ID,
            variantId: opts.variantId,
            status: status,
            hint: 'Please ensure the variant is published in your LemonSqueezy dashboard',
          });
          throw new Error(
            `LemonSqueezy checkout creation failed: The product variant is not available. ` +
            `Please ensure your LemonSqueezy product variants are published. ` +
            `Store: ${LS_STORE_ID}, Variant: ${opts.variantId}`
          );
        }
        throw new Error(`LemonSqueezy checkout creation failed: ${detail}`);
      }
      throw error;
    }
  }

  /**
   * Fetch a subscription by its LemonSqueezy subscription ID
   */
  async getSubscription(subscriptionId: string): Promise<LsSubscriptionData | null> {
    try {
      const response = await axios.get(
        `${LS_API_BASE}/subscriptions/${subscriptionId}`,
        { headers: this.headers }
      );

      const data = response.data?.data;
      if (!data) return null;

      const attrs = data.attributes;
      return {
        id: data.id,
        status: attrs.status,
        variantId: String(attrs.variant_id),
        customerId: String(attrs.customer_id),
        customerEmail: attrs.user_email,
        renewsAt: attrs.renews_at,
        endsAt: attrs.ends_at,
        trialEndsAt: attrs.trial_ends_at,
        createdAt: attrs.created_at,
        updatedAt: attrs.updated_at,
      };
    } catch (error: any) {
      console.error('LemonSqueezy get subscription error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Verify a LemonSqueezy webhook signature (HMAC-SHA256)
   */
  verifyWebhook(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) {
      // Fail closed in production — never accept unsigned webhooks there.
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ LEMONSQUEEZY_WEBHOOK_SECRET not configured – rejecting webhook in production');
        return false;
      }
      console.warn('⚠️ LEMONSQUEEZY_WEBHOOK_SECRET not configured – skipping signature check (development only)');
      return true;
    }

    try {
      const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(bodyStr);
      const digest = hmac.digest('hex');
      return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Determine subscription tier from LS plan key
   */
  tierFromPlan(planKey: string): string {
    if (planKey === 'monthly' || planKey === 'yearly') return 'premium';
    return 'free';
  }

  /**
   * Calculate subscription expiry date from a LemonSqueezy subscription
   */
  expiryFromSubscription(sub: LsSubscriptionData): Date | null {
    const dateStr = sub.endsAt || sub.renewsAt;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

export const lsService: LemonSqueezyService | null = LS_API_KEY
  ? new LemonSqueezyService(LS_API_KEY, LS_WEBHOOK_SECRET)
  : null;

if (!LS_API_KEY) {
  console.warn('⚠️ LEMONSQUEEZY_API_KEY not set – LemonSqueezy payments disabled');
} else {
  console.log('✅ LemonSqueezy payment service initialized');
}
