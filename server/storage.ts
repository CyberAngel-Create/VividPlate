import { 
  users, User, InsertUser,
  restaurants, Restaurant, InsertRestaurant,
  menuCategories, MenuCategory, InsertMenuCategory,
  menuItems, MenuItem, InsertMenuItem,
  menuViews, MenuView, InsertMenuView
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantsByUserId(userId: number): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  
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

export const storage = new MemStorage();
