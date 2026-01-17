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
  testimonials, Testimonial, InsertTestimonial,
  permanentImages, PermanentImage, InsertPermanentImage,
  waiterCalls, WaiterCall, InsertWaiterCall,
  agents, Agent, InsertAgent,
  tokenRequests, TokenRequest, InsertTokenRequest,
  tokenTransactions, TokenTransaction, InsertTokenTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, desc, or, isNull, isNotNull, lte, gte } from "drizzle-orm";
import { phoneNumbersMatch, getPhoneNumberVariations } from "../shared/phone-utils";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
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
  updateUserSubscription(id: number, subscription: { subscriptionTier: string; subscriptionEndDate: string | null }): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined>;

  // Admin operations
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(limit?: number): Promise<AdminLog[]>;
  getAllLogs(): Promise<AdminLog[]>;
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
  getAllRestaurantsWithOwners(): Promise<any[]>;
  updateRestaurantActiveStatus(id: number, isActive: boolean): Promise<Restaurant | undefined>;
  manageRestaurantsBySubscription(userId: number, maxRestaurants: number): Promise<void>;

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
  incrementQRCodeScans(restaurantId: number): Promise<void>;
  getRestaurantStats(restaurantId: number): Promise<{
    viewCount: number;
    qrScanCount: number;
    directQrScans: number;
    menuItemCount: number;
    daysActive: number;
  }>;
  
  // Feedback operations
  getFeedbacksByRestaurantId(restaurantId: number): Promise<Feedback[]>;

  // Analytics operations for admin dashboard
  getViewsAnalytics(): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    total: number;
  }>;
  getRegistrationAnalytics(): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  }>;
  
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
  getPaymentByReference(reference: string): Promise<Payment | undefined>;
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
  getAllAdvertisements(): Promise<Advertisement[]>;
  getAdvertisements(): Promise<Advertisement[]>;
  getActiveAdvertisementByPosition(position: string): Promise<Advertisement | undefined>;
  getTargetedAdvertisement(position: string, restaurant: Restaurant | null): Promise<Advertisement | undefined>;
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
  deleteFileUpload(id: number): Promise<boolean>;
  getUserImageCount(userId: number): Promise<number>;

  // Permanent image operations
  savePermanentImage(image: InsertPermanentImage): Promise<PermanentImage>;
  getPermanentImage(filename: string): Promise<PermanentImage | undefined>;
  getPermanentImagesByUserId(userId: number): Promise<PermanentImage[]>;
  getPermanentImagesByRestaurantId(restaurantId: number): Promise<PermanentImage[]>;
  deletePermanentImage(filename: string): Promise<boolean>;

  // Menu examples operations
  getMenuExamples(): Promise<MenuExample[]>;
  getActiveMenuExamples(): Promise<MenuExample[]>;
  getMenuExample(id: number): Promise<MenuExample | undefined>;
  createMenuExample(example: InsertMenuExample): Promise<MenuExample>;
  updateMenuExample(id: number, example: Partial<MenuExample>): Promise<MenuExample | undefined>;
  deleteMenuExample(id: number): Promise<boolean>;

  // Testimonials operations
  getTestimonials(): Promise<Testimonial[]>;
  getAllTestimonials(): Promise<Testimonial[]>;
  getActiveTestimonials(): Promise<Testimonial[]>;
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, testimonial: Partial<Testimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: number): Promise<boolean>;

  // Ad settings operations
  getAdSettings(): Promise<AdSettings | undefined>;
  updateAdSettings(settings: Partial<InsertAdSettings>): Promise<AdSettings>;

  // Waiter call operations
  createWaiterCall(call: InsertWaiterCall): Promise<WaiterCall>;
  getWaiterCallsByRestaurantId(restaurantId: number): Promise<WaiterCall[]>;
  getWaiterCall(id: number): Promise<WaiterCall | undefined>;
  updateWaiterCallStatus(id: number, status: string): Promise<WaiterCall | undefined>;
  getPendingWaiterCalls(restaurantId: number): Promise<WaiterCall[]>;

  // Agent operations
  createAgent(agent: InsertAgent): Promise<Agent>;
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByUserId(userId: number): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  getPendingAgents(): Promise<Agent[]>;
  getApprovedAgents(): Promise<Agent[]>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent | undefined>;
  approveAgent(id: number, adminId: number, notes?: string): Promise<Agent | undefined>;
  rejectAgent(id: number, adminId: number, notes?: string): Promise<Agent | undefined>;

  // Restaurant approval operations
  getPendingRestaurants(): Promise<Restaurant[]>;
  approveRestaurant(id: number, adminId: number, notes?: string): Promise<Restaurant | undefined>;
  rejectRestaurant(id: number, adminId: number, notes?: string): Promise<Restaurant | undefined>;

  // Free tier limit checks
  countCategoriesByRestaurantId(restaurantId: number): Promise<number>;
  countItemsByCategoryId(categoryId: number): Promise<number>;
  countBannersByRestaurantId(restaurantId: number): Promise<number>;

  // Token management operations
  generateAgentCode(): Promise<string>;
  createTokenRequest(request: InsertTokenRequest): Promise<TokenRequest>;
  getTokenRequest(id: number): Promise<TokenRequest | undefined>;
  getTokenRequestsByAgentId(agentId: number): Promise<TokenRequest[]>;
  getPendingTokenRequests(): Promise<TokenRequest[]>;
  getAllTokenRequests(): Promise<TokenRequest[]>;
  approveTokenRequest(id: number, adminId: number, notes?: string): Promise<TokenRequest | undefined>;
  rejectTokenRequest(id: number, adminId: number, notes?: string): Promise<TokenRequest | undefined>;
  createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransaction>;
  getTokenTransactionsByAgentId(agentId: number): Promise<TokenTransaction[]>;
  addTokensToAgent(agentId: number, amount: number, adminId: number, reason: string, requestId?: number): Promise<Agent | undefined>;
  debitTokensFromAgent(agentId: number, amount: number, reason: string, restaurantId?: number): Promise<Agent | undefined>;
  getAgentStats(agentId: number): Promise<{
    tokenBalance: number;
    totalRestaurants: number;
    premiumRestaurants: number;
    pendingTokenRequests: number;
  }>;
  getRestaurantsByAgentId(agentId: number): Promise<Restaurant[]>;
}

