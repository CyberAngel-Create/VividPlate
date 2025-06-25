import { 
  users, User, InsertUser,
  restaurants, Restaurant, InsertRestaurant,
  menuCategories, MenuCategory, InsertMenuCategory,
  menuItems, MenuItem, InsertMenuItem,
  menuViews, MenuView, InsertMenuView,
  registrationAnalytics, RegistrationAnalytics, InsertRegistrationAnalytics,
  subscriptions, Subscription, InsertSubscription,
  payments, Payment, InsertPayment,
  feedbacks, Feedback, InsertFeedback,
  dietaryPreferences, DietaryPreference, InsertDietaryPreference,
  adminLogs, AdminLog, InsertAdminLog,
  pricingPlans, PricingPlan, InsertPricingPlan,
  contactInfo, ContactInfo, InsertContactInfo,
  advertisements, Advertisement, InsertAdvertisement,
  fileUploads, FileUpload, InsertFileUpload,
  adSettings, AdSettings, InsertAdSettings,
  menuExamples, MenuExample, InsertMenuExample,
  testimonials, Testimonial, InsertTestimonial
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, desc, or, isNull, lte, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserWithPassword(id: number, user: { username: string, email: string, password: string }): Promise<User>;
  verifyPassword(userId: number, password: string): Promise<boolean>;
  setResetPasswordToken(email: string, token: string, expires: Date): Promise<User | undefined>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  countUsers(): Promise<number>;
  countActiveUsers(): Promise<number>;
  countUsersBySubscriptionTier(tier: string): Promise<number>;
  getRecentUsers(limit: number): Promise<User[]>;
  toggleUserStatus(id: number, isActive: boolean): Promise<User | undefined>;
  upgradeUserSubscription(id: number, tier: string): Promise<User | undefined>;
  updateUserSubscription(id: number, tier: string, expiryDate: Date): Promise<User | undefined>;
  updateUserStatus(id: number, isActive: boolean): Promise<User | undefined>;
  countRestaurants(): Promise<number>;
  updateUserPremiumStatus(userId: number, subscriptionData: { 
    subscriptionTier: string; 
    premiumStartDate?: Date | null; 
    premiumEndDate?: Date | null;
    premiumDuration?: string | null;
    notificationSent?: boolean;
  }): Promise<User>;
  getUsersNearExpiry(): Promise<User[]>;
  getUserMenuItemImageCount(userId: number): Promise<number>;

  // Admin operations
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(limit?: number): Promise<AdminLog[]>;
  getAdminLogsByAdminId(adminId: number, limit?: number): Promise<AdminLog[]>;

  // Pricing plan operations
  getAllPricingPlans(): Promise<PricingPlan[]>;
  getPricingPlan(id: number): Promise<PricingPlan | undefined>;
  createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan>;
  updatePricingPlan(id: number, plan: Partial<PricingPlan>): Promise<PricingPlan | undefined>;
  deletePricingPlan(id: number): Promise<boolean>;

  // Contact info operations
  getContactInfo(): Promise<ContactInfo | undefined>;
  updateContactInfo(info: Partial<ContactInfo>): Promise<ContactInfo>;

  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantsByUserId(userId: number): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  countRestaurantsByUserId(userId: number): Promise<number>;
  getAllRestaurants(): Promise<Restaurant[]>;

  // Menu category operations
  getMenuCategory(id: number): Promise<MenuCategory | undefined>;
  getMenuCategoriesByRestaurantId(restaurantId: number): Promise<MenuCategory[]>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;
  updateMenuCategory(id: number, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined>;
  deleteMenuCategory(id: number): Promise<boolean>;

  // Menu item operations
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]>;
  getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;

  // Menu view operations
  getMenuViewsByRestaurantId(restaurantId: number): Promise<MenuView[]>;
  countMenuViewsByRestaurantId(restaurantId: number): Promise<number>;
  countMenuViewsInDateRange(startDate: Date, endDate: Date): Promise<number>;
  createMenuView(view: InsertMenuView): Promise<MenuView>;

  // Registration analytics operations
  createRegistrationAnalytics(analytics: InsertRegistrationAnalytics): Promise<RegistrationAnalytics>;
  getRegistrationAnalyticsByUserId(userId: number): Promise<RegistrationAnalytics | undefined>;
  countRegistrationsInDateRange(startDate: Date, endDate: Date): Promise<number>;
  countRegistrationsBySource(source: string): Promise<number>;

  // Stats operations
  getMenuItemCountByRestaurantId(restaurantId: number): Promise<number>;
  getQrScanCountByRestaurantId(restaurantId: number): Promise<number>;
  
  // Menu item analytics operations
  incrementMenuItemClicks(itemId: number): Promise<void>;
  getMenuItemAnalytics(restaurantId: number): Promise<Array<{id: number, name: string, clickCount: number, categoryName: string}>>;

  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getActiveSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription | undefined>;
  getAllSubscriptions(): Promise<Subscription[]>;

  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUserId(userId: number): Promise<Payment[]>;
  getPaymentsBySubscriptionId(subscriptionId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;

  // Feedback operations
  getFeedback(id: number): Promise<Feedback | undefined>;
  getFeedbacksByRestaurantId(restaurantId: number): Promise<Feedback[]>;
  getFeedbacksByMenuItemId(menuItemId: number): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: number, feedback: Partial<Feedback>): Promise<Feedback | undefined>;
  approveFeedback(id: number): Promise<Feedback | undefined>;
  rejectFeedback(id: number): Promise<Feedback | undefined>;

  // Dietary preferences operations
  getDietaryPreference(id: number): Promise<DietaryPreference | undefined>;
  getDietaryPreferenceByUserId(userId: number): Promise<DietaryPreference | undefined>;
  getDietaryPreferenceBySessionId(sessionId: string): Promise<DietaryPreference | undefined>;
  createDietaryPreference(preference: InsertDietaryPreference): Promise<DietaryPreference>;
  updateDietaryPreference(id: number, preference: Partial<InsertDietaryPreference>): Promise<DietaryPreference | undefined>;
  deleteDietaryPreference(id: number): Promise<boolean>;

  // Advertisement operations
  getAdvertisement(id: number): Promise<Advertisement | undefined>;
  getAdvertisements(): Promise<Advertisement[]>;
  getActiveAdvertisementByPosition(position: string): Promise<Advertisement | undefined>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: number, ad: Partial<InsertAdvertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<boolean>;

  // File upload operations
  createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload>;
  getFileUpload(id: number): Promise<FileUpload | undefined>;
  getFileUploadByStoredFilename(storedFilename: string): Promise<FileUpload | undefined>;
  getFileUploadsByUserId(userId: number): Promise<FileUpload[]>;
  getFileUploadsByRestaurantId(restaurantId: number): Promise<FileUpload[]>;
  getFileUploadsByCategory(category: string): Promise<FileUpload[]>;
  updateFileUploadStatus(id: number, status: string): Promise<FileUpload | undefined>;

  // Menu examples operations
  getMenuExamples(): Promise<MenuExample[]>;
  getActiveMenuExamples(): Promise<MenuExample[]>;
  getMenuExample(id: number): Promise<MenuExample | undefined>;
  createMenuExample(example: InsertMenuExample): Promise<MenuExample>;
  updateMenuExample(id: number, example: Partial<MenuExample>): Promise<MenuExample | undefined>;
  deleteMenuExample(id: number): Promise<boolean>;

  // Testimonials operations
  getTestimonials(): Promise<Testimonial[]>;
  getActiveTestimonials(): Promise<Testimonial[]>;
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, testimonial: Partial<Testimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: number): Promise<boolean>;
  deleteFileUpload(id: number): Promise<boolean>;

  // Ad settings operations
  getAdSettings(): Promise<AdSettings | undefined>;
  updateAdSettings(settings: Partial<InsertAdSettings>): Promise<AdSettings>;
  
  // Analytics operations
  incrementMenuItemClicks(itemId: number): Promise<void>;
  getMenuItemAnalytics(restaurantId: number): Promise<Array<{itemId: number, itemName: string, clickCount: number}>>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private restaurants: Map<number, Restaurant>;
  private menuCategories: Map<number, MenuCategory>;
  private menuItems: Map<number, MenuItem>;
  private menuViews: Map<number, MenuView>;
  private registrationAnalytics: Map<number, RegistrationAnalytics>;
  private dietaryPreferences: Map<number, DietaryPreference>;
  private subscriptions: Map<number, Subscription>;
  private payments: Map<number, Payment>;
  private feedbacks: Map<number, Feedback>;
  private adminLogs: Map<number, AdminLog>;
  private pricingPlans: Map<number, PricingPlan>;
  private contactInfo: ContactInfo;
  private advertisements: Map<number, Advertisement>;
  private fileUploads: Map<number, FileUpload>;
  private adSettings: AdSettings | null;

  private currentIds: {
    users: number;
    restaurants: number;
    menuCategories: number;
    menuItems: number;
    menuViews: number;
    registrationAnalytics: number;
    dietaryPreferences: number;
    subscriptions: number;
    payments: number;
    feedbacks: number;
    adminLogs: number;
    pricingPlans: number;
    advertisements: number;
    fileUploads: number;
  };

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.menuCategories = new Map();
    this.menuItems = new Map();
    this.menuViews = new Map();
    this.registrationAnalytics = new Map();
    this.dietaryPreferences = new Map();
    this.subscriptions = new Map();
    this.payments = new Map();
    this.feedbacks = new Map();
    this.adminLogs = new Map();
    this.pricingPlans = new Map();
    this.advertisements = new Map();
    this.fileUploads = new Map();
    this.adSettings = {
      id: 1,
      position: "bottom",
      isEnabled: true,
      description: "Where the advertisement will be displayed on the menu.",
      displayFrequency: 1,
      maxAdsPerPage: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contactInfo = {
      id: 1,
      address: 'Ethiopia, Addis Abeba',
      email: 'menumate.spp@gmail.com',
      phone: '+251-913-690-687',
      updatedAt: new Date()
    };

    this.currentIds = {
      users: 1,
      restaurants: 1,
      menuCategories: 1,
      menuItems: 1,
      menuViews: 1,
      registrationAnalytics: 1,
      dietaryPreferences: 1,
      subscriptions: 1,
      payments: 1,
      feedbacks: 1,
      adminLogs: 1,
      pricingPlans: 1,
      advertisements: 1,
      fileUploads: 1
    };

    // Create an admin account if none exists
    this.initializeAdminUser();
  }

  private async initializeAdminUser() {
    // Initialize default pricing plans
    this.initializeDefaultPricingPlans();

    const adminUser = await this.getUserByUsername('admin');
    if (!adminUser) {
      // Create default admin user with username 'admin' and password 'admin1234'
      const adminPassword = '$2a$10$2R9tW8PUo1W/jnJm/JgHMuc6MLVYXEyfrwWwZ38iGhMk9nqo3KX5u'; // Hashed 'admin1234'
      const now = new Date();

      const id = this.currentIds.users++;
      const user: User = {
        id,
        username: 'admin',
        password: adminPassword,
        email: 'admin@digitamenumate.com',
        fullName: 'Admin User',
        isAdmin: true,
        isActive: true,
        lastLogin: now,
        createdAt: now,
        subscriptionTier: 'premium',
        premiumStartDate: null,
        premiumEndDate: null,
        premiumDuration: null,
        notificationSent: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        telebirrCustomerId: null,
        resetPasswordToken: null,
        resetPasswordExpires: null
      };

      this.users.set(id, user);
      console.log('Initialized admin user with ID:', id);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetPasswordToken === token
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      subscriptionTier: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      telebirrCustomerId: null,
      subscriptionExpiry: null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      isAdmin: insertUser.isAdmin || false,
      isActive: insertUser.isActive || true,
      lastLogin: now,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async setResetPasswordToken(email: string, token: string, expires: Date): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    this.users.set(user.id, user);

    return user;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByResetToken(token);
    if (!user || !user.resetPasswordExpires) return false;

    // Check if token is expired
    const now = new Date();
    if (now > user.resetPasswordExpires) return false;

    // Update password and clear token
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    this.users.set(user.id, user);

    return true;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Note: Password comparison is handled at the route level
    user.password = newPassword;
    this.users.set(userId, user);

    return true;
  }

  async updateUserWithPassword(id: number, userData: { username: string, email: string, password: string }): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = { 
      ...user, 
      username: userData.username,
      email: userData.email,
      password: userData.password
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // In the MemStorage implementation, we'll assume password comparison
    // is done by the comparePasswords function in routes.ts
    return true;
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurantsByUserId(userId: number): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(
      (restaurant) => restaurant.userId === userId
    );
  }

  async countRestaurantsByUserId(userId: number): Promise<number> {
    return (await this.getRestaurantsByUserId(userId)).length;
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.currentIds.restaurants++;
    const restaurant: Restaurant = { 
      ...insertRestaurant, 
      id,
      description: insertRestaurant.description || null,
      cuisine: insertRestaurant.cuisine || null,
      logoUrl: insertRestaurant.logoUrl || null,
      bannerUrl: insertRestaurant.bannerUrl || null,
      phone: insertRestaurant.phone || null,
      email: insertRestaurant.email || null,
      address: insertRestaurant.address || null,
      hoursOfOperation: insertRestaurant.hoursOfOperation || null,
      tags: insertRestaurant.tags || null
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: number, restaurantUpdate: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;

    const updatedRestaurant = { ...restaurant, ...restaurantUpdate };
    this.restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  }

  // Menu category operations
  async getMenuCategory(id: number): Promise<MenuCategory | undefined> {
    return this.menuCategories.get(id);
  }

  async getMenuCategoriesByRestaurantId(restaurantId: number): Promise<MenuCategory[]> {
    return Array.from(this.menuCategories.values())
      .filter((category) => category.restaurantId === restaurantId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createMenuCategory(insertCategory: InsertMenuCategory): Promise<MenuCategory> {
    const id = this.currentIds.menuCategories++;
    const category: MenuCategory = { 
      ...insertCategory, 
      id,
      displayOrder: insertCategory.displayOrder ?? 0
    };
    this.menuCategories.set(id, category);
    return category;
  }

  async updateMenuCategory(id: number, categoryUpdate: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined> {
    const category = this.menuCategories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryUpdate };
    this.menuCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteMenuCategory(id: number): Promise<boolean> {
    return this.menuCategories.delete(id);
  }

  // Menu item operations
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter((item) => item.categoryId === categoryId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    const categories = await this.getMenuCategoriesByRestaurantId(restaurantId);
    const categoryIds = categories.map(cat => cat.id);

    return Array.from(this.menuItems.values())
      .filter(item => categoryIds.includes(item.categoryId));
  }

  async createMenuItem(insertItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.currentIds.menuItems++;
    const item: MenuItem = { 
      ...insertItem, 
      id,
      description: insertItem.description || null,
      tags: insertItem.tags || null,
      displayOrder: insertItem.displayOrder ?? 0,
      currency: insertItem.currency || null,
      imageUrl: insertItem.imageUrl || null,
      isAvailable: insertItem.isAvailable ?? true
    };
    this.menuItems.set(id, item);
    return item;
  }

  async updateMenuItem(id: number, itemUpdate: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const item = this.menuItems.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...itemUpdate };
    this.menuItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  // Menu view operations
  async getMenuViewsByRestaurantId(restaurantId: number): Promise<MenuView[]> {
    return Array.from(this.menuViews.values())
      .filter((view) => view.restaurantId === restaurantId)
      .sort((a, b) => {
        return new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime();
      });
  }

  async countMenuViewsByRestaurantId(restaurantId: number): Promise<number> {
    return (await this.getMenuViewsByRestaurantId(restaurantId)).length;
  }

  async countMenuViewsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    return Array.from(this.menuViews.values())
      .filter(view => {
        const viewDate = new Date(view.viewedAt);
        return viewDate >= startDate && viewDate <= endDate;
      }).length;
  }

  async countTotalMenuViews(): Promise<number> {
    return this.menuViews.size;
  }

  async createMenuView(insertView: InsertMenuView): Promise<MenuView> {
    const id = this.currentIds.menuViews++;
    const viewedAt = new Date();
    const view: MenuView = { ...insertView, id, viewedAt };
    this.menuViews.set(id, view);
    return view;
  }

  // Registration analytics operations
  async createRegistrationAnalytics(insertAnalytics: InsertRegistrationAnalytics): Promise<RegistrationAnalytics> {
    const id = this.currentIds.registrationAnalytics++;
    const registeredAt = new Date();
    const analytics: RegistrationAnalytics = { 
      ...insertAnalytics, 
      id, 
      registeredAt 
    };
    this.registrationAnalytics.set(id, analytics);
    return analytics;
  }

  async getRegistrationAnalyticsByUserId(userId: number): Promise<RegistrationAnalytics | undefined> {
    return Array.from(this.registrationAnalytics.values()).find(
      (analytics) => analytics.userId === userId
    );
  }

  async countRegistrationsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    return Array.from(this.registrationAnalytics.values()).filter(
      (analytics) => {
        const registeredAt = new Date(analytics.registeredAt);
        return registeredAt >= startDate && registeredAt <= endDate;
      }
    ).length;
  }

  async countRegistrationsBySource(source: string): Promise<number> {
    return Array.from(this.registrationAnalytics.values()).filter(
      (analytics) => analytics.source === source
    ).length;
  }

  // Stats operations
  async getMenuItemCountByRestaurantId(restaurantId: number): Promise<number> {
    return (await this.getMenuItemsByRestaurantId(restaurantId)).length;
  }

  async getQrScanCountByRestaurantId(restaurantId: number): Promise<number> {
    return (await this.getMenuViewsByRestaurantId(restaurantId))
      .filter(view => view.source === 'qr')
      .length;
  }



  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async getActiveSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    return { ...subscription, id: 1, startDate: new Date() }; // Minimal implementation
  }

  async updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return []; // Not implemented in memory storage
  }

  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return []; // Not implemented in memory storage
  }

  async getPaymentsBySubscriptionId(subscriptionId: number): Promise<Payment[]> {
    return []; // Not implemented in memory storage
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    return { ...payment, id: 1, createdAt: new Date() }; // Minimal implementation
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined> {
    return undefined; // Not implemented in memory storage
  }

  // Admin methods
  async getAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  async countRestaurants(): Promise<number> {
    return this.restaurants.size;
  }

  async updateUserSubscription(id: number, tier: string, expiryDate: Date): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      subscriptionTier: tier,
      premiumStartDate: tier === 'premium' ? new Date() : null,
      premiumEndDate: tier === 'premium' ? expiryDate : null
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStatus(id: number, isActive: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, isActive };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async getFeedbacksByRestaurantId(restaurantId: number): Promise<Feedback[]> {
    return []; // Not implemented in memory storage
  }

  async getFeedbacksByMenuItemId(menuItemId: number): Promise<Feedback[]> {
    return []; // Not implemented in memory storage
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    return { ...feedback, id: 1, createdAt: new Date() }; // Minimal implementation
  }

  async updateFeedback(id: number, feedbackUpdate: Partial<Feedback>): Promise<Feedback | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async approveFeedback(id: number): Promise<Feedback | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async rejectFeedback(id: number): Promise<Feedback | undefined> {
    return undefined; // Not implemented in memory storage
  }

  // Dietary preferences operations
  async getDietaryPreference(id: number): Promise<DietaryPreference | undefined> {
    return this.dietaryPreferences.get(id);
  }

  async getDietaryPreferenceByUserId(userId: number): Promise<DietaryPreference | undefined> {
    return Array.from(this.dietaryPreferences.values()).find(
      (pref) => pref.userId === userId
    );
  }

  async getDietaryPreferenceBySessionId(sessionId: string): Promise<DietaryPreference | undefined> {
    return Array.from(this.dietaryPreferences.values()).find(
      (pref) => pref.sessionId === sessionId
    );
  }

  async createDietaryPreference(insertPreference: InsertDietaryPreference): Promise<DietaryPreference> {
    const id = this.currentIds.dietaryPreferences++;
    const now = new Date();
    const preference: DietaryPreference = {
      ...insertPreference,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.dietaryPreferences.set(id, preference);
    return preference;
  }

  async updateDietaryPreference(id: number, preferenceUpdate: Partial<InsertDietaryPreference>): Promise<DietaryPreference | undefined> {
    const preference = this.dietaryPreferences.get(id);
    if (!preference) return undefined;

    const updatedPreference = { 
      ...preference, 
      ...preferenceUpdate,
      updatedAt: new Date()
    };
    this.dietaryPreferences.set(id, updatedPreference);
    return updatedPreference;
  }

  async deleteDietaryPreference(id: number): Promise<boolean> {
    return this.dietaryPreferences.delete(id);
  }

  // Advertisement operations
  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    return this.advertisements.get(id);
  }

  async getAdvertisements(): Promise<Advertisement[]> {
    return Array.from(this.advertisements.values());
  }

  async getActiveAdvertisementByPosition(position: string): Promise<Advertisement | undefined> {
    const now = new Date();
    return Array.from(this.advertisements.values()).find(
      (ad) => 
        ad.position === position && 
        ad.isActive && 
        (!ad.startDate || new Date(ad.startDate) <= now) && 
        (!ad.endDate || new Date(ad.endDate) >= now)
    );
  }

  async createAdvertisement(insertAd: InsertAdvertisement): Promise<Advertisement> {
    const id = this.currentIds.advertisements++;
    const now = new Date();
    const ad: Advertisement = { 
      ...insertAd, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.advertisements.set(id, ad);
    return ad;
  }

  async updateAdvertisement(id: number, adUpdate: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const ad = this.advertisements.get(id);
    if (!ad) return undefined;

    const now = new Date();
    const updatedAd = { 
      ...ad, 
      ...adUpdate,
      updatedAt: now
    };
    this.advertisements.set(id, updatedAd);
    return updatedAd;
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    return this.advertisements.delete(id);
  }

  // File upload operations
  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const id = this.currentIds.fileUploads++;
    const newFileUpload: FileUpload = {
      id,
      ...fileUpload,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.fileUploads.set(id, newFileUpload);
    return newFileUpload;
  }

  async getFileUpload(id: number): Promise<FileUpload | undefined> {
    return this.fileUploads.get(id);
  }

  async getFileUploadByStoredFilename(storedFilename: string): Promise<FileUpload | undefined> {
    for (const upload of this.fileUploads.values()) {
      if (upload.storedFilename === storedFilename) {
        return upload;
      }
    }
    return undefined;
  }

  async getFileUploadsByUserId(userId: number): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .filter(upload => upload.userId === userId);
  }

  async getFileUploadsByRestaurantId(restaurantId: number): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .filter(upload => upload.restaurantId === restaurantId);
  }

  async getFileUploadsByCategory(category: string): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .filter(upload => upload.category === category);
  }

  async updateFileUploadStatus(id: number, status: string): Promise<FileUpload | undefined> {
    const fileUpload = this.fileUploads.get(id);
    if (!fileUpload) {
      return undefined;
    }

    const updatedFileUpload: FileUpload = {
      ...fileUpload,
      status,
      updatedAt: new Date()
    };

    this.fileUploads.set(id, updatedFileUpload);
    return updatedFileUpload;
  }

  async deleteFileUpload(id: number): Promise<boolean> {
    return this.fileUploads.delete(id);
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async countUsers(): Promise<number> {
    return this.users.size;
  }

  async countActiveUsers(): Promise<number> {
    return Array.from(this.users.values()).filter(user => user.isActive).length;
  }

  async countUsersBySubscriptionTier(tier: string): Promise<number> {
    return Array.from(this.users.values()).filter(user => user.subscriptionTier === tier).length;
  }

  async getRecentUsers(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    user.isActive = isActive;
    this.users.set(id, user);
    return user;
  }

  async upgradeUserSubscription(id: number, tier: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    user.subscriptionTier = tier;
    this.users.set(id, user);
    return user;
  }

  async updateUserSubscription(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersNearExpiry(): Promise<User[]> {
    const now = new Date();
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    
    return Array.from(this.users.values()).filter(user => 
      user.subscriptionTier === "premium" &&
      user.premiumEndDate &&
      user.premiumEndDate <= tenDaysFromNow &&
      user.premiumEndDate > now
    );
  }

  async getUserMenuItemImageCount(userId: number): Promise<number> {
    try {
      const restaurants = await this.getRestaurantsByUserId(userId);
      let totalImages = 0;
      
      for (const restaurant of restaurants) {
        const menuItems = await this.getMenuItemsByRestaurantId(restaurant.id);
        totalImages += menuItems.filter(item => item.imageUrl && item.imageUrl.trim() !== '').length;
      }
      
      return totalImages;
    } catch (error) {
      console.error('Error counting user menu item images:', error);
      return 0;
    }
  }

  async updateUserPremiumStatus(userId: number, subscriptionData: { 
    subscriptionTier: string; 
    premiumStartDate?: Date | null; 
    premiumEndDate?: Date | null;
    premiumDuration?: string | null;
    notificationSent?: boolean;
  }): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...subscriptionData
    };

    this.users.set(userId, updatedUser);
    console.log(`Updated user ${userId} subscription:`, subscriptionData);
    return updatedUser;
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  // Admin log operations
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const id = this.currentIds.adminLogs++;
    const createdAt = new Date();
    const adminLog: AdminLog = {
      ...log,
      id,
      createdAt,
    };
    this.adminLogs.set(id, adminLog);
    return adminLog;
  }

  async getAdminLogs(limit?: number): Promise<AdminLog[]> {
    const logs = Array.from(this.adminLogs.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

    return limit ? logs.slice(0, limit) : logs;
  }

  async getAdminLogsByAdminId(adminId: number, limit?: number): Promise<AdminLog[]> {
    const logs = Array.from(this.adminLogs.values())
      .filter(log => log.adminId === adminId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

    return limit ? logs.slice(0, limit) : logs;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async getFeedbacksByRestaurantId(restaurantId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.restaurantId === restaurantId);
  }

  async getFeedbacksByMenuItemId(menuItemId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.menuItemId === menuItemId);
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentIds.feedbacks++;
    const createdAt = new Date();
    const newFeedback: Feedback = {
      ...feedback,
      id,
      createdAt,
      status: feedback.status || 'pending',
      menuItemId: feedback.menuItemId || null,
      comment: feedback.comment || null,
      customerName: feedback.customerName || null,
      customerEmail: feedback.customerEmail || null
    };
    this.feedbacks.set(id, newFeedback);
    return newFeedback;
  }

  async updateFeedback(id: number, update: Partial<Feedback>): Promise<Feedback | undefined> {
    const feedback = this.feedbacks.get(id);
    if (!feedback) return undefined;

    const updatedFeedback = { ...feedback, ...update };
    this.feedbacks.set(id, updatedFeedback);
    return updatedFeedback;
  }

  async approveFeedback(id: number): Promise<Feedback | undefined> {
    const feedback = this.feedbacks.get(id);
    if (!feedback) return undefined;

    feedback.status = 'approved';
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  async rejectFeedback(id: number): Promise<Feedback | undefined> {
    const feedback = this.feedbacks.get(id);
    if (!feedback) return undefined;

    feedback.status = 'rejected';
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  // Subscription operations
  async getAllSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }

  // Pricing plan operations
  private initializeDefaultPricingPlans() {
    // Only add default plans if none exist yet
    if (this.pricingPlans.size === 0) {
      // Free plan
      const freePlan: PricingPlan = {
        id: 1,
        name: "Free",
        description: "Basic features for small restaurants",
        price: 0,
        currency: "USD",
        features: ["1 restaurant", "1 menu", "AdSense integration", "QR code generation"],
        tier: "free",
        billingPeriod: "monthly",
        isPopular: false,
        isActive: true
      };

      // Premium plan
      const premiumPlan: PricingPlan = {
        id: 2,
        name: "Premium",
        description: "Advanced features for growing businesses",
        price: 19.99,
        currency: "USD",
        features: ["Up to 3 restaurants", "Multiple menus per restaurant", "No ads", "Customer feedback", "Analytics dashboard"],
        tier: "premium",
        billingPeriod: "monthly",
        isPopular: true,
        isActive: true
      };

      this.pricingPlans.set(1, freePlan);
      this.pricingPlans.set(2, premiumPlan);
      this.currentIds.pricingPlans = 3; // Next ID will be 3

      console.log('Initialized default pricing plans');
    }
  }

  async getAllPricingPlans(): Promise<PricingPlan[]> {
    return Array.from(this.pricingPlans.values());
  }

  async getPricingPlan(id: number): Promise<PricingPlan | undefined> {
    return this.pricingPlans.get(id);
  }

  async createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan> {
    const id = this.currentIds.pricingPlans++;
    const newPlan: PricingPlan = { ...plan, id };
    this.pricingPlans.set(id, newPlan);
    return newPlan;
  }

  async updatePricingPlan(id: number, plan: Partial<PricingPlan>): Promise<PricingPlan | undefined> {
    const existingPlan = this.pricingPlans.get(id);
    if (!existingPlan) return undefined;

    const updatedPlan = { ...existingPlan, ...plan };
    this.pricingPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deletePricingPlan(id: number): Promise<boolean> {
    return this.pricingPlans.delete(id);
  }

  // Contact info operations
  async getContactInfo(): Promise<ContactInfo | undefined> {
    return this.contactInfo;
  }

  async updateContactInfo(info: Partial<ContactInfo>): Promise<ContactInfo> {
    this.contactInfo = { ...this.contactInfo, ...info };
    return this.contactInfo;
  }

  // Stripe methods (stubs)
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    user.stripeCustomerId = customerId;
    this.users.set(userId, user);
    return user;
  }

  async updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    user.stripeSubscriptionId = subscriptionId;
    this.users.set(userId, user);
    return user;
  }

  async updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    user.stripeCustomerId = info.customerId;
    user.stripeSubscriptionId = info.subscriptionId;
    this.users.set(userId, user);
    return user;
  }

  // Ad settings operations
  async getAdSettings(): Promise<AdSettings | undefined> {
    return this.adSettings;
  }

  async updateAdSettings(settings: Partial<InsertAdSettings>): Promise<AdSettings> {
    if (this.adSettings) {
      this.adSettings = {
        ...this.adSettings,
        ...settings,
        updatedAt: new Date()
      };
    } else {
      this.adSettings = {
        id: 1,
        position: settings.position || "bottom",
        isEnabled: settings.isEnabled !== undefined ? settings.isEnabled : true,
        description: settings.description || "Where the advertisement will be displayed on the menu.",
        displayFrequency: settings.displayFrequency || 1,
        maxAdsPerPage: settings.maxAdsPerPage || 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return this.adSettings;
  }

  // Analytics operations for menu item clicks
  async incrementMenuItemClicks(itemId: number): Promise<void> {
    const item = this.menuItems.get(itemId);
    if (item) {
      // Initialize clickCount if it doesn't exist
      if (item.clickCount === null || item.clickCount === undefined) {
        item.clickCount = 0;
      }
      item.clickCount = (item.clickCount || 0) + 1;
      this.menuItems.set(itemId, item);
    }
  }

  async getMenuItemAnalytics(restaurantId: number): Promise<Array<{itemId: number, itemName: string, clickCount: number}>> {
    const results: Array<{itemId: number, itemName: string, clickCount: number}> = [];
    
    for (const item of this.menuItems.values()) {
      // Check if this item belongs to the restaurant
      const category = this.menuCategories.get(item.categoryId);
      if (category && category.restaurantId === restaurantId) {
        results.push({
          itemId: item.id,
          itemName: item.name,
          clickCount: item.clickCount || 0
        });
      }
    }
    
    // Sort by click count in descending order
    return results.sort((a, b) => b.clickCount - a.clickCount);
  }
}

export class DatabaseStorage implements IStorage {
  // Registration analytics operations
  async createRegistrationAnalytics(analytics: InsertRegistrationAnalytics): Promise<RegistrationAnalytics> {
    const [result] = await db
      .insert(registrationAnalytics)
      .values(analytics)
      .returning();
    return result;
  }

  async getRegistrationAnalyticsByUserId(userId: number): Promise<RegistrationAnalytics | undefined> {
    const [result] = await db
      .select()
      .from(registrationAnalytics)
      .where(eq(registrationAnalytics.userId, userId));
    return result;
  }

  async countRegistrationsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(registrationAnalytics)
      .where(
        and(
          gte(registrationAnalytics.registeredAt, startDate),
          lte(registrationAnalytics.registeredAt, endDate)
        )
      );
    return result[0]?.count || 0;
  }

  async countRegistrationsBySource(source: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(registrationAnalytics)
      .where(eq(registrationAnalytics.source, source));
    return result[0]?.count || 0;
  }

  // Pricing plan operations
  async getAllPricingPlans(): Promise<PricingPlan[]> {
    return await db.select().from(pricingPlans);
  }

  async getPricingPlan(id: number): Promise<PricingPlan | undefined> {
    const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, id));
    return plan;
  }

  async createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan> {
    const [newPlan] = await db.insert(pricingPlans).values(plan).returning();
    return newPlan;
  }

  async updatePricingPlan(id: number, plan: Partial<PricingPlan>): Promise<PricingPlan | undefined> {
    const [updatedPlan] = await db
      .update(pricingPlans)
      .set(plan)
      .where(eq(pricingPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deletePricingPlan(id: number): Promise<boolean> {
    const [deletedPlan] = await db
      .delete(pricingPlans)
      .where(eq(pricingPlans.id, id))
      .returning();
    return !!deletedPlan;
  }

  // Advertisement operations
  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db.select()
      .from(advertisements)
      .where(eq(advertisements.id, id));
    return ad;
  }

  async getAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements);
  }

  async getActiveAdvertisementByPosition(position: string): Promise<Advertisement | undefined> {
    const now = new Date();
    const [ad] = await db.select()
      .from(advertisements)
      .where(
        and(
          eq(advertisements.position, position),
          eq(advertisements.isActive, true),
          or(
            isNull(advertisements.startDate),
            lte(advertisements.startDate, now)
          ),
          or(
            isNull(advertisements.endDate),
            gte(advertisements.endDate, now)
          )
        )
      )
      .limit(1);
    return ad;
  }

  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [newAd] = await db.insert(advertisements)
      .values({
        ...ad,
        createdAt: new Date()
        // Removed updatedAt as it's not in the schema
      })
      .returning();
    return newAd;
  }

  async updateAdvertisement(id: number, ad: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const [updatedAd] = await db.update(advertisements)
      .set({
        ...ad
        // Removed updatedAt as it's not in the schema
      })
      .where(eq(advertisements.id, id))
      .returning();
    return updatedAd;
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    const [deletedAd] = await db.delete(advertisements)
      .where(eq(advertisements.id, id))
      .returning();
    return !!deletedAd;
  }

  // File upload operations
  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const [newUpload] = await db.insert(fileUploads)
      .values({
        ...fileUpload,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newUpload;
  }

  async getFileUpload(id: number): Promise<FileUpload | undefined> {
    const [upload] = await db.select()
      .from(fileUploads)
      .where(eq(fileUploads.id, id));
    return upload;
  }

  async getFileUploadByStoredFilename(storedFilename: string): Promise<FileUpload | undefined> {
    const [upload] = await db.select()
      .from(fileUploads)
      .where(eq(fileUploads.storedFilename, storedFilename));
    return upload;
  }

  async getFileUploadsByUserId(userId: number): Promise<FileUpload[]> {
    return await db.select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId))
      .orderBy(desc(fileUploads.createdAt));
  }

  async getFileUploadsByRestaurantId(restaurantId: number): Promise<FileUpload[]> {
    return await db.select()
      .from(fileUploads)
      .where(eq(fileUploads.restaurantId, restaurantId))
      .orderBy(desc(fileUploads.createdAt));
  }

  async getFileUploadsByCategory(category: string): Promise<FileUpload[]> {
    return await db.select()
      .from(fileUploads)
      .where(eq(fileUploads.category, category))
      .orderBy(desc(fileUploads.createdAt));
  }

  async updateFileUploadStatus(id: number, status: string): Promise<FileUpload | undefined> {
    const [updatedUpload] = await db.update(fileUploads)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(fileUploads.id, id))
      .returning();
    return updatedUpload;
  }

  async deleteFileUpload(id: number): Promise<boolean> {
    const [deletedUpload] = await db.delete(fileUploads)
      .where(eq(fileUploads.id, id))
      .returning();
    return !!deletedUpload;
  }

  // Contact info operations
  async getContactInfo(): Promise<ContactInfo | undefined> {
    const [info] = await db.select().from(contactInfo).limit(1);
    return info;
  }

  async updateContactInfo(info: Partial<ContactInfo>): Promise<ContactInfo> {
    // First check if we have any contact info already
    const existingInfo = await this.getContactInfo();

    if (existingInfo) {
      // Update existing record
      const [updatedInfo] = await db
        .update(contactInfo)
        .set({...info, updatedAt: new Date()})
        .where(eq(contactInfo.id, existingInfo.id))
        .returning();
      return updatedInfo;
    } else {
      // Create new record
      const [newInfo] = await db
        .insert(contactInfo)
        .values({
          address: info.address || 'Ethiopia, Addis Abeba',
          email: info.email || 'menumate.spp@gmail.com',
          phone: info.phone || '+251-913-690-687'
        })
        .returning();
      return newInfo;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetPasswordToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async setResetPasswordToken(email: string, token: string, expires: Date): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires
      })
      .where(eq(users.email, email))
      .returning();
    return updatedUser;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByResetToken(token);
    if (!user || !user.resetPasswordExpires) return false;

    // Check if token is expired
    const now = new Date();
    if (now > user.resetPasswordExpires) return false;

    // Update password and clear token
    const [updatedUser] = await db.update(users)
      .set({
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .where(eq(users.id, user.id))
      .returning();

    return !!updatedUser;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Compare passwords happens at the route level

    const [updatedUser] = await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId))
      .returning();

    return !!updatedUser;
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // In the DatabaseStorage implementation, we'll assume password comparison
    // is done by the comparePasswords function in routes.ts, same as MemStorage
    return true;
  }

  async updateUserWithPassword(id: number, userData: { username: string, email: string, password: string }): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }

    const [updatedUser] = await db.update(users)
      .set({
        username: userData.username,
        email: userData.email,
        password: userData.password
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }

  async updateUserPremiumStatus(userId: number, subscriptionData: { 
    subscriptionTier: string; 
    premiumStartDate?: Date | null; 
    premiumEndDate?: Date | null;
    premiumDuration?: string | null;
    notificationSent?: boolean;
  }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [updatedUser] = await db.update(users)
      .set({
        subscriptionTier: subscriptionData.subscriptionTier,
        premiumStartDate: subscriptionData.premiumStartDate,
        premiumEndDate: subscriptionData.premiumEndDate,
        premiumDuration: subscriptionData.premiumDuration,
        notificationSent: subscriptionData.notificationSent ?? false
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to update user subscription');
    }

    console.log(`DatabaseStorage: Updated user ${userId} subscription:`, subscriptionData);
    return updatedUser;
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    try {
      // First try with the standard ORM approach
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
      return restaurant;
    } catch (error) {
      console.error(`Error in ORM restaurant fetch for ID ${id}, attempting raw query fallback:`, error);

      // Fallback: use a raw SQL query that doesn't depend on the full schema
      // This helps when there are schema version mismatches between code and database
      const { pool } = await import('./db');
      const result = await pool.query(
        'SELECT id, user_id, name, description, cuisine, logo_url, banner_url, ' +
        'phone, email, address, hours_of_operation, tags ' +
        'FROM restaurants WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      // Map the raw results to match our schema
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        cuisine: row.cuisine,
        logoUrl: row.logo_url,
        bannerUrl: row.banner_url,
        bannerUrls: Array.isArray(row.banner_urls) ? row.banner_urls : 
                  (row.banner_url ? [row.banner_url] : []),
        phone: row.phone,
        email: row.email,
        address: row.address,
        hoursOfOperation: row.hours_of_operation,
        tags: row.tags || [],
        themeSettings: row.theme_settings || {}
      };
    }
  }

  async getRestaurantsByUserId(userId: number): Promise<Restaurant[]> {
    try {
      // Use raw query to avoid schema mismatch issues
      const { pool } = await import('./db');
      const result = await pool.query(
        'SELECT id, user_id, name, description, cuisine, logo_url, banner_url, banner_urls, phone, email, address, hours_of_operation, tags, theme_settings, qr_code_scans FROM restaurants WHERE user_id = $1',
        [userId]
      );
      
      // Map the raw results to match our schema
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        cuisine: row.cuisine,
        logoUrl: row.logo_url,
        bannerUrl: row.banner_url,
        bannerUrls: Array.isArray(row.banner_urls) ? row.banner_urls : 
                  (row.banner_url ? [row.banner_url] : []),
        phone: row.phone,
        email: row.email,
        address: row.address,
        hoursOfOperation: row.hours_of_operation,
        tags: row.tags || [],
        themeSettings: row.theme_settings || {},
        qrCodeScans: row.qr_code_scans || 0
      }));
    } catch (error) {

      // Fallback: use a raw SQL query that doesn't depend on the full schema
      // This helps when there are schema version mismatches between code and database
      const { pool } = await import('./db');
      const result = await pool.query(
        'SELECT * FROM restaurants WHERE user_id = $1',
        [userId]
      );

      // Map the raw results to match our schema
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        cuisine: row.cuisine,
        logoUrl: row.logo_url,
        bannerUrl: row.banner_url,
        bannerUrls: Array.isArray(row.banner_urls) ? row.banner_urls : 
                  (row.banner_url ? [row.banner_url] : []),
        phone: row.phone,
        email: row.email,
        address: row.address,
        hoursOfOperation: row.hours_of_operation,
        tags: row.tags || [],
        themeSettings: row.theme_settings || {}
      }));
    }
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const [restaurant] = await db.insert(restaurants).values(insertRestaurant).returning();
    return restaurant;
  }

  async incrementQRCodeScans(id: number): Promise<Restaurant | undefined> {
    try {
      console.log('Incrementing QR code scans for restaurant:', id);
      
      // Get current restaurant first to verify it exists
      const restaurant = await this.getRestaurant(id);
      if (!restaurant) {
        console.error('Restaurant not found:', id);
        return undefined;
      }

      // Use direct SQL to atomically increment the counter
      const { pool } = await import('./db');
      const result = await pool.query(
        'UPDATE restaurants SET qr_code_scans = COALESCE(qr_code_scans, 0) + 1 WHERE id = $1',
        [id]
      );

      // Return updated restaurant data
      return await this.getRestaurant(id);
    } catch (error) {
      console.error('Error incrementing QR code scans:', error);
      throw error;
    }
  }

  async updateRestaurant(id: number, restaurantUpdate: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    try {
      // First try with the standard ORM approach
      const [updatedRestaurant] = await db.update(restaurants)
        .set(restaurantUpdate)
        .where(eq(restaurants.id, id))
        .returning();
      return updatedRestaurant;
    } catch (error) {
      console.error(`Error in ORM restaurant update for ID ${id}, attempting raw query fallback:`, error);

      // Get the current restaurant to merge with updates
      const currentRestaurant = await this.getRestaurant(id);
      if (!currentRestaurant) {
        return undefined;
      }

      // Prepare update fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      // For each property in restaurantUpdate, add to the update fields
      if (restaurantUpdate.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.name);
      }

      if (restaurantUpdate.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.description);
      }

      if (restaurantUpdate.cuisine !== undefined) {
        updateFields.push(`cuisine = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.cuisine);
      }

      if (restaurantUpdate.logoUrl !== undefined) {
        updateFields.push(`logo_url = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.logoUrl);
      }

      if (restaurantUpdate.bannerUrl !== undefined) {
        updateFields.push(`banner_url = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.bannerUrl);
      }

      if (restaurantUpdate.phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.phone);
      }

      if (restaurantUpdate.email !== undefined) {
        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.email);
      }

      if (restaurantUpdate.address !== undefined) {
        updateFields.push(`address = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.address);
      }

      if (restaurantUpdate.hoursOfOperation !== undefined) {
        updateFields.push(`hours_of_operation = $${paramIndex++}`);
        updateValues.push(restaurantUpdate.hoursOfOperation);
      }

      if (restaurantUpdate.themeSettings !== undefined) {
        updateFields.push(`theme_settings = $${paramIndex++}::jsonb`);
        updateValues.push(JSON.stringify(restaurantUpdate.themeSettings));
        console.log('Updating theme settings:', JSON.stringify(restaurantUpdate.themeSettings, null, 2));
      }

      if (restaurantUpdate.bannerUrls !== undefined) {
        updateFields.push(`banner_urls = $${paramIndex++}`);
        updateValues.push(JSON.stringify(restaurantUpdate.bannerUrls));
      }

      // Only if we have fields to update
      if (updateFields.length > 0) {
        // Fallback: use a raw SQL query
        const { pool } = await import('./db');
        const result = await pool.query(
          `UPDATE restaurants SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          [...updateValues, id]
        );

        if (result.rows.length === 0) {
          return undefined;
        }

        // Map the raw results to match our schema
        const row = result.rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          cuisine: row.cuisine,
          logoUrl: row.logo_url,
          bannerUrl: row.banner_url,
          bannerUrls: restaurantUpdate.bannerUrls || currentRestaurant.bannerUrls,
          phone: row.phone,
          email: row.email,
          address: row.address,
          hoursOfOperation: row.hours_of_operation,
          tags: row.tags || [],
          themeSettings: restaurantUpdate.themeSettings || currentRestaurant.themeSettings
        };
      }

      // If no fields to update, return the current restaurant
      return currentRestaurant;
    }
  }

  // Menu category operations
  async getMenuCategory(id: number): Promise<MenuCategory | undefined> {
    const [category] = await db.select().from(menuCategories).where(eq(menuCategories.id, id));
    return category;
  }

  async getMenuCategoriesByRestaurantId(restaurantId: number): Promise<MenuCategory[]> {
    return await db.select()
      .from(menuCategories)
      .where(eq(menuCategories.restaurantId, restaurantId))
      .orderBy(menuCategories.displayOrder);
  }

  async createMenuCategory(insertCategory: InsertMenuCategory): Promise<MenuCategory> {
    const [category] = await db.insert(menuCategories).values(insertCategory).returning();
    return category;
  }

  async updateMenuCategory(id: number, categoryUpdate: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined> {
    const [updatedCategory] = await db.update(menuCategories)
      .set(categoryUpdate)
      .where(eq(menuCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteMenuCategory(id: number): Promise<boolean> {
    // First delete all menu items in this category
    await db.delete(menuItems).where(eq(menuItems.categoryId, id));

    // Then delete the category
    const result = await db.delete(menuCategories).where(eq(menuCategories.id, id)).returning();
    return result.length > 0;
  }

  // Menu item operations
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]> {
    try {
      // Use a raw query to avoid schema mismatch issues
      const { pool } = await import('./db');
      const result = await pool.query(
        'SELECT id, category_id, name, description, price, currency, image_url, tags, is_available, display_order, dietary_info, calories, allergens FROM menu_items WHERE category_id = $1 ORDER BY COALESCE(display_order, 0)',
        [categoryId]
      );
      
      // Map the raw results to match our schema
      return result.rows.map(row => ({
        id: row.id,
        categoryId: row.category_id,
        name: row.name,
        description: row.description,
        price: row.price,
        currency: row.currency,
        imageUrl: row.image_url,
        tags: row.tags || [],
        isAvailable: row.is_available,
        displayOrder: row.display_order || 0,
        dietaryInfo: row.dietary_info,
        calories: row.calories,
        allergens: row.allergens || [],
        clickCount: 0
      }));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  async getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    // First get all categories for this restaurant
    const categories = await this.getMenuCategoriesByRestaurantId(restaurantId);

    if (categories.length === 0) {
      return [];
    }

    // Get all menu items for these categories
    const items: MenuItem[] = [];
    for (const category of categories) {
      const categoryItems = await this.getMenuItemsByCategoryId(category.id);
      items.push(...categoryItems);
    }

    return items;
  }

  async createMenuItem(insertItem: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db.insert(menuItems).values(insertItem).returning();
    return item;
  }

  async updateMenuItem(id: number, itemUpdate: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    try {
      const [updatedItem] = await db.update(menuItems)
        .set(itemUpdate)
        .where(eq(menuItems.id, id))
        .returning();
      return updatedItem;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error; // Let the error propagate to be handled by the route handler
    }
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
    return result.length > 0;
  }

  // Menu view operations
  async getMenuViewsByRestaurantId(restaurantId: number): Promise<MenuView[]> {
    return await db.select()
      .from(menuViews)
      .where(eq(menuViews.restaurantId, restaurantId))
      .orderBy(desc(menuViews.viewedAt));
  }

  async countMenuViewsByRestaurantId(restaurantId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(menuViews)
      .where(eq(menuViews.restaurantId, restaurantId));
    return result.count;
  }

  async countMenuViewsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    try {
      const [result] = await db.select({ count: count() })
        .from(menuViews)
        .where(
          and(
            gte(menuViews.viewedAt, startDate),
            lte(menuViews.viewedAt, endDate)
          )
        );
      return result.count || 0;
    } catch (error) {
      console.error('Error counting menu views in date range:', error);
      return 0;
    }
  }

  async countTotalMenuViews(): Promise<number> {
    try {
      const [result] = await db.select({ count: count() })
        .from(menuViews);
      return result.count || 0;
    } catch (error) {
      console.error('Error counting total menu views:', error);
      return 0;
    }
  }

  async createMenuView(insertView: InsertMenuView): Promise<MenuView> {
    const [view] = await db.insert(menuViews).values(insertView).returning();
    return view;
  }

  // Stats operations
  async getMenuItemCountByRestaurantId(restaurantId: number): Promise<number> {
    // Get all categories for this restaurant
    const categories = await this.getMenuCategoriesByRestaurantId(restaurantId);

    if (categories.length === 0) {
      return 0;
    }

    // Count all menu items across all categories
    let total = 0;
    for (const category of categories) {
      const [result] = await db.select({ count: count() })
        .from(menuItems)
        .where(eq(menuItems.categoryId, category.id));
      total += result.count;
    }

    return total;
  }

  async getQrScanCountByRestaurantId(restaurantId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(menuViews)
      .where(and(
        eq(menuViews.restaurantId, restaurantId),
        eq(menuViews.source, 'qr')
      ));
    return result.count;
  }

  // Count restaurants by user ID
  async countRestaurantsByUserId(userId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(restaurants)
      .where(eq(restaurants.userId, userId));
    return result.count;
  }

  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getActiveSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.isActive, true)
      ));
    return subscription;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(id: number, subscriptionUpdate: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db.update(subscriptions)
      .set(subscriptionUpdate)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return await db.select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsBySubscriptionId(subscriptionId: number): Promise<Payment[]> {
    return await db.select()
      .from(payments)
      .where(eq(payments.subscriptionId, subscriptionId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: number, paymentUpdate: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db.update(payments)
      .set(paymentUpdate)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Admin methods
  async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      // First try with the standard ORM approach
      return await db.select().from(restaurants);
    } catch (error) {
      console.error("Error in getAllRestaurants ORM fetch, attempting raw query fallback:", error);

      // Fallback: use a raw SQL query that doesn't depend on the full schema
      const { pool } = await import('./db');
      const result = await pool.query(
        'SELECT id, user_id, name, description, cuisine, logo_url, banner_url, ' +
        'phone, email, address, hours_of_operation, tags ' +
        'FROM restaurants ORDER BY id'
      );

      // Map the raw results to match our schema
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        cuisine: row.cuisine,
        logoUrl: row.logo_url,
        bannerUrl: row.banner_url,
        bannerUrls: Array.isArray(row.banner_urls) ? row.banner_urls : 
                  (row.banner_url ? [row.banner_url] : []),
        phone: row.phone,
        email: row.email,
        address: row.address,
        hoursOfOperation: row.hours_of_operation,
        tags: row.tags || [],
        themeSettings: row.theme_settings || {}
      }));
    }
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return db.select().from(subscriptions);
  }

  async getFeedback(id: number): Promise<Feedback | undefined> {
    const [feedback] = await db.select().from(feedbacks).where(eq(feedbacks.id, id));
    return feedback;
  }

  async getFeedbacksByRestaurantId(restaurantId: number): Promise<Feedback[]> {
    return db.select().from(feedbacks).where(eq(feedbacks.restaurantId, restaurantId));
  }

  async getFeedbacksByMenuItemId(menuItemId: number): Promise<Feedback[]> {
    return db.select().from(feedbacks).where(eq(feedbacks.menuItemId, menuItemId));
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedbacks).values(feedback).returning();
    return newFeedback;
  }

  async updateFeedback(id: number, feedbackUpdate: Partial<Feedback>): Promise<Feedback | undefined> {
    const [updatedFeedback] = await db
      .update(feedbacks)
      .set(feedbackUpdate)
      .where(eq(feedbacks.id, id))
      .returning();
    return updatedFeedback;
  }

  async approveFeedback(id: number): Promise<Feedback | undefined> {
    return this.updateFeedback(id, { status: 'approved' });
  }

  async rejectFeedback(id: number): Promise<Feedback | undefined> {
    return this.updateFeedback(id, { status: 'rejected' });
  }

  // Dietary preferences operations
  async getDietaryPreference(id: number): Promise<DietaryPreference | undefined> {
    const [preference] = await db.select()
      .from(dietaryPreferences)
      .where(eq(dietaryPreferences.id, id));
    return preference;
  }

  async getDietaryPreferenceByUserId(userId: number): Promise<DietaryPreference | undefined> {
    const [preference] = await db.select()
      .from(dietaryPreferences)
      .where(eq(dietaryPreferences.userId, userId));
    return preference;
  }

  async getDietaryPreferenceBySessionId(sessionId: string): Promise<DietaryPreference | undefined> {
    const [preference] = await db.select()
      .from(dietaryPreferences)
      .where(eq(dietaryPreferences.sessionId, sessionId));
    return preference;
  }

  async createDietaryPreference(insertPreference: InsertDietaryPreference): Promise<DietaryPreference> {
    const [preference] = await db.insert(dietaryPreferences)
      .values(insertPreference)
      .returning();
    return preference;
  }

  async updateDietaryPreference(id: number, preferenceUpdate: Partial<InsertDietaryPreference>): Promise<DietaryPreference | undefined> {
    const now = new Date();
    const [updatedPreference] = await db.update(dietaryPreferences)
      .set({
        ...preferenceUpdate,
        updatedAt: now
      })
      .where(eq(dietaryPreferences.id, id))
      .returning();
    return updatedPreference;
  }

  async deleteDietaryPreference(id: number): Promise<boolean> {
    const result = await db.delete(dietaryPreferences)
      .where(eq(dietaryPreferences.id, id))
      .returning();
    return result.length > 0;
  }

  // Menu item analytics operations
  async incrementMenuItemClicks(itemId: number): Promise<void> {
    await db.update(menuItems)
      .set({ 
        clickCount: db.$count(menuItems.clickCount) + 1 
      })
      .where(eq(menuItems.id, itemId));
  }

  async getMenuItemAnalytics(restaurantId: number): Promise<Array<{id: number, name: string, clickCount: number, categoryName: string}>> {
    const result = await db.select({
      id: menuItems.id,
      name: menuItems.name,
      clickCount: menuItems.clickCount,
      categoryName: menuCategories.name
    })
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .where(eq(menuCategories.restaurantId, restaurantId))
    .orderBy(desc(menuItems.clickCount));
    
    return result.map(item => ({
      id: item.id,
      name: item.name,
      clickCount: item.clickCount || 0,
      categoryName: item.categoryName
    }));
  }

  // Admin user operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async countUsers(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }

  async countActiveUsers(): Promise<number> {
    const result = await db.select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));
    return result[0].count;
  }

  async countUsersBySubscriptionTier(tier: string): Promise<number> {
    const result = await db.select({ count: count() })
      .from(users)
      .where(eq(users.subscriptionTier, tier));
    return result[0].count;
  }

  async getRecentUsers(limit: number): Promise<User[]> {
    return await db.select().from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ isActive })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upgradeUserSubscription(id: number, tier: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ subscriptionTier: tier })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Admin logs operations
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [adminLog] = await db.insert(adminLogs)
      .values(log)
      .returning();
    return adminLog;
  }

  async getAdminLogs(limit: number = 50): Promise<AdminLog[]> {
    return await db.select().from(adminLogs)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);
  }

  async getAdminLogsByAdminId(adminId: number, limit: number = 50): Promise<AdminLog[]> {
    return await db.select().from(adminLogs)
      .where(eq(adminLogs.adminId, adminId))
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);
  }

  // Menu examples operations
  async getMenuExamples(): Promise<MenuExample[]> {
    return await db.select().from(menuExamples)
      .orderBy(desc(menuExamples.displayOrder));
  }

  async getActiveMenuExamples(): Promise<MenuExample[]> {
    return await db.select().from(menuExamples)
      .where(eq(menuExamples.isActive, true))
      .orderBy(desc(menuExamples.displayOrder));
  }

  async getMenuExample(id: number): Promise<MenuExample | undefined> {
    const [example] = await db.select().from(menuExamples)
      .where(eq(menuExamples.id, id));
    return example;
  }

  async createMenuExample(example: InsertMenuExample): Promise<MenuExample> {
    const [created] = await db.insert(menuExamples)
      .values(example)
      .returning();
    return created;
  }

  async updateMenuExample(id: number, example: Partial<MenuExample>): Promise<MenuExample | undefined> {
    const [updated] = await db.update(menuExamples)
      .set(example)
      .where(eq(menuExamples.id, id))
      .returning();
    return updated;
  }

  async deleteMenuExample(id: number): Promise<boolean> {
    const result = await db.delete(menuExamples)
      .where(eq(menuExamples.id, id))
      .returning();
    return result.length > 0;
  }

  // Testimonials operations
  async getTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials)
      .orderBy(desc(testimonials.displayOrder));
  }

  async getActiveTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(desc(testimonials.displayOrder));
  }

  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    const [testimonial] = await db.select().from(testimonials)
      .where(eq(testimonials.id, id));
    return testimonial;
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [created] = await db.insert(testimonials)
      .values(testimonial)
      .returning();
    return created;
  }

  async updateTestimonial(id: number, testimonial: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const [updated] = await db.update(testimonials)
      .set(testimonial)
      .where(eq(testimonials.id, id))
      .returning();
    return updated;
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    const result = await db.delete(testimonials)
      .where(eq(testimonials.id, id))
      .returning();
    return result.length > 0;
  }

  async getUserMenuItemImageCount(userId: number): Promise<number> {
    try {
      const restaurants = await this.getRestaurantsByUserId(userId);
      let totalImages = 0;
      
      for (const restaurant of restaurants) {
        const menuItems = await this.getMenuItemsByRestaurantId(restaurant.id);
        totalImages += menuItems.filter(item => item.imageUrl && item.imageUrl.trim() !== '').length;
      }
      
      return totalImages;
    } catch (error) {
      console.error('Error counting user menu item images:', error);
      return 0;
    }
  }
}

// Use the database storage instead of memory storage
export const storage = new DatabaseStorage();