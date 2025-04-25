import { 
  users, User, InsertUser,
  restaurants, Restaurant, InsertRestaurant,
  menuCategories, MenuCategory, InsertMenuCategory,
  menuItems, MenuItem, InsertMenuItem,
  menuViews, MenuView, InsertMenuView,
  subscriptions, Subscription, InsertSubscription,
  payments, Payment, InsertPayment,
  feedbacks, Feedback, InsertFeedback
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

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
  createMenuView(view: InsertMenuView): Promise<MenuView>;

  // Stats operations
  getMenuItemCountByRestaurantId(restaurantId: number): Promise<number>;
  getQrScanCountByRestaurantId(restaurantId: number): Promise<number>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private restaurants: Map<number, Restaurant>;
  private menuCategories: Map<number, MenuCategory>;
  private menuItems: Map<number, MenuItem>;
  private menuViews: Map<number, MenuView>;
  
  private currentIds: {
    users: number;
    restaurants: number;
    menuCategories: number;
    menuItems: number;
    menuViews: number;
  };

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.menuCategories = new Map();
    this.menuItems = new Map();
    this.menuViews = new Map();
    
    this.currentIds = {
      users: 1,
      restaurants: 1,
      menuCategories: 1,
      menuItems: 1,
      menuViews: 1
    };
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.currentIds.restaurants++;
    const restaurant: Restaurant = { ...insertRestaurant, id };
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
    const category: MenuCategory = { ...insertCategory, id };
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
    const item: MenuItem = { ...insertItem, id };
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

  async createMenuView(insertView: InsertMenuView): Promise<MenuView> {
    const id = this.currentIds.menuViews++;
    const viewedAt = new Date();
    const view: MenuView = { ...insertView, id, viewedAt };
    this.menuViews.set(id, view);
    return view;
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

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantsByUserId(userId: number): Promise<Restaurant[]> {
    return await db.select().from(restaurants).where(eq(restaurants.userId, userId));
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const [restaurant] = await db.insert(restaurants).values(insertRestaurant).returning();
    return restaurant;
  }

  async updateRestaurant(id: number, restaurantUpdate: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updatedRestaurant] = await db.update(restaurants)
      .set(restaurantUpdate)
      .where(eq(restaurants.id, id))
      .returning();
    return updatedRestaurant;
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
    return await db.select()
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(menuItems.displayOrder);
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
    const [updatedItem] = await db.update(menuItems)
      .set(itemUpdate)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem;
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
    return db.select().from(restaurants);
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
}

// Use the database storage instead of memory storage
export const storage = new DatabaseStorage();