export class DatabaseStorage implements IStorage {
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

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    console.log('getUserByIdentifier called with:', identifier);
    
    // First try direct match by username or email
    let [user] = await db.select().from(users).where(
      or(
        eq(users.username, identifier),
        eq(users.email, identifier)
      )
    );
    
    if (user) {
      console.log('Found user by username/email:', user.username);
      return user;
    }
    
    // If no direct match and identifier might be a phone number, try phone variations
    if (/^\+?[\d\s\-\(\)]+$/.test(identifier)) {
      console.log('Identifier looks like phone number, checking variations...');
      const phoneVariations = getPhoneNumberVariations(identifier);
      console.log('Phone variations to check:', phoneVariations);
      
      // Get all users with phone numbers and check for matches
      const allUsersWithPhones = await db.select().from(users).where(isNotNull(users.phone));
      console.log('Users with phone numbers:', allUsersWithPhones.map(u => ({ id: u.id, username: u.username, phone: u.phone })));
      
      for (const dbUser of allUsersWithPhones) {
        if (dbUser.phone) {
          console.log('Checking user:', dbUser.username, 'with phone:', dbUser.phone);
          for (const variation of phoneVariations) {
            console.log('Checking variation:', variation, 'against:', dbUser.phone);
            if (phoneNumbersMatch(dbUser.phone, variation)) {
              console.log('Phone number match found!');
              return dbUser;
            }
          }
        }
      }
      
      console.log('No phone number matches found');
    }
    
