import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertRestaurantSchema, 
  insertMenuCategorySchema, 
  insertMenuItemSchema,
  insertMenuViewSchema
} from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import memorystore from 'memorystore';

// Configure session
const configureSession = (app: Express) => {
  // In a production environment, you would use a real database store
  const MemoryStore = memorystore(session);

  app.use(session({
    secret: process.env.SESSION_SECRET || 'menumate-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 86400000 }, // 1 day
    store: new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions once per day
    })
  }));
};

// Configure passport for authentication
const configurePassport = (app: Express) => {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      // In a real app, we would hash the password, but for simplicity we'll just compare directly
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Restaurant owner middleware
const isRestaurantOwner = async (req: any, res: any, next: any) => {
  const { restaurantId } = req.params;
  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant ID is required' });
  }

  const restaurant = await storage.getRestaurant(parseInt(restaurantId));
  if (!restaurant) {
    return res.status(404).json({ message: 'Restaurant not found' });
  }

  if (restaurant.userId !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  req.restaurant = restaurant;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  configureSession(app);
  configurePassport(app);

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // In a real app, we would hash the password here
      // userData.password = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser(userData);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    // Successful login
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', isAuthenticated, (req, res) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Subscription Status Endpoint
  app.get('/api/user/subscription-status', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user has an active subscription
      const activeSubscription = await storage.getActiveSubscriptionByUserId(userId);
      
      // Count restaurants to enforce limits
      const restaurantCount = await storage.countRestaurantsByUserId(userId);
      
      if (activeSubscription && activeSubscription.tier === "premium") {
        return res.json({
          tier: activeSubscription.tier,
          isPaid: true,
          maxRestaurants: 3,
          currentRestaurants: restaurantCount,
          expiresAt: activeSubscription.endDate
        });
      } else {
        return res.json({
          tier: "free",
          isPaid: false,
          maxRestaurants: 1,
          currentRestaurants: restaurantCount,
          expiresAt: null
        });
      }
    } catch (error) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Restaurant routes
  app.get('/api/restaurants', isAuthenticated, async (req, res) => {
    try {
      const restaurants = await storage.getRestaurantsByUserId((req.user as any).id);
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/restaurants', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check subscription status to enforce restaurant limits
      const activeSubscription = await storage.getActiveSubscriptionByUserId(userId);
      const restaurantCount = await storage.countRestaurantsByUserId(userId);
      
      // Determine max restaurants based on subscription tier
      const maxRestaurants = activeSubscription && activeSubscription.tier === "premium" ? 3 : 1;
      
      // Check if user has reached their limit
      if (restaurantCount >= maxRestaurants) {
        return res.status(403).json({ 
          message: 'Restaurant limit reached', 
          limit: maxRestaurants,
          upgradeRequired: maxRestaurants === 1
        });
      }
      
      const restaurantData = insertRestaurantSchema.parse({
        ...req.body,
        userId
      });
      
      const restaurant = await storage.createRestaurant(restaurantData);
      res.status(201).json(restaurant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.get('/api/restaurants/:restaurantId', async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(parseInt(req.params.restaurantId));
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/restaurants/:restaurantId', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantUpdate = req.body;
      delete restaurantUpdate.userId; // Don't allow userId to be updated
      
      const restaurant = await storage.updateRestaurant(parseInt(req.params.restaurantId), restaurantUpdate);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Menu category routes
  app.get('/api/restaurants/:restaurantId/categories', async (req, res) => {
    try {
      const categories = await storage.getMenuCategoriesByRestaurantId(parseInt(req.params.restaurantId));
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/restaurants/:restaurantId/categories', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const categoryData = insertMenuCategorySchema.parse({
        ...req.body,
        restaurantId: parseInt(req.params.restaurantId)
      });
      
      const category = await storage.createMenuCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.patch('/api/categories/:categoryId', isAuthenticated, async (req, res) => {
    try {
      const category = await storage.getMenuCategory(parseInt(req.params.categoryId));
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const categoryUpdate = req.body;
      delete categoryUpdate.restaurantId; // Don't allow restaurantId to be updated
      
      const updatedCategory = await storage.updateMenuCategory(parseInt(req.params.categoryId), categoryUpdate);
      if (!updatedCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/categories/:categoryId', isAuthenticated, async (req, res) => {
    try {
      const category = await storage.getMenuCategory(parseInt(req.params.categoryId));
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const deleted = await storage.deleteMenuCategory(parseInt(req.params.categoryId));
      if (!deleted) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Menu item routes
  app.get('/api/categories/:categoryId/items', async (req, res) => {
    try {
      const items = await storage.getMenuItemsByCategoryId(parseInt(req.params.categoryId));
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/categories/:categoryId/items', isAuthenticated, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const category = await storage.getMenuCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const itemData = insertMenuItemSchema.parse({
        ...req.body,
        categoryId
      });
      
      const item = await storage.createMenuItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.patch('/api/items/:itemId', isAuthenticated, async (req, res) => {
    try {
      const item = await storage.getMenuItem(parseInt(req.params.itemId));
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      const category = await storage.getMenuCategory(item.categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const itemUpdate = req.body;
      
      const updatedItem = await storage.updateMenuItem(parseInt(req.params.itemId), itemUpdate);
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/items/:itemId', isAuthenticated, async (req, res) => {
    try {
      const item = await storage.getMenuItem(parseInt(req.params.itemId));
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      const category = await storage.getMenuCategory(item.categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const deleted = await storage.deleteMenuItem(parseInt(req.params.itemId));
      if (!deleted) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Menu view routes (for tracking)
  app.post('/api/restaurants/:restaurantId/views', async (req, res) => {
    try {
      const viewData = insertMenuViewSchema.parse({
        ...req.body,
        restaurantId: parseInt(req.params.restaurantId)
      });
      
      const view = await storage.createMenuView(viewData);
      res.status(201).json(view);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  // Stats routes
  app.get('/api/restaurants/:restaurantId/stats', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      
      const viewCount = await storage.countMenuViewsByRestaurantId(restaurantId);
      const qrScanCount = await storage.getQrScanCountByRestaurantId(restaurantId);
      const menuItemCount = await storage.getMenuItemCountByRestaurantId(restaurantId);
      
      // Calculate days active (in a real app, we would store a createdAt field)
      const daysActive = 7; // Hardcoded for demo purposes
      
      res.json({
        viewCount,
        qrScanCount,
        menuItemCount,
        daysActive
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get all menu data for a restaurant (for public view)
  app.get('/api/restaurants/:restaurantId/menu', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      const categories = await storage.getMenuCategoriesByRestaurantId(restaurantId);
      
      const menu = await Promise.all(categories.map(async (category) => {
        const items = await storage.getMenuItemsByCategoryId(category.id);
        return {
          ...category,
          items
        };
      }));
      
      // Record a new view
      await storage.createMenuView({
        restaurantId,
        source: req.query.source as string || 'link'
      });
      
      res.json({
        restaurant,
        menu
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
