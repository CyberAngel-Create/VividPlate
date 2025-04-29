import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertRestaurantSchema, 
  insertMenuCategorySchema, 
  insertMenuItemSchema,
  insertMenuViewSchema,
  insertFeedbackSchema
} from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import memorystore from 'memorystore';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

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
      // Special case for admin login
      if (username === 'Admin' && password === 'Admin@123') {
        return done(null, {
          id: 0, // Special admin ID
          username: 'Admin',
          email: 'admin@menumate.com',
          fullName: 'System Administrator',
          isAdmin: true,
        });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      // In a real app, we would hash the password, but for simplicity we'll just compare directly
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      // Add isAdmin flag for regular users (false)
      return done(null, { ...user, isAdmin: false });
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    // For admin, we serialize with a special identifier
    if (user.isAdmin) {
      done(null, 'admin:0');
    } else {
      done(null, `user:${user.id}`);
    }
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // If admin, return admin user object
      if (id === 'admin:0') {
        return done(null, {
          id: 0,
          username: 'Admin',
          email: 'admin@menumate.com',
          fullName: 'System Administrator',
          isAdmin: true,
        });
      }

      // Regular user
      const userId = parseInt(id.split(':')[1]);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return done(null, false);
      }
      
      done(null, { ...user, isAdmin: false });
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

// Admin middleware
const isAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
};

