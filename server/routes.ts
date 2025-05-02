import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertRestaurantSchema, 
  insertMenuCategorySchema, 
  insertMenuItemSchema,
  insertMenuViewSchema,
  insertFeedbackSchema,
  insertAdminLogSchema,
  insertDietaryPreferencesSchema
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
import { promisify } from "util";
import { scrypt, timingSafeEqual } from "crypto";

// Password comparison utility for authentication
const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    // First check if it's a bcrypt hash that starts with $2a$, $2b$, etc.
    if (stored.startsWith('$2')) {
      return await bcrypt.compare(supplied, stored);
    }

    // Otherwise treat it as a scrypt hash with salt
    const [hashed, salt] = stored.split('.');
    if (!hashed || !salt) return false;
    
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
// Create Stripe instance with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configure session
const configureSession = (app: Express) => {
  // In a production environment, you would use a real database store
  const MemoryStore = memorystore(session);

  app.use(session({
    secret: process.env.SESSION_SECRET || 'menumate-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      // Don't force secure cookies in production as Replit might not have HTTPS
      secure: false, 
      maxAge: 86400000, // 1 day
      sameSite: 'lax' // Helps with CSRF protection while allowing redirects
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions once per day
    })
  }));
  
  // Enable trust proxy if running behind a reverse proxy (like on Replit)
  app.set('trust proxy', 1);
};

