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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

// Restaurant profiles
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  cuisine: text("cuisine"),
  logoUrl: text("logo_url"),
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
  displayOrder: integer("display_order").default(0),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).pick({
  restaurantId: true,
  name: true,
  displayOrder: true,
});

// Menu items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  isAvailable: boolean("is_available").default(true),
  displayOrder: integer("display_order").default(0),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  categoryId: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  tags: true,
  isAvailable: true,
  displayOrder: true,
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

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type MenuView = typeof menuViews.$inferSelect;
export type InsertMenuView = z.infer<typeof insertMenuViewSchema>;
