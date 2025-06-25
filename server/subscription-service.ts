import { storage } from "./storage";
import { insertAdminLogSchema } from "@shared/schema";

export interface SubscriptionLimits {
  maxRestaurants: number;
  maxMenuItemImages: number;
  hasAds: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    maxRestaurants: 1,
    maxMenuItemImages: 5,
    hasAds: true
  },
  premium: {
    maxRestaurants: 3,
    maxMenuItemImages: -1, // Unlimited
    hasAds: false
  }
};

export class SubscriptionService {
  static async checkUserLimits(userId: number): Promise<SubscriptionLimits> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    // Check if premium subscription has expired
    if (user.subscriptionTier === "premium" && user.premiumEndDate) {
      const now = new Date();
      if (now > user.premiumEndDate) {
        // Automatically downgrade to free
        await this.downgradeToFree(userId, user.id);
        return SUBSCRIPTION_LIMITS.free;
      }
    }

    return SUBSCRIPTION_LIMITS[user.subscriptionTier] || SUBSCRIPTION_LIMITS.free;
  }

  static async upgradeToPremium(
    userId: number,
    duration: "1_month" | "3_months" | "1_year",
    adminId: number
  ): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    const now = new Date();
    const durationMap = {
      "1_month": 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      "3_months": 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
      "1_year": 365 * 24 * 60 * 60 * 1000 // 365 days in milliseconds
    };

    const endDate = new Date(now.getTime() + durationMap[duration]);

    await storage.updateUserSubscription(userId, {
      subscriptionTier: "premium",
      premiumStartDate: now,
      premiumEndDate: endDate,
      premiumDuration: duration,
      notificationSent: false
    });

    // Log admin action
    await storage.createAdminLog({
      adminId,
      action: "upgrade_subscription",
      entityType: "user",
      entityId: userId,
      details: {
        duration,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        previousTier: user.subscriptionTier
      }
    });
  }

  static async downgradeToFree(userId: number, adminId?: number): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    await storage.updateUserSubscription(userId, {
      subscriptionTier: "free",
      premiumStartDate: null,
      premiumEndDate: null,
      premiumDuration: null,
      notificationSent: false
    });

    // Log admin action if performed manually
    if (adminId) {
      await storage.createAdminLog({
        adminId,
        action: "downgrade_subscription",
        entityType: "user",
        entityId: userId,
        details: {
          previousTier: user.subscriptionTier,
          reason: "manual_downgrade"
        }
      });
    }
  }

  static async checkExpiryNotifications(): Promise<void> {
    const users = await storage.getUsersNearExpiry();
    
    for (const user of users) {
      if (!user.notificationSent && user.premiumEndDate) {
        const now = new Date();
        const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
        
        if (user.premiumEndDate <= tenDaysFromNow) {
          // Mark notification as sent
          await storage.updateUserSubscription(user.id, {
            notificationSent: true
          });
          
          // Here you would send the actual notification
          // For now, we'll log it
          console.log(`Premium expiry notification for user ${user.id}: expires on ${user.premiumEndDate}`);
        }
      }
    }
  }

  static async getSubscriptionStatus(userId: number) {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    const limits = await this.checkUserLimits(userId);
    
    let daysRemaining = null;
    if (user.subscriptionTier === "premium" && user.premiumEndDate) {
      const now = new Date();
      const timeDiff = user.premiumEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    return {
      tier: user.subscriptionTier,
      startDate: user.premiumStartDate,
      endDate: user.premiumEndDate,
      duration: user.premiumDuration,
      daysRemaining,
      limits,
      notificationSent: user.notificationSent
    };
  }

  static async validateImageUpload(userId: number): Promise<boolean> {
    const limits = await this.checkUserLimits(userId);
    
    if (limits.maxMenuItemImages === -1) {
      return true; // Unlimited for premium users
    }

    const userImageCount = await storage.getUserMenuItemImageCount(userId);
    return userImageCount < limits.maxMenuItemImages;
  }
}