// Restaurant owner middleware
const isRestaurantOwner = async (req: any, res: any, next: any) => {
  const { restaurantId } = req.params;
  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant ID is required' });
  }

  // If admin, allow access to any restaurant
  if (req.user.isAdmin) {
    const restaurant = await storage.getRestaurant(parseInt(restaurantId));
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    req.restaurant = restaurant;
    return next();
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

// Configure multer for file uploads
const configureFileUpload = () => {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create a unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });

  // File size limit (3MB)
  const fileSizeLimit = 3 * 1024 * 1024;

  // File filter to only allow image files
  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  };

  return multer({ 
    storage, 
    limits: { fileSize: fileSizeLimit },
    fileFilter
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  configureSession(app);
  configurePassport(app);
  
  // Configure file upload middleware
  const upload = configureFileUpload();
  
  // Serve static files from the uploads directory
  app.use('/uploads', (req, res, next) => {
    const options = {
      root: path.join(process.cwd(), 'uploads'),
      dotfiles: 'deny' as const,
      headers: {
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      }
    };
    
    const fileName = req.path.substring(1); // Remove leading slash
    
    if (!fileName || fileName.includes('..')) {
      return res.status(403).send('Forbidden');
    }
    
    res.sendFile(fileName, options, (err) => {
      if (err) {
        if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
          return res.status(404).send('File not found');
        }
        return next(err);
      }
    });
  });

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
  
  // Admin login endpoint
  app.post('/api/auth/admin-login', passport.authenticate('local'), (req, res) => {
    // Verify this is actually an admin login
    if (req.user && (req.user as any).isAdmin) {
      const { password, ...userWithoutPassword } = req.user as any;
      return res.json(userWithoutPassword);
    }
    
    // If not admin, logout and return error
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.status(403).json({ message: 'Admin credentials required' });
    });
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
      const userId = (req.user as any).id;
      
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
  
  // Restaurant logo upload route
  app.post('/api/restaurants/:restaurantId/upload-logo', isAuthenticated, isRestaurantOwner, upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const restaurantId = parseInt(req.params.restaurantId);
      const logoUrl = `/uploads/${req.file.filename}`;
      
      // Update restaurant with new logo URL
      const restaurant = await storage.updateRestaurant(restaurantId, { logoUrl });
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      res.json({ logoUrl, success: true });
    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Error uploading logo', error: errorMsg });
    }
  });
  
  // Restaurant banner upload route
  app.post('/api/restaurants/:restaurantId/upload-banner', isAuthenticated, isRestaurantOwner, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const restaurantId = parseInt(req.params.restaurantId);
      const bannerUrl = `/uploads/${req.file.filename}`;
      
      // Update restaurant with new banner URL
      const restaurant = await storage.updateRestaurant(restaurantId, { bannerUrl });
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      res.json({ bannerUrl, success: true });
    } catch (error) {
      console.error('Error uploading banner:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Error uploading banner', error: errorMsg });
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
  
  // General menu item image upload route - for new items
  app.post('/api/upload/menuitem', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Simply return the URL to the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        imageUrl, 
        success: true 
      });
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Error uploading image', error: errorMsg });
    }
  });

  // Menu item image upload route - for existing items
  app.post('/api/items/:itemId/upload-image', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const itemId = parseInt(req.params.itemId);
      const item = await storage.getMenuItem(itemId);
      
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
      
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update menu item with new image URL
      const updatedItem = await storage.updateMenuItem(itemId, { imageUrl });
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json({ imageUrl, success: true });
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Error uploading image', error: errorMsg });
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

  // Subscription status routes
  app.get('/api/user/subscription-status', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const activeSubscription = await storage.getActiveSubscriptionByUserId(userId);
      const restaurantCount = await storage.countRestaurantsByUserId(userId);
      
      // Determine if user is on a paid plan
      const isPaid = activeSubscription?.tier === "premium";
      const maxRestaurants = isPaid ? 3 : 1;
      
      res.json({
        tier: isPaid ? "premium" : "free",
        isPaid,
        maxRestaurants,
        currentRestaurants: restaurantCount,
        expiresAt: activeSubscription?.endDate || null
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Create a Stripe subscription
  app.post('/api/create-subscription', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      const { planId } = req.body;
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user already has an active subscription
      const existingSubscription = await storage.getActiveSubscriptionByUserId(userId);
      if (existingSubscription) {
        return res.status(400).json({ message: 'User already has an active subscription' });
      }
      
      // Set subscription amount based on plan
      const amount = planId === "yearly" ? 9999 : 999; // In cents
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          userId: userId.toString(),
          planId,
          userEmail: user.email,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Subscription payment error:", error);
      res.status(500).json({ 
        message: 'Error creating payment intent', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Verify payment and finalize subscription
  app.post('/api/verify-payment', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: 'Payment ID is required' });
      }
      
      // Verify the payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Ensure this payment belongs to the right user
      if (paymentIntent.metadata.userId !== userId.toString()) {
        return res.status(403).json({ message: 'Unauthorized payment verification' });
      }
      
      // Check if payment was successful
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: 'Payment not completed', 
          status: paymentIntent.status 
        });
      }
      
      // Payment successful, create subscription
      const planId = paymentIntent.metadata.planId;
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      const newSubscription = await storage.createSubscription({
        userId,
        tier: "premium",
        endDate: oneYearFromNow,
        paymentMethod: "stripe",
        isActive: true
      });
      
      // Create payment record
      await storage.createPayment({
        userId,
        subscriptionId: newSubscription.id,
        amount: planId === "yearly" ? "99.99" : "9.99",
        currency: "USD",
        paymentMethod: "stripe",
        paymentId: paymentIntentId,
        status: "completed"
      });
      
      res.json({
        success: true,
        subscription: newSubscription
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ 
        message: 'Error verifying payment', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
  
  // Customer feedback submission
  app.post('/api/restaurants/:restaurantId/feedback', async (req, res) => {
    try {
      const { menuItemId, rating, comment, customerName, customerEmail } = req.body;
      
      if (!menuItemId || !rating) {
        return res.status(400).json({ message: 'Menu item ID and rating are required' });
      }
      
      const feedbackData = {
        menuItemId: parseInt(menuItemId),
        restaurantId: parseInt(req.params.restaurantId),
        rating: parseInt(rating),
        comment: comment || null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        status: 'pending'
      };
      
      const feedback = await storage.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get feedback for a specific restaurant
  app.get('/api/restaurants/:restaurantId/feedback', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const feedback = await storage.getFeedbacksByRestaurantId(parseInt(req.params.restaurantId));
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Admin routes
  app.get('/api/admin/restaurants', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const restaurants = await storage.getAllRestaurants();
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/admin/subscriptions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/admin/feedback', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all restaurants to aggregate feedback
      const restaurants = await storage.getAllRestaurants();
      
      // Create an array to hold all feedback from all restaurants
      let allFeedback: any[] = [];
      
      // For each restaurant, get its feedback and add to the array
      for (const restaurant of restaurants) {
        const feedback = await storage.getFeedbacksByRestaurantId(restaurant.id);
        allFeedback = [...allFeedback, ...feedback];
      }
      
      // Sort feedback by date (newest first)
      allFeedback.sort((a, b) => {
        const dateA = new Date(a.createdAt ? a.createdAt.toString() : 0).getTime();
        const dateB = new Date(b.createdAt ? b.createdAt.toString() : 0).getTime();
        return dateB - dateA;
      });
      
      res.json(allFeedback);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ message: errorMsg });
    }
  });
  
  // Approve or reject feedback
  app.patch('/api/admin/feedback/:feedbackId/approve', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const feedback = await storage.approveFeedback(parseInt(req.params.feedbackId));
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.patch('/api/admin/feedback/:feedbackId/reject', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const feedback = await storage.rejectFeedback(parseInt(req.params.feedbackId));
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Restaurant owner feedback endpoints
  app.get('/api/restaurants/:restaurantId/feedback', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const feedbacks = await storage.getFeedbacksByRestaurantId(restaurantId);
      res.json(feedbacks);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ message: errorMsg });
    }
  });
  
  // Customer feedback submission endpoint (no auth required)
  app.post('/api/restaurants/:restaurantId/feedback/submit', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const restaurant = await storage.getRestaurant(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Create feedback with validation
      const { menuItemId, rating, comment, customerName, customerEmail } = req.body;
      
      if (!rating) {
        return res.status(400).json({ message: 'Rating is required' });
      }
      
      // Prepare feedback data with proper types
      let feedbackData: any = {
        restaurantId,
        rating: parseInt(rating),
        comment: comment || null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        status: 'pending' // All new feedback starts as pending
      };
      
      // Only add menuItemId if it's provided
      if (menuItemId) {
        feedbackData.menuItemId = parseInt(menuItemId);
      }
      
      const feedback = await storage.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ message: errorMsg });
      }
    }
  });
  
  app.post('/api/feedback/:feedbackId/approve', isAuthenticated, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      const feedback = await storage.getFeedback(feedbackId);
      
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(feedback.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedFeedback = await storage.approveFeedback(feedbackId);
      res.json(updatedFeedback);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ message: errorMsg });
    }
  });
  
  app.post('/api/feedback/:feedbackId/reject', isAuthenticated, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      const feedback = await storage.getFeedback(feedbackId);
      
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(feedback.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedFeedback = await storage.rejectFeedback(feedbackId);
      res.json(updatedFeedback);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ message: errorMsg });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