    return undefined;
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
    const [user] = await db.update(users).set(userUpdate).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserWithPassword(id: number, user: { username: string, email: string, password: string }): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({
        username: user.username,
        email: user.email,
        password: user.password
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    // This should be implemented with bcrypt in the route handler
    return false;
  }

  async setResetPasswordToken(email: string, token: string, expires: Date): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires
      })
      .where(eq(users.email, email))
      .returning();
    return user;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const result = await db.update(users)
      .set({
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .where(and(
        eq(users.resetPasswordToken, token),
        gte(users.resetPasswordExpires, new Date())
      ))
      .returning();
    return result.length > 0;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    // Password verification should be done in the route handler
    const result = await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

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

  async updateUserSubscription(id: number, subscription: { subscriptionTier: string; subscriptionEndDate: string | null }): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ 
        subscriptionTier: subscription.subscriptionTier,
        subscriptionExpiry: subscription.subscriptionEndDate ? new Date(subscription.subscriptionEndDate) : null
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantsByUserId(userId: number): Promise<Restaurant[]> {
    return await db.select().from(restaurants).where(eq(restaurants.userId, userId));
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [created] = await db.insert(restaurants).values(restaurant).returning();
    return created;
  }

  async updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updated] = await db.update(restaurants)
      .set(restaurant)
      .where(eq(restaurants.id, id))
      .returning();
    return updated;
  }

  async countRestaurantsByUserId(userId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(restaurants)
      .where(eq(restaurants.userId, userId));
    return result[0].count;
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants).orderBy(desc(restaurants.id));
  }

  async getAllRestaurantsWithOwners(): Promise<any[]> {
    const restaurantsWithOwners = await db.select({
      id: restaurants.id,
      name: restaurants.name,
      email: restaurants.email,
      phone: restaurants.phone,
      description: restaurants.description,
      cuisine: restaurants.cuisine,
      logoUrl: restaurants.logoUrl,
      bannerUrl: restaurants.bannerUrl,
      isActive: restaurants.isActive,
      // createdAt: restaurants.createdAt, // Field doesn't exist in schema
      ownerName: users.fullName,
      ownerUsername: users.username,
      ownerSubscriptionTier: users.subscriptionTier,
      categoryCount: count(menuCategories.id),
      itemCount: count(menuItems.id),
    })
    .from(restaurants)
    .leftJoin(users, eq(restaurants.userId, users.id))
    .leftJoin(menuCategories, eq(restaurants.id, menuCategories.restaurantId))
    .leftJoin(menuItems, eq(menuCategories.id, menuItems.categoryId))
    .groupBy(restaurants.id, users.fullName, users.username, users.subscriptionTier)
    .orderBy(desc(restaurants.id)); // Use ID instead of createdAt

    return restaurantsWithOwners;
  }

  async updateRestaurantActiveStatus(id: number, isActive: boolean): Promise<Restaurant | undefined> {
    const [restaurant] = await db.update(restaurants)
      .set({ isActive })
      .where(eq(restaurants.id, id))
      .returning();
    return restaurant;
  }

  async manageRestaurantsBySubscription(userId: number, maxRestaurants: number): Promise<void> {
    const userRestaurants = await this.getRestaurantsByUserId(userId);
    
    // Activate restaurants up to the limit, deactivate the rest
    for (let i = 0; i < userRestaurants.length; i++) {
      const isActive = i < maxRestaurants;
      await this.updateRestaurantActiveStatus(userRestaurants[i].id, isActive);
    }
  }

  // Menu operations
  async getMenuCategory(id: number): Promise<MenuCategory | undefined> {
    const [category] = await db.select().from(menuCategories).where(eq(menuCategories.id, id));
    return category;
  }

  async getMenuCategoriesByRestaurantId(restaurantId: number): Promise<MenuCategory[]> {
    return await db.select().from(menuCategories)
      .where(eq(menuCategories.restaurantId, restaurantId))
      .orderBy(menuCategories.displayOrder);
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [created] = await db.insert(menuCategories).values(category).returning();
    return created;
  }

  async updateMenuCategory(id: number, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined> {
    const [updated] = await db.update(menuCategories)
      .set(category)
      .where(eq(menuCategories.id, id))
      .returning();
    return updated;
  }

  async deleteMenuCategory(id: number): Promise<boolean> {
    const result = await db.delete(menuCategories)
      .where(eq(menuCategories.id, id))
      .returning();
    return result.length > 0;
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]> {
    return await db.select().from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(menuItems.displayOrder);
  }

  async getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    return await db.select()
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .where(eq(menuCategories.restaurantId, restaurantId))
    .then(results => results.map(result => result.menu_items));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems)
      .set(item)
      .where(eq(menuItems.id, id))
      .returning();
    return updated;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning();
    return result.length > 0;
  }

  // Analytics operations
  async incrementMenuItemClicks(itemId: number): Promise<void> {
    await db.execute(
      `UPDATE menu_items SET click_count = COALESCE(click_count, 0) + 1 WHERE id = ${itemId}`
    );
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

  // Menu view operations
  async getMenuViewsByRestaurantId(restaurantId: number): Promise<MenuView[]> {
    return await db.select().from(menuViews)
      .where(eq(menuViews.restaurantId, restaurantId))
      .orderBy(desc(menuViews.viewedAt));
  }

  async countMenuViewsByRestaurantId(restaurantId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(menuViews)
      .where(eq(menuViews.restaurantId, restaurantId));
    return result[0].count;
  }

  async countMenuViewsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    const result = await db.select({ count: count() })
      .from(menuViews)
      .where(and(
        gte(menuViews.viewedAt, startDate),
        lte(menuViews.viewedAt, endDate)
      ));
    return result[0].count;
  }

  async createMenuView(view: InsertMenuView): Promise<MenuView> {
    const [created] = await db.insert(menuViews).values(view).returning();
    return created;
  }

  // Stats operations
  async getMenuItemCountByRestaurantId(restaurantId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(menuItems)
      .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(eq(menuCategories.restaurantId, restaurantId));
    return result[0].count;
  }

  async getQrScanCountByRestaurantId(restaurantId: number): Promise<number> {
    const restaurant = await this.getRestaurant(restaurantId);
    return restaurant?.qrCodeScans || 0;
  }

  // Other required methods (simplified implementations)
  async createRegistrationAnalytics(analytics: InsertRegistrationAnalytics): Promise<RegistrationAnalytics> {
    const [result] = await db.insert(registrationAnalytics).values(analytics).returning();
    return result;
  }

  async getRegistrationAnalyticsByUserId(userId: number): Promise<RegistrationAnalytics | undefined> {
    const [result] = await db.select().from(registrationAnalytics).where(eq(registrationAnalytics.userId, userId));
    return result;
  }

  async countRegistrationsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    const result = await db.select({ count: count() })
      .from(registrationAnalytics)
      .where(and(
        gte(registrationAnalytics.registeredAt, startDate),
        lte(registrationAnalytics.registeredAt, endDate)
      ));
    return result[0].count;
  }

  async countRegistrationsBySource(source: string): Promise<number> {
    const result = await db.select({ count: count() })
      .from(registrationAnalytics)
      .where(eq(registrationAnalytics.source, source));
    return result[0].count;
  }

  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getActiveSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.isActive, true)
      ));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(subscription).returning();
    return created;
  }

  async updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updated] = await db.update(subscriptions)
      .set(subscription)
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.startDate));
  }

  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsBySubscriptionId(subscriptionId: number): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.subscriptionId, subscriptionId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentByReference(reference: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments)
      .where(eq(payments.paymentId, reference));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    const [feedback] = await db.select().from(feedbacks).where(eq(feedbacks.id, id));
    return feedback;
  }

  async getFeedbacksByRestaurantId(restaurantId: number): Promise<Feedback[]> {
    return await db.select().from(feedbacks)
      .where(eq(feedbacks.restaurantId, restaurantId))
      .orderBy(desc(feedbacks.createdAt));
  }

  async getFeedbacksByMenuItemId(menuItemId: number): Promise<Feedback[]> {
    return await db.select().from(feedbacks)
      .where(eq(feedbacks.menuItemId, menuItemId))
      .orderBy(desc(feedbacks.createdAt));
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const [created] = await db.insert(feedbacks).values(feedback).returning();
    return created;
  }

  async updateFeedback(id: number, feedback: Partial<Feedback>): Promise<Feedback | undefined> {
    const [updated] = await db.update(feedbacks)
      .set(feedback)
      .where(eq(feedbacks.id, id))
      .returning();
    return updated;
  }

  async approveFeedback(id: number): Promise<Feedback | undefined> {
    const [feedback] = await db.update(feedbacks)
      .set({ status: 'approved' })
      .where(eq(feedbacks.id, id))
      .returning();
    return feedback;
  }

  async rejectFeedback(id: number): Promise<Feedback | undefined> {
    const [feedback] = await db.update(feedbacks)
      .set({ status: 'rejected' })
      .where(eq(feedbacks.id, id))
      .returning();
    return feedback;
  }

  // Dietary preference operations
  async getDietaryPreference(id: number): Promise<DietaryPreference | undefined> {
    const [preference] = await db.select().from(dietaryPreferences).where(eq(dietaryPreferences.id, id));
    return preference;
  }

  async getDietaryPreferenceByUserId(userId: number): Promise<DietaryPreference | undefined> {
    const [preference] = await db.select().from(dietaryPreferences)
      .where(eq(dietaryPreferences.userId, userId));
    return preference;
  }

  async getDietaryPreferenceBySessionId(sessionId: string): Promise<DietaryPreference | undefined> {
    const [preference] = await db.select().from(dietaryPreferences)
      .where(eq(dietaryPreferences.sessionId, sessionId));
    return preference;
  }

  async createDietaryPreference(preference: InsertDietaryPreference): Promise<DietaryPreference> {
    const [created] = await db.insert(dietaryPreferences).values(preference).returning();
    return created;
  }

  async updateDietaryPreference(id: number, preference: Partial<InsertDietaryPreference>): Promise<DietaryPreference | undefined> {
    const [updated] = await db.update(dietaryPreferences)
      .set(preference)
      .where(eq(dietaryPreferences.id, id))
      .returning();
    return updated;
  }

  async deleteDietaryPreference(id: number): Promise<boolean> {
    const result = await db.delete(dietaryPreferences)
      .where(eq(dietaryPreferences.id, id))
      .returning();
    return result.length > 0;
  }

  // Advertisement operations
  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
    return ad;
  }

  async getAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  }

  async getAllAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  }

  async getActiveAdvertisementByPosition(position: string): Promise<Advertisement | undefined> {
    const [ad] = await db.select().from(advertisements)
      .where(and(
        eq(advertisements.position, position),
        eq(advertisements.isActive, true)
      ));
    return ad;
  }

  async getTargetedAdvertisement(position: string, restaurant: Restaurant | null): Promise<Advertisement | undefined> {
    return await this.getActiveAdvertisementByPosition(position);
  }

  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [created] = await db.insert(advertisements).values(ad).returning();
    return created;
  }

  async updateAdvertisement(id: number, ad: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const [updated] = await db.update(advertisements)
      .set(ad)
      .where(eq(advertisements.id, id))
      .returning();
    return updated;
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    const result = await db.delete(advertisements)
      .where(eq(advertisements.id, id))
      .returning();
    return result.length > 0;
  }

  // File upload operations
  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const [created] = await db.insert(fileUploads).values(fileUpload).returning();
    return created;
  }

  async getFileUpload(id: number): Promise<FileUpload | undefined> {
    const [file] = await db.select().from(fileUploads).where(eq(fileUploads.id, id));
    return file;
  }

  async getFileUploadByStoredFilename(storedFilename: string): Promise<FileUpload | undefined> {
    const [file] = await db.select().from(fileUploads)
      .where(eq(fileUploads.storedFilename, storedFilename));
    return file;
  }

  async getFileUploadsByUserId(userId: number): Promise<FileUpload[]> {
    return await db.select().from(fileUploads)
      .where(eq(fileUploads.userId, userId))
      .orderBy(desc(fileUploads.uploadedAt));
  }

  async getFileUploadsByRestaurantId(restaurantId: number): Promise<FileUpload[]> {
    return await db.select().from(fileUploads)
      .where(eq(fileUploads.restaurantId, restaurantId))
      .orderBy(desc(fileUploads.uploadedAt));
  }

  async getFileUploadsByCategory(category: string): Promise<FileUpload[]> {
    return await db.select().from(fileUploads)
      .where(eq(fileUploads.fileCategory, category))
      .orderBy(desc(fileUploads.uploadedAt));
  }

  async updateFileUploadStatus(id: number, status: string): Promise<FileUpload | undefined> {
    const [updated] = await db.update(fileUploads)
      .set({ status })
      .where(eq(fileUploads.id, id))
      .returning();
    return updated;
  }

  async deleteFileUpload(id: number): Promise<boolean> {
    const result = await db.delete(fileUploads)
      .where(eq(fileUploads.id, id))
      .returning();
    return result.length > 0;
  }

  async getUserImageCount(userId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(fileUploads)
      .where(and(
        eq(fileUploads.userId, userId),
        or(
          eq(fileUploads.fileCategory, 'menu-items'),
          eq(fileUploads.fileCategory, 'logos'),
          eq(fileUploads.fileCategory, 'banners')
        )
      ));
    return result[0].count;
  }

  // Permanent image operations
  async savePermanentImage(image: InsertPermanentImage): Promise<PermanentImage> {
    const [saved] = await db.insert(permanentImages).values(image).returning();
    return saved;
  }

  async getPermanentImage(filename: string): Promise<PermanentImage | undefined> {
    const [image] = await db.select().from(permanentImages)
      .where(eq(permanentImages.filename, filename));
    return image;
  }

  async getPermanentImagesByUserId(userId: number): Promise<PermanentImage[]> {
    return await db.select().from(permanentImages)
      .where(eq(permanentImages.userId, userId))
      .orderBy(desc(permanentImages.createdAt));
  }

  async getPermanentImagesByRestaurantId(restaurantId: number): Promise<PermanentImage[]> {
    return await db.select().from(permanentImages)
      .where(eq(permanentImages.restaurantId, restaurantId))
      .orderBy(desc(permanentImages.createdAt));
  }

  async deletePermanentImage(filename: string): Promise<boolean> {
    const result = await db.delete(permanentImages)
      .where(eq(permanentImages.filename, filename))
      .returning();
    return result.length > 0;
  }

  // Admin operations
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [adminLog] = await db.insert(adminLogs).values(log).returning();
    return adminLog;
  }

  async getAdminLogs(limit: number = 50): Promise<AdminLog[]> {
    return await db.select().from(adminLogs)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);
  }

  async getAllLogs(): Promise<AdminLog[]> {
    return await db.select().from(adminLogs)
      .orderBy(desc(adminLogs.createdAt));
  }

  async getAdminLogsByAdminId(adminId: number, limit: number = 50): Promise<AdminLog[]> {
    return await db.select().from(adminLogs)
      .where(eq(adminLogs.adminId, adminId))
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);
  }

  // Pricing plan operations
  async getAllPricingPlans(): Promise<PricingPlan[]> {
    return await db.select().from(pricingPlans).orderBy(pricingPlans.id);
  }

  async getPricingPlan(id: number): Promise<PricingPlan | undefined> {
    const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, id));
    return plan;
  }

  async createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan> {
    const [created] = await db.insert(pricingPlans).values(plan).returning();
    return created;
  }

  async updatePricingPlan(id: number, plan: Partial<PricingPlan>): Promise<PricingPlan | undefined> {
    const [updated] = await db.update(pricingPlans)
      .set(plan)
      .where(eq(pricingPlans.id, id))
      .returning();
    return updated;
  }

  async deletePricingPlan(id: number): Promise<boolean> {
    const result = await db.delete(pricingPlans)
      .where(eq(pricingPlans.id, id))
      .returning();
    return result.length > 0;
  }

  // Contact info operations
  async getContactInfo(): Promise<ContactInfo | undefined> {
    const [info] = await db.select().from(contactInfo);
    return info;
  }

  async updateContactInfo(info: Partial<ContactInfo>): Promise<ContactInfo> {
    // First try to update existing record
    const [updated] = await db.update(contactInfo)
      .set(info)
      .returning();
    
    if (updated) {
      return updated;
    }
    
    // If no record exists, create one
    const [created] = await db.insert(contactInfo)
      .values({
        address: info.address || '',
        email: info.email || '',
        phone: info.phone || '',
        updatedAt: new Date()
      })
      .returning();
    
    return created;
  }

  // Menu examples operations
  async getMenuExamples(): Promise<MenuExample[]> {
    return await db.select().from(menuExamples)
      .orderBy(menuExamples.displayOrder);
  }

  async getActiveMenuExamples(): Promise<MenuExample[]> {
    return await db.select().from(menuExamples)
      .where(eq(menuExamples.isActive, true))
      .orderBy(menuExamples.displayOrder);
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
      .orderBy(testimonials.displayOrder);
  }

  async getAllTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials)
      .orderBy(desc(testimonials.createdAt));
  }

  async getActiveTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(testimonials.displayOrder);
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

  // Ad settings operations
  async getAdSettings(): Promise<AdSettings | undefined> {
    const [settings] = await db.select().from(adSettings);
    return settings;
  }

  async updateAdSettings(settings: Partial<InsertAdSettings>): Promise<AdSettings> {
    // First try to update existing record
    const [updated] = await db.update(adSettings)
      .set(settings)
      .returning();
    
    if (updated) {
      return updated;
    }
    
    // If no record exists, create one
    const [created] = await db.insert(adSettings)
      .values({
        position: settings.position || 'bottom',
        isEnabled: settings.isEnabled ?? true,
        description: settings.description || 'Advertisement settings',
        displayFrequency: settings.displayFrequency || 1,
        maxAdsPerPage: settings.maxAdsPerPage || 3,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return created;
  }

  // Waiter call operations
  async createWaiterCall(call: InsertWaiterCall): Promise<WaiterCall> {
    const [created] = await db.insert(waiterCalls).values(call).returning();
    return created;
  }

  async getWaiterCallsByRestaurantId(restaurantId: number): Promise<WaiterCall[]> {
    return await db.select().from(waiterCalls)
      .where(eq(waiterCalls.restaurantId, restaurantId))
      .orderBy(desc(waiterCalls.createdAt));
  }

  async getWaiterCall(id: number): Promise<WaiterCall | undefined> {
    const [call] = await db.select().from(waiterCalls).where(eq(waiterCalls.id, id));
    return call;
  }

  async updateWaiterCallStatus(id: number, status: string): Promise<WaiterCall | undefined> {
    const updateData: any = { status };
    
    if (status === 'acknowledged') {
      updateData.acknowledgedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [updated] = await db.update(waiterCalls)
      .set(updateData)
      .where(eq(waiterCalls.id, id))
      .returning();
    return updated;
  }

  async getPendingWaiterCalls(restaurantId: number): Promise<WaiterCall[]> {
    return await db.select().from(waiterCalls)
      .where(and(
        eq(waiterCalls.restaurantId, restaurantId),
        eq(waiterCalls.status, 'pending')
      ))
      .orderBy(desc(waiterCalls.createdAt));
  }

  // Missing analytics methods implementation
  async incrementQRCodeScans(restaurantId: number): Promise<void> {
    // First get current QR scan count
    const [restaurant] = await db.select({ qrCodeScans: restaurants.qrCodeScans })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));
    
    if (restaurant) {
      // Increment the QR code scans count
      await db.update(restaurants)
        .set({ 
          qrCodeScans: (restaurant.qrCodeScans || 0) + 1
        })
        .where(eq(restaurants.id, restaurantId));
    }
  }

  async getViewsAnalytics(): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    total: number;
  }> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [daily, weekly, monthly, yearly, total] = await Promise.all([
      this.countMenuViewsInDateRange(dayAgo, now),
      this.countMenuViewsInDateRange(weekAgo, now),
      this.countMenuViewsInDateRange(monthAgo, now),
      this.countMenuViewsInDateRange(yearAgo, now),
      db.select({ count: count() }).from(menuViews).then(result => result[0].count)
    ]);

    return { daily, weekly, monthly, yearly, total };
  }

  async getRegistrationAnalytics(): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  }> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [daily, weekly, monthly, yearly] = await Promise.all([
      this.countRegistrationsInDateRange(dayAgo, now),
      this.countRegistrationsInDateRange(weekAgo, now),
      this.countRegistrationsInDateRange(monthAgo, now),
      this.countRegistrationsInDateRange(yearAgo, now)
    ]);

    return { daily, weekly, monthly, yearly };
  }

  async getRestaurantStats(restaurantId: number): Promise<{
    viewCount: number;
    qrScanCount: number;
    directQrScans: number;
    menuItemCount: number;
    daysActive: number;
  }> {
    const [restaurant, menuItemCount, viewCount] = await Promise.all([
      this.getRestaurant(restaurantId),
      this.getMenuItemCountByRestaurantId(restaurantId),
      this.countMenuViewsByRestaurantId(restaurantId)
    ]);

    if (!restaurant) {
      return {
        viewCount: 0,
        qrScanCount: 0,
        directQrScans: 0,
        menuItemCount: 0,
        daysActive: 0
      };
    }

    // Calculate days active based on earliest menu view or default to 1 day
    let daysActive = 1; // Default to 1 day if no views exist
    
    try {
      // Get the earliest menu view for this restaurant to calculate days active
      const earliestViews = await db.select({ viewedAt: menuViews.viewedAt })
        .from(menuViews)
        .where(eq(menuViews.restaurantId, restaurantId))
        .orderBy(menuViews.viewedAt)
        .limit(1);
      
      if (earliestViews.length > 0) {
        const viewedAt = earliestViews[0].viewedAt;
        if (viewedAt) {
          const firstView = new Date(viewedAt);
          const now = new Date();
          daysActive = Math.floor((now.getTime() - firstView.getTime()) / (1000 * 60 * 60 * 24));
          daysActive = Math.max(daysActive, 1); // Ensure at least 1 day
        }
      }
    } catch (error) {
      console.error('Error calculating days active:', error);
      daysActive = 1; // Fallback to 1 day
    }

    // Get QR scan count from restaurant record
    const qrScanCount = restaurant.qrCodeScans || 0;

    return {
      viewCount,
      qrScanCount,
      directQrScans: qrScanCount, // Using same value for both QR scan fields
      menuItemCount,
      daysActive
    };
  }

  // Feedback operations
  async getFeedbacksByRestaurantId(restaurantId: number): Promise<Feedback[]> {
    try {
      const result = await db.select()
        .from(feedbacks)
        .where(eq(feedbacks.restaurantId, restaurantId))
        .orderBy(desc(feedbacks.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      return [];
    }
  }

  // Agent operations
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db.insert(agents).values(agent).returning();
    return newAgent;
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getAgentByUserId(userId: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.userId, userId));
    return agent;
  }

  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents).orderBy(desc(agents.createdAt));
  }

  async getPendingAgents(): Promise<Agent[]> {
    return await db.select().from(agents)
      .where(eq(agents.approvalStatus, 'pending'))
      .orderBy(desc(agents.createdAt));
  }

  async getApprovedAgents(): Promise<Agent[]> {
    return await db.select().from(agents)
      .where(eq(agents.approvalStatus, 'approved'))
      .orderBy(desc(agents.createdAt));
  }

  async updateAgent(id: number, agent: Partial<Agent>): Promise<Agent | undefined> {
    const [updated] = await db.update(agents)
      .set({ ...agent, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();
    return updated;
  }

  async approveAgent(id: number, adminId: number, notes?: string): Promise<Agent | undefined> {
    const [updated] = await db.update(agents)
      .set({
        approvalStatus: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        approvalNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(agents.id, id))
      .returning();
    
    // Also update the user role to 'agent'
    if (updated) {
      await db.update(users)
        .set({ role: 'agent' })
        .where(eq(users.id, updated.userId));
    }
    
    return updated;
  }

  async rejectAgent(id: number, adminId: number, notes?: string): Promise<Agent | undefined> {
    const [updated] = await db.update(agents)
      .set({
        approvalStatus: 'rejected',
        approvedBy: adminId,
        approvedAt: new Date(),
        approvalNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(agents.id, id))
      .returning();
    return updated;
  }

  // Restaurant approval operations
  async getPendingRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants)
      .where(eq(restaurants.approvalStatus, 'pending'));
  }

  async approveRestaurant(id: number, adminId: number, notes?: string): Promise<Restaurant | undefined> {
    const [updated] = await db.update(restaurants)
      .set({
        adminApproved: true,
        approvalStatus: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        approvalNotes: notes
      })
      .where(eq(restaurants.id, id))
      .returning();
    return updated;
  }

  async rejectRestaurant(id: number, adminId: number, notes?: string): Promise<Restaurant | undefined> {
    const [updated] = await db.update(restaurants)
      .set({
        adminApproved: false,
        approvalStatus: 'rejected',
        approvedBy: adminId,
        approvedAt: new Date(),
        approvalNotes: notes
      })
      .where(eq(restaurants.id, id))
      .returning();
    return updated;
  }

  // Free tier limit checks
  async countCategoriesByRestaurantId(restaurantId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(menuCategories)
      .where(eq(menuCategories.restaurantId, restaurantId));
    return result?.count || 0;
  }

  async countItemsByCategoryId(categoryId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId));
    return result?.count || 0;
  }

  async countBannersByRestaurantId(restaurantId: number): Promise<number> {
    const [restaurant] = await db.select({ bannerUrls: restaurants.bannerUrls })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));
    
    if (!restaurant || !restaurant.bannerUrls) return 0;
    const bannerArray = restaurant.bannerUrls as string[];
    return bannerArray.length;
  }

  // Token management operations
  async generateAgentCode(): Promise<string> {
    const allAgents = await db.select({ agentCode: agents.agentCode }).from(agents);
    const existingCodes = allAgents.map(a => a.agentCode).filter(Boolean);
    
    let maxNum = 0;
    for (const code of existingCodes) {
      if (code && code.startsWith('AG-')) {
        const num = parseInt(code.substring(3), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    const nextNum = maxNum + 1;
    return `AG-${nextNum.toString().padStart(3, '0')}`;
  }

  async createTokenRequest(request: InsertTokenRequest): Promise<TokenRequest> {
    const [newRequest] = await db.insert(tokenRequests).values(request).returning();
    return newRequest;
  }

  async getTokenRequest(id: number): Promise<TokenRequest | undefined> {
    const [request] = await db.select().from(tokenRequests).where(eq(tokenRequests.id, id));
    return request;
  }

  async getTokenRequestsByAgentId(agentId: number): Promise<TokenRequest[]> {
    return await db.select().from(tokenRequests)
      .where(eq(tokenRequests.agentId, agentId))
      .orderBy(desc(tokenRequests.createdAt));
  }

  async getPendingTokenRequests(): Promise<TokenRequest[]> {
    return await db.select().from(tokenRequests)
      .where(eq(tokenRequests.status, 'pending'))
      .orderBy(desc(tokenRequests.createdAt));
  }

  async getAllTokenRequests(): Promise<TokenRequest[]> {
    return await db.select().from(tokenRequests)
      .orderBy(desc(tokenRequests.createdAt));
  }

  async approveTokenRequest(id: number, adminId: number, notes?: string): Promise<TokenRequest | undefined> {
    const request = await this.getTokenRequest(id);
    if (!request || request.status !== 'pending') return undefined;

    const [updated] = await db.update(tokenRequests)
      .set({
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNotes: notes
      })
      .where(eq(tokenRequests.id, id))
      .returning();

    if (updated) {
      await this.addTokensToAgent(
        updated.agentId,
        updated.requestedTokens,
        adminId,
        `Token request #${id} approved`,
        id
      );
    }

    return updated;
  }

  async rejectTokenRequest(id: number, adminId: number, notes?: string): Promise<TokenRequest | undefined> {
    const [updated] = await db.update(tokenRequests)
      .set({
        status: 'rejected',
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNotes: notes
      })
      .where(eq(tokenRequests.id, id))
      .returning();
    return updated;
  }

  async createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransaction> {
    const [newTransaction] = await db.insert(tokenTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getTokenTransactionsByAgentId(agentId: number): Promise<TokenTransaction[]> {
    return await db.select().from(tokenTransactions)
      .where(eq(tokenTransactions.agentId, agentId))
      .orderBy(desc(tokenTransactions.createdAt));
  }

  async addTokensToAgent(agentId: number, amount: number, adminId: number, reason: string, requestId?: number): Promise<Agent | undefined> {
    const agent = await this.getAgent(agentId);
    if (!agent) return undefined;

    const newBalance = (agent.tokenBalance || 0) + amount;
    
    const [updated] = await db.update(agents)
      .set({ tokenBalance: newBalance, updatedAt: new Date() })
      .where(eq(agents.id, agentId))
      .returning();

    await this.createTokenTransaction({
      agentId,
      amount,
      type: 'credit',
      reason,
      tokenRequestId: requestId,
      adminId
    });

    return updated;
  }

  async debitTokensFromAgent(agentId: number, amount: number, reason: string, restaurantId?: number): Promise<Agent | undefined> {
    const agent = await this.getAgent(agentId);
    if (!agent || (agent.tokenBalance || 0) < amount) return undefined;

    const newBalance = (agent.tokenBalance || 0) - amount;
    
    const [updated] = await db.update(agents)
      .set({ tokenBalance: newBalance, updatedAt: new Date() })
      .where(eq(agents.id, agentId))
      .returning();

    await this.createTokenTransaction({
      agentId,
      amount: -amount,
      type: 'debit',
      reason,
      restaurantId
    });

    return updated;
  }

  async getAgentStats(agentId: number): Promise<{
    tokenBalance: number;
    totalRestaurants: number;
    premiumRestaurants: number;
    pendingTokenRequests: number;
  }> {
    const agent = await this.getAgent(agentId);
    const agentRestaurants = await this.getRestaurantsByAgentId(agentId);
    const pendingRequests = await db.select({ count: count() })
      .from(tokenRequests)
      .where(and(
        eq(tokenRequests.agentId, agentId),
        eq(tokenRequests.status, 'pending')
      ));

    return {
      tokenBalance: agent?.tokenBalance || 0,
      totalRestaurants: agentRestaurants.length,
      premiumRestaurants: agentRestaurants.filter(r => r.isPremium).length,
      pendingTokenRequests: pendingRequests[0]?.count || 0
    };
  }

  async getRestaurantsByAgentId(agentId: number): Promise<Restaurant[]> {
    return await db.select().from(restaurants)
      .where(eq(restaurants.agentId, agentId))
      .orderBy(desc(restaurants.createdAt));
  }
}

// Use the database storage
export const storage = new DatabaseStorage();