// Configure passport for authentication
const configurePassport = (app: Express) => {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({
    usernameField: 'identifier',
    passwordField: 'password'
  }, async (identifier, password, done) => {
    try {
      console.log(`Login attempt for identifier: ${identifier}`);
      
      // Check if identifier is username or email
      let user = await storage.getUserByUsername(identifier);
      
      // If not found by username, try by email
      if (!user) {
        console.log(`User not found by username, trying email...`);
        user = await storage.getUserByEmail(identifier);
      }
      
      if (!user) {
        console.log(`User not found with identifier: ${identifier}`);
        return done(null, false, { message: 'Incorrect username or email.' });
      }

      console.log(`User found: ${user.username}, checking password...`);
      console.log(`Password type in DB: ${user.password.startsWith('$2') ? 'bcrypt' : 'plain/other'}`);
      
      // Special handling for non-hashed legacy passwords
      if (!user.password.startsWith('$2') && !user.password.includes('.')) {
        console.log('Legacy password detected (plain text), comparing directly');
        // Direct comparison for plain text passwords
        if (password === user.password) {
          console.log('Plain text password matched, upgrading to bcrypt...');
          // Upgrade to bcrypt hash
          const hashedPassword = await bcrypt.hash(password, 10);
          await storage.updateUser(user.id, { password: hashedPassword });
          return done(null, user);
        } else {
          console.log('Plain text password did not match');
          return done(null, false, { message: 'Incorrect password.' });
        }
      }
      
      // Normal password verification with hashing
      console.log('Comparing password with hashed version...');
      const isPasswordValid = await comparePasswords(password, user.password);
      
      if (!isPasswordValid) {
        console.log('Password comparison failed');
        return done(null, false, { message: 'Incorrect password.' });
      }

      console.log('Password verified successfully');
      // User is properly authenticated
      return done(null, user);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    // For admin, we serialize with a special identifier
    if (user.isAdmin) {
      done(null, `admin:${user.id}`);
    } else {
      done(null, `user:${user.id}`);
    }
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // Check for admin format (admin:id)
      if (id.startsWith('admin:')) {
        return done(null, {
          id: parseInt(id.split(':')[1]),
          username: 'admin',
          email: 'admin@digitamenumate.com',
          fullName: 'System Administrator',
          isAdmin: true,
        });
      }

      // Regular user (user:id)
      const userId = parseInt(id.split(':')[1]);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return done(null, false);
      }
      
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
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };
  configureSession(app);
  configurePassport(app);
  
  // Configure file upload middleware
  const upload = configureFileUpload();
  
  // Serve ads.txt file
  app.get('/ads.txt', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'client/public/ads.txt'));
  });
  
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

      // Hash the password using bcrypt before storing it
      userData.password = await bcrypt.hash(userData.password, 10);
      
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

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error during login' });
      }
      
      if (!user) {
        console.log('Authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session error during login:', loginErr);
          return res.status(500).json({ message: 'Error establishing session' });
        }
        
        console.log(`User ${user.username} (ID: ${user.id}) logged in successfully`);
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
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
  
  // User profile management routes
  app.get('/api/profile', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser((req.user as any).id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password, resetPasswordToken, resetPasswordExpires, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });
  
  app.put('/api/user/profile', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { username, email, fullName } = req.body;
      
      // Check if username already exists (if changing username)
      if (username && username !== (req.user as any).username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Username already taken' });
        }
      }
      
      // Check if email already exists (if changing email)
      if (email && email !== (req.user as any).email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Email already taken' });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, {
        username,
        email,
        fullName
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password, resetPasswordToken, resetPasswordExpires, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });
  
  // Change password endpoint
  app.put('/api/user/change-password', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }
      
      // Get user to verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password with bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Use storage operation to change password
      const passwordChanged = await storage.changePassword(userId, currentPassword, hashedPassword);
      
      if (!passwordChanged) {
        return res.status(400).json({ message: 'Failed to update password' });
      }
      
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });
  
  // Forgot password - request reset token
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal that the email doesn't exist
        return res.status(200).json({ message: 'If that email exists, a password reset link has been sent' });
      }
      
      // Generate token
      const token = uuidv4();
      
      // Set expiration to 1 hour from now
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);
      
      // Store token in database
      await storage.setResetPasswordToken(email, token, expires);
      
      // In a real app, send an email with the reset link
      // Here we just return the token for testing purposes
      
      res.status(200).json({ 
        message: 'Password reset link sent',
        // In production, don't return the token in the response
        // This is just for testing purposes
        resetToken: token
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Reset password using token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }
      
      // Validate token
      const user = await storage.getUserByResetToken(token);
      if (!user || !user.resetPasswordExpires) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      // Check if token is expired
      const now = new Date();
      if (now > user.resetPasswordExpires) {
        return res.status(400).json({ message: 'Token has expired' });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Reset password
      const success = await storage.resetPassword(token, hashedPassword);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to reset password' });
      }
      
      res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
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
      const restaurantCount = await storage.countRestaurantsByUserId(userId);
      const user = await storage.getUser(userId);
      
      // Determine max restaurants based on user's subscription tier
      const maxRestaurants = user && user.subscriptionTier === "premium" ? 3 : 1;
      
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
  
  // Update a category
  app.put('/api/categories/:categoryId', isAuthenticated, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      // Get the category
      const category = await storage.getMenuCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Get the restaurant to check ownership
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Check if user owns the restaurant
      if (restaurant.userId !== (req.user as any).id && !(req.user as any).isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Update the category
      const updatedCategory = await storage.updateMenuCategory(categoryId, req.body);
      if (!updatedCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Server error' });
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
  
  // Get single menu item by ID
  app.get('/api/menu-items/:itemId', async (req, res) => {
    try {
      const item = await storage.getMenuItem(parseInt(req.params.itemId));
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      res.json(item);
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

  // API: Dietary Preferences
  app.post('/api/dietary-preferences', async (req, res) => {
    try {
      // For logged in users, associate with user ID
      let userId = null;
      if (req.isAuthenticated()) {
        userId = req.user.id;
      }
      
      // For anonymous users, store session ID
      let sessionId = req.body.sessionId;
      if (!userId && !sessionId) {
        sessionId = uuidv4();
      }
      
      // Check if preferences already exist for this user/session
      let preference;
      if (userId) {
        preference = await storage.getDietaryPreferenceByUserId(userId);
      } else if (sessionId) {
        preference = await storage.getDietaryPreferenceBySessionId(sessionId);
      }
      
      // If preference exists, update it
      if (preference) {
        preference = await storage.updateDietaryPreference(preference.id, {
          ...req.body,
          userId,
          sessionId
        });
        return res.json({ preference, sessionId });
      }
      
      // Otherwise create new preference
      preference = await storage.createDietaryPreference({
        ...req.body,
        userId,
        sessionId
      });
      
      res.status(201).json({ preference, sessionId });
    } catch (error) {
      console.error('Error saving dietary preferences:', error);
      res.status(500).json({ message: 'Error saving dietary preferences', error: String(error) });
    }
  });
  
  app.get('/api/dietary-preferences', async (req, res) => {
    try {
      let preference;
      
      // For logged in users, get by user ID
      if (req.isAuthenticated()) {
        preference = await storage.getDietaryPreferenceByUserId(req.user.id);
        if (preference) {
          return res.json(preference);
        }
      }
      
      // For anonymous users, get by session ID
      const sessionId = req.query.sessionId as string;
      if (sessionId) {
        preference = await storage.getDietaryPreferenceBySessionId(sessionId);
        if (preference) {
          return res.json(preference);
        }
      }
      
      res.status(404).json({ message: 'No dietary preferences found' });
    } catch (error) {
      console.error('Error fetching dietary preferences:', error);
      res.status(500).json({ message: 'Error fetching dietary preferences', error: String(error) });
    }
  });
  
  app.get('/api/menu-recommendations/:restaurantId', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const sessionId = req.query.sessionId as string;
      
      // Get dietary preferences
      let preference;
      if (req.isAuthenticated()) {
        preference = await storage.getDietaryPreferenceByUserId(req.user.id);
      } else if (sessionId) {
        preference = await storage.getDietaryPreferenceBySessionId(sessionId);
      }
      
      if (!preference) {
        return res.status(404).json({ message: 'No dietary preferences found' });
      }
      
      // Get all menu items for this restaurant
      const menuItems = await storage.getMenuItemsByRestaurantId(restaurantId);
      
      // Filter and score items based on preferences
      const recommendations = menuItems.map(item => {
        let score = 0;
        let match = false;
        
        // Return early if no dietary info for this item
        if (!item.dietaryInfo) {
          return { item, score, match: false };
        }
        
        // Check for allergies
        if (preference.allergies && item.allergens) {
          const hasAllergens = preference.allergies.some(allergy => 
            item.allergens?.includes(allergy)
          );
          if (hasAllergens) {
            return { item, score: -100, match: false };
          }
        }
        
        // Score based on preferences
        if (preference.preferences && item.dietaryInfo) {
          // TypeScript will see dietaryInfo as unknown, so we need to cast
          const dietaryInfo = item.dietaryInfo as any;
          
          // For each preference, check if the item matches
          for (const [key, value] of Object.entries(preference.preferences)) {
            if (dietaryInfo[key] === value) {
              score += 10;
              match = true;
            }
          }
        }
        
        // Calorie matching
        if (preference.calorieGoal && item.calories) {
          // Higher score for items closer to calorie goal
          const calorieScore = 10 - Math.min(10, Math.abs(preference.calorieGoal - item.calories) / 100);
          score += calorieScore;
          
          // If within 20% of calorie goal, consider it a match
          if (Math.abs(preference.calorieGoal - item.calories) < preference.calorieGoal * 0.2) {
            match = true;
          }
        }
        
        return { item, score, match };
      });
      
      // Sort by score descending
      recommendations.sort((a, b) => b.score - a.score);
      
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ message: 'Error getting recommendations', error: String(error) });
    }
  });

  // Admin routes
  app.get('/api/admin/dashboard', isAdmin, async (req, res) => {
    try {
      const totalUsers = await storage.countUsers();
      const activeUsers = await storage.countActiveUsers();
      const freeUsers = await storage.countUsersBySubscriptionTier('free');
      const paidUsers = await storage.countUsersBySubscriptionTier('premium');
      const recentUsers = await storage.getRecentUsers(5);

      // Exclude sensitive data
      const sanitizedUsers = recentUsers.map(user => {
        const { password, resetPasswordToken, resetPasswordExpires, ...rest } = user;
        return rest;
      });

      res.json({
        totalUsers,
        activeUsers,
        freeUsers,
        paidUsers,
        recentUsers: sanitizedUsers
      });
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      
      const users = await storage.getAllUsers();
      
      // Simple pagination for now, in production would use proper SQL pagination
      const paginatedUsers = users.slice(offset, offset + limit);
      
      // Exclude sensitive data
      const sanitizedUsers = paginatedUsers.map(user => {
        const { password, resetPasswordToken, resetPasswordExpires, ...rest } = user;
        return rest;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/admin/restaurants', isAdmin, async (req, res) => {
    try {
      const restaurants = await storage.getAllRestaurants();
      
      // Enhanced restaurants with additional data
      const enhancedRestaurants = await Promise.all(restaurants.map(async (restaurant) => {
        // Get restaurant owner info
        const owner = await storage.getUser(restaurant.userId);
        
        // Get category and menu item counts
        const categories = await storage.getMenuCategoriesByRestaurantId(restaurant.id);
        const menuItems = await storage.getMenuItemsByRestaurantId(restaurant.id);
        const viewCount = await storage.countMenuViewsByRestaurantId(restaurant.id);
        
        // Get most recent visits
        const recentViews = await storage.getMenuViewsByRestaurantId(restaurant.id);
        const lastVisitDate = recentViews.length > 0 ? recentViews[0].viewedAt : null;
        
        // Get owner's subscription tier
        const ownerSubscriptionTier = owner?.subscriptionTier || 'free';
        
        return {
          ...restaurant,
          ownerName: owner ? owner.username : 'N/A',
          userEmail: owner ? owner.email : null,
          categoryCount: categories.length,
          menuItemCount: menuItems.length,
          viewCount: viewCount,
          lastVisitDate: lastVisitDate,
          // Only use the owner's subscription tier
          ownerSubscriptionTier: ownerSubscriptionTier
        };
      }));
      
      console.log('Enhanced restaurant data:', enhancedRestaurants[0]); // Logging first restaurant for debugging
      
      res.json(enhancedRestaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/admin/users', isAdmin, async (req, res) => {
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
      
      const user = await storage.createUser(userData);
      
      // Create admin log for this action
      await storage.createAdminLog({
        adminId: (req.user as any).id,
        action: 'create_user',
        entityType: 'user',
        entityId: user.id,
        details: `Created user ${user.username} from IP ${req.ip}`,
      });
      
      // Exclude sensitive data
      const { password, ...sanitizedUser } = user;
      
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.patch('/api/admin/users/:id/status', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean' });
      }
      
      const updatedUser = await storage.toggleUserStatus(userId, isActive);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create admin log for this action
      await storage.createAdminLog({
        adminId: (req.user as any).id,
        action: 'update_user_status',
        entityType: 'user',
        entityId: updatedUser.id,
        details: `Set user ${updatedUser.username} status to ${isActive ? 'active' : 'inactive'} from IP ${req.ip}`,
      });
      
      // Exclude sensitive data
      const { password, resetPasswordToken, resetPasswordExpires, ...sanitizedUser } = updatedUser;
      
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/admin/users/:id/subscription', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { subscriptionTier } = req.body;
      
      if (!['free', 'premium'].includes(subscriptionTier)) {
        return res.status(400).json({ message: 'Invalid subscription tier' });
      }
      
      const updatedUser = await storage.upgradeUserSubscription(userId, subscriptionTier);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create admin log for this action
      await storage.createAdminLog({
        adminId: (req.user as any).id,
        action: 'update_subscription',
        entityType: 'user',
        entityId: updatedUser.id,
        details: `Changed user ${updatedUser.username} subscription to ${subscriptionTier} from IP ${req.ip}`,
      });
      
      // Exclude sensitive data
      const { password, resetPasswordToken, resetPasswordExpires, ...sanitizedUser } = updatedUser;
      
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Error updating user subscription:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get admin logs
  app.get('/api/admin/logs', isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getAdminLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Public pricing plans endpoint
  app.get('/api/pricing', async (req, res) => {
    try {
      const plans = await storage.getAllPricingPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ message: 'Error loading pricing data' });
    }
  });
  
  // Public contact info endpoint
  app.get('/api/contact-info', async (req, res) => {
    try {
      const contactInfo = await storage.getContactInfo();
      res.json(contactInfo || {
        address: 'Ethiopia, Addis Abeba',
        email: 'menumate.spp@gmail.com',
        phone: '+251-913-690-687'
      });
    } catch (error) {
      console.error('Error fetching contact info:', error);
      res.status(500).json({ message: 'Failed to load contact information' });
    }
  });
  
  // Pricing plans management (admin)
  app.get('/api/admin/pricing', isAdmin, async (req, res) => {
    try {
      // Get all pricing plans from storage
      const plans = await storage.getAllPricingPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ message: 'Error loading pricing data' });
    }
  });

  app.post('/api/admin/pricing', isAdmin, async (req, res) => {
    try {
      // Validate and create a new pricing plan
      const plan = await storage.createPricingPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating pricing plan:', error);
      res.status(500).json({ message: 'Failed to create pricing plan' });
    }
  });

  app.patch('/api/admin/pricing/:id', isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.updatePricingPlan(planId, req.body);
      
      if (!plan) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error updating pricing plan:', error);
      res.status(500).json({ message: 'Failed to update pricing plan' });
    }
  });

  app.delete('/api/admin/pricing/:id', isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const result = await storage.deletePricingPlan(planId);
      
      if (!result) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      res.status(500).json({ message: 'Failed to delete pricing plan' });
    }
  });
  
  // Contact information management
  app.get('/api/admin/contact-info', isAdmin, async (req, res) => {
    try {
      const contactInfo = await storage.getContactInfo();
      res.json(contactInfo || {
        address: 'Ethiopia, Addis Abeba',
        email: 'menumate.spp@gmail.com',
        phone: '+251-913-690-687'
      });
    } catch (error) {
      console.error('Error fetching contact info:', error);
      res.status(500).json({ message: 'Failed to load contact information' });
    }
  });

  app.patch('/api/admin/contact-info', isAdmin, async (req, res) => {
    try {
      const { address, email, phone } = req.body;
      const updatedInfo = await storage.updateContactInfo({ address, email, phone });
      res.json(updatedInfo);
    } catch (error) {
      console.error('Error updating contact info:', error);
      res.status(500).json({ message: 'Failed to update contact information' });
    }
  });

  // Create admin user
  app.post('/api/admin/users/create-admin', isAdmin, async (req, res) => {
    try {
      const { username, email, fullName, password } = req.body;
      
      // Basic validation
      if (!username || !email || !fullName || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Create the admin user with bcrypt-hashed password
      // We can pass the plain password since our storage layer handles hashing
      const newAdmin = await storage.createUser({
        username,
        email,
        fullName,
        password, // Password hashing is handled inside storage implementation
        isAdmin: true,
        isActive: true
      });
      
      // Log admin creation
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      await storage.createAdminLog({
        adminId: adminUser.id,
        action: 'admin_created',
        entityType: 'user',
        entityId: newAdmin.id,
        details: { createdBy: adminUser.username, newAdminUsername: username }
      });
      
      // Return the new admin without password
      const { password: _, ...adminWithoutPassword } = newAdmin;
      res.status(201).json(adminWithoutPassword);
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).json({ message: 'Failed to create admin user' });
    }
  });

  // Admin profile update
  app.patch('/api/admin/profile', isAdmin, async (req, res) => {
    try {
      const { username, email, currentPassword, newPassword } = req.body;
      
      // Basic validation
      if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
      }
      
      // Get the current admin user
      const admin = await storage.getUser(req.user.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin user not found' });
      }
      
      // If changing password, verify the current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to set a new password' });
        }
        
        // Verify current password
        const isPasswordCorrect = await storage.verifyPassword(admin.id, currentPassword);
        if (!isPasswordCorrect) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Update user with new password
        const updatedAdmin = await storage.updateUserWithPassword(admin.id, {
          username,
          email,
          password: newPassword
        });
        
        // Return updated user without password
        const { password, ...userWithoutPassword } = updatedAdmin;
        return res.json(userWithoutPassword);
      }
      
      // Update user without changing password
      const updatedAdmin = await storage.updateUser(admin.id, {
        username,
        email
      });
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedAdmin;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating admin profile:', error);
      res.status(500).json({ message: 'Failed to update admin profile' });
    }
  });

  // Admin login
  app.post('/api/auth/admin-login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      // Check if the user has admin privileges
      if (!user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Create admin log for successful login
        storage.createAdminLog({
          adminId: user.id,
          action: 'admin_login',
          entityType: 'user',
          details: `Admin logged in: ${user.username} from IP ${req.ip}`,
        }).catch(console.error);
        
        const { password, ...sanitizedUser } = user;
        return res.json(sanitizedUser);
      });
    })(req, res, next);
  });

  const httpServer = createServer(app);
  return httpServer;
}
