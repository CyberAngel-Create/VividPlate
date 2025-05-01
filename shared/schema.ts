import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  subscriptionTier: text("subscription_tier").default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  telebirrCustomerId: text("telebirr_customer_id"),
  subscriptionExpiry: timestamp("subscription_expiry"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  isAdmin: boolean("is_admin").default(false),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  isAdmin: true,
  isActive: true,
});

// Restaurant profiles
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  cuisine: text("cuisine"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  hoursOfOperation: jsonb("hours_of_operation"),
  tags: text("tags").array(),
});

export const insertRestaurantSchema = createInsertSchema(restaurants).pick({
  userId: true,
  name: true,
  description: true,
  cuisine: true,
  logoUrl: true,
  bannerUrl: true,
  phone: true,
  email: true,
  address: true,
  hoursOfOperation: true,
  tags: true,
});

// Menu categories
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).pick({
  restaurantId: true,
  name: true,
  description: true,
  displayOrder: true,
});

// Menu items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  currency: text("currency").default("USD"),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  isAvailable: boolean("is_available").default(true),
  displayOrder: integer("display_order").default(0),
  // Dietary information
  dietaryInfo: jsonb("dietary_info"),
  calories: integer("calories"),
  allergens: text("allergens").array(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  categoryId: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  imageUrl: true,
  tags: true,
  isAvailable: true,
  displayOrder: true,
  dietaryInfo: true,
  calories: true,
  allergens: true,
});

// Menu views tracking
export const menuViews = pgTable("menu_views", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
  source: text("source"), // e.g., "qr", "link"
});

export const insertMenuViewSchema = createInsertSchema(menuViews).pick({
  restaurantId: true,
  source: true,
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tier: text("tier").notNull().default("free"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  paymentMethod: text("payment_method"), // "stripe", "telebirr", etc.
  isActive: boolean("is_active").default(true),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  tier: true,
  endDate: true,
  paymentMethod: true,
  isActive: true,
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subscriptionId: integer("subscription_id"),
  amount: text("amount").notNull(),
  currency: text("currency").default("USD"),
  paymentMethod: text("payment_method").notNull(), // "stripe", "telebirr", etc.
  paymentId: text("payment_id"), // External payment ID
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  subscriptionId: true,
  amount: true,
  currency: true,
  paymentMethod: true,
  paymentId: true,
  status: true,
});

// Feedback table
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id"),
  restaurantId: integer("restaurant_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  status: text("status").default("pending"), // "pending", "approved", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).pick({
  menuItemId: true,
  restaurantId: true,
  rating: true,
  comment: true,
  customerName: true,
  customerEmail: true,
  status: true,
});

// Customer dietary preferences
export const dietaryPreferences = pgTable("dietary_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // null for anonymous customers
  sessionId: text("session_id"), // for anonymous customers
  preferences: jsonb("preferences").notNull(),
  allergies: text("allergies").array(),
  calorieGoal: integer("calorie_goal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDietaryPreferencesSchema = createInsertSchema(dietaryPreferences).pick({
  userId: true,
  sessionId: true,
  preferences: true,
  allergies: true,
  calorieGoal: true,
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DietaryPreference = typeof dietaryPreferences.$inferSelect;
export type InsertDietaryPreference = z.infer<typeof insertDietaryPreferencesSchema>;

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type MenuView = typeof menuViews.$inferSelect;
export type InsertMenuView = z.infer<typeof insertMenuViewSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(), // "create_user", "update_user", "delete_user", etc.
  entityType: text("entity_type").notNull(), // "user", "restaurant", "subscription", etc.
  entityId: integer("entity_id"),
  details: jsonb("details"), // Additional details about the action
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).pick({
  adminId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;

// Pricing plans table
export const pricingPlans = pgTable("pricing_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").default("USD"),
  features: text("features").array().notNull(),
  tier: text("tier").notNull().default("free"),  // "free" or "premium"
  billingPeriod: text("billing_period").notNull().default("monthly"), // "monthly" or "yearly"
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").default(true),
});

export const insertPricingPlanSchema = createInsertSchema(pricingPlans).pick({
  name: true,
  description: true,
  price: true,
  currency: true,
  features: true,
  tier: true,
  billingPeriod: true,
  isPopular: true,
  isActive: true,
});

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type InsertPricingPlan = z.infer<typeof insertPricingPlanSchema>;

// Contact info table
export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactInfoSchema = createInsertSchema(contactInfo).pick({
  address: true,
  email: true,
  phone: true,
});

export type ContactInfo = typeof contactInfo.$inferSelect;
export type InsertContactInfo = z.infer<typeof insertContactInfoSchema>;
