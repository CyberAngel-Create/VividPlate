import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import fs from 'fs';
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
import path from 'path';
import os from 'os';
import multer from 'multer';
import Stripe from "stripe";
import { promisify } from "util";
import { scrypt, timingSafeEqual } from "crypto";
import { processMenuItemImage, processBannerImage, processLogoImage } from './image-utils';
import { compressImageSmart } from './smart-image-compression';
import { SubscriptionService } from './subscription-service';

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

  // Using a simplified LocalStrategy for authentication
  passport.use(new LocalStrategy({
    usernameField: 'identifier',
    passwordField: 'password'
  }, async (identifier, password, done) => {
    try {
      console.log(`Login attempt for identifier: ${identifier}`);
      
      // Hardcoded users for testing and development
      const testUsers = [
        { 
          id: 1, 
          username: 'admin', 
          password: 'admin1234',
          email: 'admin@example.com',
          fullName: 'Admin User',
          isAdmin: true,
          subscriptionTier: 'admin',
          isActive: true,
          createdAt: new Date()
        },
        { 
          id: 2, 
          username: 'restaurant1', 
          password: 'password123',
          email: 'restaurant1@example.com',
          fullName: 'Restaurant Owner',
          isAdmin: false,
          subscriptionTier: 'free',
          isActive: true,
          createdAt: new Date()
        },
        { 
          id: 3, 
          username: 'Entoto Cloud', 
          password: 'cloud123',
          email: 'entoto@example.com',
          fullName: 'Entoto Cloud',
          isAdmin: false,
          subscriptionTier: 'premium',
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      // Try to find user in test users by username or email
      const user = testUsers.find(u => 
        u.username.toLowerCase() === identifier.toLowerCase() || 
        u.email.toLowerCase() === identifier.toLowerCase()
      );
      
      if (!user) {
        console.log(`User not found with identifier: ${identifier}`);
        return done(null, false, { message: 'Incorrect username or email.' });
      }

      console.log(`User found: ${user.username}, checking password...`);
      
      // Direct password matching for test users
      if (user.password === password) {
        console.log('Password matched successfully');
        return done(null, user);
      }
      
      console.log('Password did not match');
      return done(null, false, { message: 'Incorrect password.' });
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
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created uploads directory at ${uploadDir}`);
    } catch (err) {
      console.error(`Failed to create uploads directory: ${err}`);
      throw new Error('Failed to initialize upload system: could not create directory');
    }
  } else {
    console.log(`Using existing uploads directory at ${uploadDir}`);
    
    // Verify write permissions to the directory
    try {
      const testFilePath = path.join(uploadDir, `.test-${Date.now()}`);
      fs.writeFileSync(testFilePath, 'test');
      fs.unlinkSync(testFilePath);
      console.log('Uploads directory is writable');
    } catch (err) {
      console.error(`Uploads directory is not writable: ${err}`);
      throw new Error('Failed to initialize upload system: directory is not writable');
    }
  }

  // Configure storage with additional logging and error handling
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Re-check if directory exists and create if needed (for more resilience)
      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
          console.log(`Recreated uploads directory at ${uploadDir}`);
        } catch (err) {
          console.error(`Failed to create uploads directory during upload: ${err}`);
          return cb(new Error('Failed to access upload directory'), '');
        }
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      try {
        // Create a unique filename with original extension and include user ID for better organization
        const userId = req.user ? (req.user as any).id : 'anonymous';
        const uniqueSuffix = `${userId}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        const filename = uniqueSuffix + ext;
        console.log(`Generating filename for upload: ${filename}`);
        cb(null, filename);
      } catch (err) {
        console.error(`Error generating filename: ${err}`);
        cb(new Error('Failed to generate filename for upload'), '');
      }
    }
  });

  // File size limit (1MB as requested)
  const fileSizeLimit = 1 * 1024 * 1024;

  // File filter to only allow image files with additional logging
  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        console.log(`Upload file type accepted: ${file.mimetype}, size: ${file.size || 'unknown'}`);
        cb(null, true);
      } else {
        console.error(`Upload rejected - invalid file type: ${file.mimetype}`);
        cb(null, false);
        // Note: We don't throw an error here, as that would cause a 500 error
        // Instead, we return false and the route handler should check if req.file exists
      }
    } catch (err) {
      console.error(`Error in file filter: ${err}`);
      cb(null, false);
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
  
  // Serve static files from the uploads directory with improved error handling
  app.use('/uploads', (req, res, next) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Check if uploads directory exists, create if it doesn't
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Recreated missing uploads directory at ${uploadDir}`);
      } catch (error) {
        console.error(`Failed to create uploads directory: ${error}`);
      }
    }
    
    // Enhanced cross-origin headers for better mobile compatibility
    // Using shorter max-age to prevent long caching of images that might change
    const options = {
      root: uploadDir,
      dotfiles: 'deny' as const,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour instead of 1 year
        'X-Content-Type-Options': 'nosniff', // Security header
        'Access-Control-Allow-Origin': '*', // Allow cross-origin access
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
        'Cross-Origin-Resource-Policy': 'cross-origin' // Allow cross-origin resource sharing
      }
    };
    
    const fileName = req.path.substring(1); // Remove leading slash
    
    if (!fileName || fileName.includes('..') || fileName.includes('/')) {
      console.warn(`Suspicious file path requested: ${fileName}`);
      return res.status(403).send('Forbidden');
    }
    
    // Log file access for debugging
    console.log(`Serving file: ${fileName} from ${uploadDir}`);
    
    // Full path to the file
    const filePath = path.join(uploadDir, fileName);
    
    // Check if file exists before attempting to send it
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${fileName}`);
      
      // For missing images, serve a default placeholder image instead
      if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        // Add enhanced cross-origin headers for placeholders too
        const placeholderHeaders = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Type': 'image/svg+xml',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
          'Cross-Origin-Resource-Policy': 'cross-origin'
        };
        
        // Generate a cache-busting query parameter to prevent stale cached placeholders
        const cacheBuster = Date.now();
        
        // First try to use SVG placeholder
        const svgPlaceholderPath = path.join(process.cwd(), 'public', 'placeholder-image.svg');
        if (fs.existsSync(svgPlaceholderPath)) {
          console.log(`Serving SVG placeholder for: ${fileName}`);
          return res.sendFile('placeholder-image.svg', {
            root: path.join(process.cwd(), 'public'),
            headers: placeholderHeaders
          });
        }
        
        // Try PNG placeholder as fallback
        const pngPlaceholderPath = path.join(process.cwd(), 'public', 'placeholder-image.png');
        if (fs.existsSync(pngPlaceholderPath)) {
          console.log(`Serving PNG placeholder for: ${fileName}`);
          return res.sendFile('placeholder-image.png', {
            root: path.join(process.cwd(), 'public'),
            headers: {
              ...placeholderHeaders,
              'Content-Type': 'image/png'
            }
          });
        } 
        
        // If no physical placeholder exists, create a simple SVG placeholder on the fly
        console.log(`Serving dynamic SVG placeholder for: ${fileName}`);
        const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#888" 
            text-anchor="middle" dominant-baseline="middle">Image Placeholder</text>
        </svg>`;
        
        // Apply all the cross-origin and cache control headers
        Object.entries(placeholderHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        return res.send(svg);
      }
      
      return res.status(404).send('File not found');
    }
    
    // For existing files, check if it's an image and add cache-busting timestamp in query
    if (req.query.t === undefined && filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const timestamp = Date.now();
      const redirectUrl = `${req.originalUrl}${req.originalUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      console.log(`Redirecting image request to include cache-buster: ${redirectUrl}`);
      return res.redirect(302, redirectUrl);
    }
    
    res.sendFile(fileName, options, (err) => {
      if (err) {
        console.error(`Error serving file ${fileName}:`, err);
        return next(err);
      }
      console.log(`Successfully served file: ${fileName}`);
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
      
      // Create the user
      const user = await storage.createUser(userData);
      
      // Track registration analytics
      try {
        const userAgent = req.headers['user-agent'] || '';
        let device = 'unknown';
        if (/mobile/i.test(userAgent)) device = 'mobile';
        else if (/tablet/i.test(userAgent)) device = 'tablet';
        else if (/windows|macintosh|linux/i.test(userAgent)) device = 'desktop';
        
        let browser = 'unknown';
        if (/firefox/i.test(userAgent)) browser = 'firefox';
        else if (/chrome/i.test(userAgent)) browser = 'chrome';
        else if (/safari/i.test(userAgent)) browser = 'safari';
        else if (/edge/i.test(userAgent)) browser = 'edge';
        else if (/opera/i.test(userAgent)) browser = 'opera';
        
        // Get UTM parameters if provided in the request
        const { utmSource, utmMedium, utmCampaign, referralCode, source } = req.body;
        
        await storage.createRegistrationAnalytics({
          userId: user.id,
          source: source || 'website',
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          referralCode: referralCode || null,
          device,
          browser,
          country: req.ip ? req.ip.split(':').pop() || 'unknown' : 'unknown'
        });
        
        console.log(`Registration analytics tracked for user ID: ${user.id}`);
      } catch (analyticsError) {
        // Log but don't fail the registration if analytics tracking fails
        console.error('Failed to track registration analytics:', analyticsError);
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    // Import our fixed memory-based authentication handler
    const { handleLogin } = await import('./fixed-login');
    return handleLogin(req, res, next);
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
      const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
      
      // Count restaurants to enforce limits
      const restaurantCount = await storage.countRestaurantsByUserId(userId);
      
      res.json({
        ...subscriptionStatus,
        currentRestaurants: restaurantCount,
        currentMenuItemImages: await storage.getUserMenuItemImageCount(userId)
      });
    } catch (error) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get current active subscription
  app.get('/api/subscription/current', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const activeSubscription = await storage.getActiveSubscriptionByUserId(userId);
      res.json(activeSubscription || null);
    } catch (error) {
      console.error("Error fetching current subscription:", error);
      res.status(500).json({ error: "Failed to fetch current subscription" });
    }
  });
  
  // Downgrade to free tier
  app.post("/api/subscription/downgrade", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get current subscription
      const activeSubscription = await storage.getActiveSubscriptionByUserId(userId);
      
      if (!activeSubscription) {
        return res.status(400).json({ error: "No active subscription to downgrade" });
      }
      
      if (activeSubscription.tier === 'free') {
        return res.status(400).json({ error: "Already on free tier" });
      }
      
      // If user has a Stripe subscription, cancel it
      if (req.user.stripeSubscriptionId) {
        try {
          if (stripe) {
            await stripe.subscriptions.cancel(req.user.stripeSubscriptionId);
          }
        } catch (stripeError) {
          console.error("Error cancelling Stripe subscription:", stripeError);
          // Continue even if Stripe cancellation fails - we'll still downgrade the user
        }
      }
      
      // Deactivate the current subscription
      await storage.updateSubscription(activeSubscription.id, {
        isActive: false,
        endDate: new Date()
      });
      
      // Create a new free tier subscription
      const newSubscription = await storage.createSubscription({
        userId,
        tier: 'free',
        isActive: true,
        startDate: new Date(),
        paymentMethod: 'system'
      });
      
      res.json(newSubscription);
    } catch (error) {
      console.error("Error downgrading subscription:", error);
      res.status(500).json({ error: "Failed to downgrade subscription" });
    }
  });

  // Restaurant routes
  app.get('/api/restaurants', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      console.log("Fetching restaurants for user ID:", userId);
      
      // Check if user exists in the database
      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`User ${userId} not found in database`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Attempt to fetch restaurants with error handling for schema issues
      let restaurants;
      try {
        restaurants = await storage.getRestaurantsByUserId(userId);
        console.log("Restaurants fetched successfully:", restaurants);
      } catch (fetchError) {
        console.error("Error in first restaurant fetch attempt:", fetchError);
        
        // Fallback: Try to execute a direct SQL query to get basic restaurant data
        try {
          const { pool } = await import('./db');
          const result = await pool.query('SELECT id, user_id, name, description, cuisine, logo_url, banner_url FROM restaurants WHERE user_id = $1', [userId]);
          
          // Map results to match our expected schema
          restaurants = result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            cuisine: row.cuisine,
            logoUrl: row.logo_url,
            bannerUrl: row.banner_url,
            bannerUrls: [],  // Default empty array since column may be missing
            themeSettings: {}, // Default empty object for theme settings
            tags: []  // Default empty array for tags
          }));
          
          console.log("Restaurants fetched with fallback method:", restaurants);
        } catch (fallbackError) {
          console.error("Error in fallback restaurant fetch:", fallbackError);
          throw fallbackError; // Re-throw to be caught by outer catch
        }
      }
      
      // Return the restaurant data to the client
      res.json(restaurants || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: 'Server error', details: String(error) });
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

  app.get('/api/restaurants/name/:restaurantName', async (req, res) => {
    try {
      const restaurantName = req.params.restaurantName;
      const normalizedName = decodeURIComponent(restaurantName).replace(/-/g, ' ');
      console.log(`Fetching restaurant with name: ${normalizedName}`);
      
      // Fetch all restaurants and find the one with matching name
      const allRestaurants = await storage.getAllRestaurants();
      const restaurant = allRestaurants.find(
        (r) => r.name.toLowerCase() === normalizedName.toLowerCase()
      );
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error('Error fetching restaurant by name:', error);
      res.status(500).json({ message: 'Server error while fetching restaurant by name' });
    }
});

app.get('/api/restaurants/:restaurantId', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      console.log(`Fetching restaurant with ID: ${restaurantId}`);
      
      // Attempt to fetch the restaurant with error handling for schema issues
      let restaurant;
      try {
        restaurant = await storage.getRestaurant(restaurantId);
        console.log(`Restaurant ${restaurantId} fetched successfully:`, restaurant);
      } catch (fetchError) {
        console.error(`Error in first restaurant fetch attempt for ID ${restaurantId}:`, fetchError);
        
        // Fallback: Try to execute a direct SQL query to get basic restaurant data
        try {
          const { pool } = await import('./db');
          const result = await pool.query('SELECT id, user_id, name, description, cuisine, logo_url, banner_url FROM restaurants WHERE id = $1', [restaurantId]);
          
          if (result.rows.length > 0) {
            const row = result.rows[0];
            // Map results to match our expected schema
            restaurant = {
              id: row.id,
              userId: row.user_id,
              name: row.name,
              description: row.description,
              cuisine: row.cuisine,
              logoUrl: row.logo_url,
              bannerUrl: row.banner_url,
              bannerUrls: [],  // Default empty array since column may be missing
              themeSettings: {
                backgroundColor: "#ffffff",
                textColor: "#000000",
                headerColor: "#f5f5f5",
                accentColor: "#4f46e5",
                fontFamily: "Inter, sans-serif",
                menuItemColor: "#333333",
                menuDescriptionColor: "#666666",
                menuPriceColor: "#111111"
              },
              tags: []  // Default empty array for tags
            };
            console.log(`Restaurant ${restaurantId} fetched with fallback method:`, restaurant);
          }
        } catch (fallbackError) {
          console.error(`Error in fallback restaurant fetch for ID ${restaurantId}:`, fallbackError);
        }
      }
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: 'Server error', details: String(error) });
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
      const userId = (req.user as any).id;
      console.log(`Processing logo upload for restaurant ID: ${req.params.restaurantId}, User ID: ${userId}`);
      
      if (!req.file) {
        console.warn(`Logo upload attempt with no file for restaurant ${req.params.restaurantId}`);
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      console.log(`Logo received: ${req.file.filename}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);
      
      const restaurantId = parseInt(req.params.restaurantId);
      
      // Original file path in temporary local storage
      const originalFilePath = path.join(process.cwd(), 'uploads', req.file.filename);
      
      // Test file access immediately after upload to verify it exists
      if (!fs.existsSync(originalFilePath)) {
        console.error(`WARNING: Logo file should exist but was not found at: ${originalFilePath}`);
        return res.status(500).json({ message: 'File not found after upload' });
      }
      
      console.log(`Processing logo for local storage for restaurant ID: ${restaurantId}`);
      
      let logoUrl;
      let finalFilePath = originalFilePath;
      let finalFileName = req.file.filename;
      
      try {
        // Process and compress the logo image to appropriate dimensions and quality
        const processedFilePath = await processLogoImage(originalFilePath);
        
        if (fs.existsSync(processedFilePath)) {
          finalFilePath = processedFilePath;
          finalFileName = path.basename(processedFilePath);
          
          // Delete the original file if it's different from the processed one
          if (processedFilePath !== originalFilePath && fs.existsSync(originalFilePath)) {
            fs.unlinkSync(originalFilePath);
            console.log(`Deleted original file after successful processing: ${originalFilePath}`);
          }
        }
        
        // Use local URL for the logo
        logoUrl = `/uploads/${finalFileName}`;
        console.log(`Processed and stored logo locally: ${logoUrl}`);
      } catch (processingError) {
        // If processing fails, use the original file
        console.error(`Logo image processing failed, using original image: ${processingError}`);
        logoUrl = `/uploads/${req.file.filename}`;
      }
      
      // Update restaurant with new logo URL
      const restaurant = await storage.getRestaurant(restaurantId);
      if (restaurant?.logoUrl) {
        console.log(`Restaurant ${restaurantId} already had logo: ${restaurant.logoUrl}, replacing with: ${logoUrl}`);
      }
      
      const updatedRestaurant = await storage.updateRestaurant(restaurantId, { logoUrl });
      if (!updatedRestaurant) {
        console.error(`Failed to update restaurant ${restaurantId} with new logo URL`);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Create a file upload record in the database
      const fileUpload = await storage.createFileUpload({
        userId,
        restaurantId,
        originalFilename: req.file.originalname,
        storedFilename: path.basename(logoUrl),
        filePath: '',  // We don't need local path when using ImageKit
        fileUrl: logoUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        status: 'active',
        fileCategory: 'logo',
        uploadedAt: new Date(),
        metadata: {
          provider: logoUrl.includes('ik.imagekit.io') ? 'imagekit' : 'local',
          optimized: true
        }
      });
      
      console.log(`Restaurant ${restaurantId} logo successfully updated to: ${logoUrl}, file record ID: ${fileUpload.id}`);
      res.json({ 
        logoUrl, 
        success: true,
        fileDetails: {
          name: path.basename(logoUrl),
          size: req.file.size,
          type: req.file.mimetype,
          provider: logoUrl.includes('ik.imagekit.io') ? 'imagekit' : 'local'
        },
        fileUpload
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Error uploading logo', error: errorMsg });
    }
  });
  
  // Restaurant banner upload route
  app.post('/api/restaurants/:restaurantId/upload-banner', isAuthenticated, isRestaurantOwner, upload.single('image'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      console.log(`Processing banner upload for restaurant ID: ${req.params.restaurantId}, User ID: ${userId}`);
      
      if (!req.file) {
        console.warn(`Banner upload attempt with no file for restaurant ${req.params.restaurantId}`);
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      console.log(`Banner uploaded successfully: ${req.file.filename}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);
      
      const restaurantId = parseInt(req.params.restaurantId);
      
      // Original file path
      const originalFilePath = path.join(process.cwd(), 'uploads', req.file.filename);
      
      // Test file access immediately after upload to verify it exists
      if (!fs.existsSync(originalFilePath)) {
        console.error(`WARNING: Banner file should exist but was not found at: ${originalFilePath}`);
        return res.status(500).json({ message: 'File not found after upload' });
      }
      
      console.log(`Confirmed banner file exists at: ${originalFilePath}, now processing for optimization`);
      
      // Process and compress the image
      let finalFilePath = originalFilePath;
      let finalFileName = req.file.filename;
      
      try {
        // Process and compress the banner image to max 200KB and appropriate dimensions
        const processedFilePath = await processBannerImage(originalFilePath);
        
        // Check if processing was successful
        if (fs.existsSync(processedFilePath)) {
          // Get the processed file stats
          const processedStats = fs.statSync(processedFilePath);
          console.log(`Processed banner stats - Size: ${processedStats.size} bytes, Path: ${processedFilePath}`);
          
          // Update the filename and path to use the processed version
          finalFilePath = processedFilePath;
          finalFileName = path.basename(processedFilePath);
          
          // Delete the original file if it's different from the processed one
          if (processedFilePath !== originalFilePath && fs.existsSync(originalFilePath)) {
            fs.unlinkSync(originalFilePath);
            console.log(`Deleted original banner file after successful processing: ${originalFilePath}`);
          }
        }
      } catch (processingError) {
        // Log error but continue with original file if processing fails
        console.error(`Banner image processing failed, using original image: ${processingError}`);
      }
      
      // Set the correct banner URL to use (either original or processed)
      const bannerUrl = `/uploads/${finalFileName}`;
      console.log(`Using banner URL: ${bannerUrl}`);
      
      // Get the restaurant and its current banner URLs
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        console.error(`Restaurant ${restaurantId} not found`);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Initialize bannerUrls array from existing data or create new
      let bannerUrls: string[] = [];
      
      // If restaurant has bannerUrls property and it's an array, use it
      if (restaurant.bannerUrls && Array.isArray(restaurant.bannerUrls)) {
        bannerUrls = [...restaurant.bannerUrls];
      } 
      // Otherwise, if there's a legacy single bannerUrl, use that as the first item
      else if (restaurant.bannerUrl) {
        bannerUrls = [restaurant.bannerUrl];
      }
      
      // Add the new banner URL to the array
      bannerUrls.push(bannerUrl);
      
      console.log(`Updating restaurant ${restaurantId} with banner URLs:`, bannerUrls);
      
      // Update restaurant with both single bannerUrl (for backward compatibility) 
      // and the array of bannerUrls
      const updatedRestaurant = await storage.updateRestaurant(restaurantId, { 
        bannerUrl,  // Keep the legacy field updated with the newest image
        bannerUrls  // Update the array of all banner URLs
      });
      
      if (!updatedRestaurant) {
        console.error(`Failed to update restaurant ${restaurantId} with new banner URLs`);
        return res.status(404).json({ message: 'Failed to update restaurant' });
      }
      
      console.log(`Restaurant ${restaurantId} banners successfully updated, latest: ${bannerUrl}`);
      
      // Get final file stats for the response
      const stats = fs.statSync(finalFilePath);
      
      // Create a file upload record in the database
      const fileUpload = await storage.createFileUpload({
        userId,
        restaurantId,
        originalFilename: req.file.originalname,
        storedFilename: finalFileName,
        filePath: finalFilePath,
        fileUrl: bannerUrl,
        fileType: req.file.mimetype,
        fileSize: stats.size,
        status: 'active',
        fileCategory: 'banner',
        uploadedAt: new Date(),
        metadata: {
          compressed: finalFilePath !== originalFilePath,
          bannerIndex: bannerUrls.length - 1 // Store the index of this banner in the array
        }
      });
      
      console.log(`Restaurant ${restaurantId} banner file record created with ID: ${fileUpload.id}`);
      
      res.json({ 
        bannerUrl,         // Return the single URL for backward compatibility
        bannerUrls,        // Return the full array of banner URLs
        success: true,
        fileDetails: {
          name: finalFileName,
          size: stats.size,
          type: req.file.mimetype,
          compressed: finalFilePath !== originalFilePath
        },
        fileUpload
      });
    } catch (error) {
      console.error('Error uploading banner:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Error uploading banner', error: errorMsg });
    }
  });
  
  // Route for deleting a restaurant banner
  app.post('/api/restaurants/:restaurantId/delete-banner', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const { bannerUrl, bannerIndex } = req.body;
      const userId = (req.user as any).id;
      
      console.log(`Processing banner deletion for restaurant ID: ${restaurantId}, User ID: ${userId}, Banner URL: ${bannerUrl}, Index: ${bannerIndex}`);
      
      if (!bannerUrl) {
        console.error('No banner URL provided for deletion');
        return res.status(400).json({ message: 'Banner URL is required' });
      }
      
      // Get the restaurant
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        console.error(`Restaurant ${restaurantId} not found for banner deletion`);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Check if restaurant has banner URLs
      if (!restaurant.bannerUrls || !Array.isArray(restaurant.bannerUrls) || restaurant.bannerUrls.length === 0) {
        console.error(`Restaurant ${restaurantId} has no banner URLs`);
        return res.status(400).json({ message: 'Restaurant has no banner images' });
      }
      
      // Check if we're trying to delete the only banner
      if (restaurant.bannerUrls.length <= 1) {
        console.error(`Cannot delete the only banner for restaurant ${restaurantId}`);
        return res.status(400).json({ message: 'Cannot delete the only banner image' });
      }
      
      // Check if the banner URL exists in the array
      const bannerUrlIndex = typeof bannerIndex === 'number' 
        ? bannerIndex 
        : restaurant.bannerUrls.findIndex(url => url === bannerUrl);
        
      if (bannerUrlIndex === -1) {
        console.error(`Banner URL ${bannerUrl} not found in restaurant ${restaurantId}`);
        return res.status(404).json({ message: 'Banner URL not found' });
      }
      
      console.log(`Found banner at index ${bannerUrlIndex} for restaurant ${restaurantId}`);
      
      // Get the filename from the URL
      const urlParts = bannerUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Create the file path
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      // First check if the file exists
      const fileExists = fs.existsSync(filePath);
      console.log(`Banner file ${filePath} exists: ${fileExists}`);
      
      // Delete the file if it exists
      if (fileExists) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted banner file: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting banner file: ${err}`);
          // Continue with the process even if the file delete fails
        }
      }
      
      // Remove the banner URL from the array
      const updatedBannerUrls = [...restaurant.bannerUrls];
      updatedBannerUrls.splice(bannerUrlIndex, 1);
      
      // Set new default banner URL to the first in the array
      const newBannerUrl = updatedBannerUrls[0];
      
      console.log(`Updating restaurant ${restaurantId} with new banner URLs after deletion:`, updatedBannerUrls);
      
      // Update the restaurant with the new banner URLs
      const updatedRestaurant = await storage.updateRestaurant(restaurantId, {
        bannerUrl: newBannerUrl, // Update the legacy field with the new default
        bannerUrls: updatedBannerUrls,
        themeSettings: restaurant.themeSettings // Preserve theme settings
      });
      
      if (!updatedRestaurant) {
        console.error(`Failed to update restaurant ${restaurantId} after banner deletion`);
        return res.status(500).json({ message: 'Failed to update restaurant' });
      }
      
      console.log(`Successfully deleted banner for restaurant ${restaurantId}`);
      
      // Try to update the file upload record if it exists
      try {
        // Find the file upload record based on the URL
        const fileUploads = await storage.getFileUploadsByRestaurantId(restaurantId);
        const fileUpload = fileUploads.find(upload => upload.fileUrl === bannerUrl);
        
        if (fileUpload) {
          // Update the file status to 'deleted'
          await storage.updateFileUpload(fileUpload.id, {
            status: 'deleted'
          });
          console.log(`Updated file upload record ${fileUpload.id} to deleted status`);
        } else {
          console.log(`No file upload record found for banner URL: ${bannerUrl}`);
        }
      } catch (err) {
        console.error(`Error updating file upload record: ${err}`);
        // Continue with the process even if the record update fails
      }
      
      res.json({
        success: true,
        message: 'Banner deleted successfully',
        newBannerUrl,
        bannerUrls: updatedBannerUrls
      });
    } catch (error) {
      console.error('Error deleting banner:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Error deleting banner', error: errorMsg });
    }
  });

  // Track menu item clicks/views for analytics
  app.post('/api/menu-items/:itemId/track-click', async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      await storage.incrementMenuItemClicks(itemId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking menu item click:', error);
      res.status(500).json({ message: 'Failed to track click' });
    }
  });

  // Get menu item analytics for restaurant owner
  app.get('/api/restaurants/:restaurantId/menu-analytics', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const analytics = await storage.getMenuItemAnalytics(restaurantId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching menu analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
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
      const userId = (req.user as any).id;
      console.log(`Processing general image upload request from user ID: ${userId}`);
      
      // Check if the user is trying to upload a file
      if (!req.file) {
        console.warn('General upload attempt with no file included');
        return res.status(400).json({ 
          message: 'No file uploaded',
          success: false,
          code: 'MISSING_FILE'
        });
      }
      
      // Validate file type
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(req.file.mimetype)) {
        console.warn(`Invalid file type uploaded: ${req.file.mimetype}`);
        
        // Try to clean up the invalid file
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Removed invalid file: ${req.file.path}`);
        } catch (cleanupError) {
          console.error(`Failed to remove invalid file: ${cleanupError}`);
        }
        
        return res.status(400).json({
          message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
          success: false,
          code: 'INVALID_FILE_TYPE'
        });
      }
      
      // Validate file size (max 1MB)
      const maxSize = 1 * 1024 * 1024; // 1MB in bytes
      if (req.file.size > maxSize) {
        console.warn(`File too large: ${req.file.size} bytes`);
        
        // Try to clean up the oversized file
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Removed oversized file: ${req.file.path}`);
        } catch (cleanupError) {
          console.error(`Failed to remove oversized file: ${cleanupError}`);
        }
        
        return res.status(400).json({
          message: 'File too large. Maximum size is 1MB.',
          success: false,
          code: 'FILE_TOO_LARGE'
        });
      }
      
      console.log(`File uploaded successfully: ${req.file.filename}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);
      
      // Original file path
      const originalFilePath = path.join(process.cwd(), 'uploads', req.file.filename);
      
      // Test file access immediately after upload to verify it exists
      if (!fs.existsSync(originalFilePath)) {
        console.error(`WARNING: File should exist but was not found at: ${originalFilePath}`);
        return res.status(500).json({
          message: 'File upload was processed but the file could not be found on the server.',
          success: false,
          code: 'FILE_NOT_FOUND'
        });
      }
      
      console.log(`Confirmed file exists at: ${originalFilePath}, applying smart compression`);
      
      let imageUrl;
      let finalFilePath = originalFilePath;
      let finalFileName = req.file.filename;
      
      try {
        // Apply smart compression to achieve 70-100KB target size
        const compressedFilePath = await compressImageSmart(originalFilePath);
        imageUrl = `/uploads/${path.basename(compressedFilePath)}`;
        finalFilePath = compressedFilePath;
        finalFileName = path.basename(compressedFilePath);
        console.log(`✅ Smart compression completed: ${imageUrl}`);
        
        // Delete the original file since we have the compressed version
        if (compressedFilePath !== originalFilePath && fs.existsSync(originalFilePath)) {
          fs.unlinkSync(originalFilePath);
          console.log(`🗑️ Deleted original file after compression: ${originalFilePath}`);
        }
      } catch (compressionError) {
        // If smart compression fails, try standard processing as fallback
        console.error(`⚠️ Smart compression failed, trying standard processing: ${compressionError}`);
        try {
          const { processMenuItemImage } = await import('./image-utils');
          const processedFilePath = await processMenuItemImage(originalFilePath);
          imageUrl = `/uploads/${path.basename(processedFilePath)}`;
          finalFilePath = processedFilePath;
          finalFileName = path.basename(processedFilePath);
          console.log(`📸 Standard processing completed as fallback: ${imageUrl}`);
          
          if (processedFilePath !== originalFilePath && fs.existsSync(originalFilePath)) {
            fs.unlinkSync(originalFilePath);
          }
        } catch (fallbackError) {
          // If both fail, use the original file
          console.error(`❌ Both compression methods failed, using original: ${fallbackError}`);
          imageUrl = `/uploads/${req.file.filename}`;
          finalFilePath = originalFilePath;
          finalFileName = req.file.filename;
        }
      }
      
      console.log(`Using image URL: ${imageUrl}`);
      
      // Get final file stats for the response
      const fileSize = fs.existsSync(finalFilePath) ? fs.statSync(finalFilePath).size : req.file.size;
      
      // Create a file upload record in the database
      const fileUpload = await storage.createFileUpload({
        userId,
        restaurantId: null, // Will be assigned when the menu item is created
        originalFilename: req.file.originalname,
        storedFilename: finalFileName,
        filePath: finalFilePath,
        fileUrl: imageUrl,
        fileType: req.file.mimetype,
        fileSize: fileSize,
        status: 'active',
        fileCategory: 'menu_item',
        uploadedAt: new Date(),
        metadata: {
          provider: 'local',
          compressed: true // We always optimize images
        }
      });
      
      console.log(`General menu item image successfully uploaded: ${imageUrl}, file record ID: ${fileUpload.id}`);
      
      // Always return url field for backward compatibility
      res.json({ 
        url: imageUrl,
        imageUrl, 
        success: true,
        fileDetails: {
          name: finalFileName,
          size: fileSize,
          type: req.file.mimetype,
          provider: imageUrl.includes('ik.imagekit.io') ? 'imagekit' : 'local'
        },
        fileUpload
      });
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: 'Error uploading image', 
        error: errorMsg,
        success: false,
        code: 'UPLOAD_ERROR'
      });
    }
  });

  // Menu item image upload route - for existing items
  app.post('/api/items/:itemId/upload-image', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      if (!req.file) {
        console.warn(`Upload attempt with no file included for menu item by user ${userId}`);
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Check image upload limits for free users
      const canUpload = await SubscriptionService.validateImageUpload(userId);
      if (!canUpload) {
        return res.status(403).json({ 
          message: 'Upload limit reached. Free users can upload maximum 5 menu item images. Upgrade to premium for unlimited uploads.' 
        });
      }
      
      const itemId = parseInt(req.params.itemId);
      console.log(`Processing image upload for menu item ID: ${itemId}, File: ${req.file.filename}, Size: ${req.file.size} bytes, User: ${userId}`);
      
      const item = await storage.getMenuItem(itemId);
      
      if (!item) {
        console.warn(`Upload rejected - menu item not found with ID: ${itemId}`);
        return res.status(404).json({ message: 'Item not found' });
      }
      
      const category = await storage.getMenuCategory(item.categoryId);
      if (!category) {
        console.warn(`Upload rejected - category not found for menu item ID: ${itemId}, Category ID: ${item.categoryId}`);
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant || restaurant.userId !== userId) {
        console.warn(`Upload rejected - access denied for user ID: ${userId}, Restaurant ID: ${category.restaurantId}`);
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Original file path
      const originalFilePath = path.join(process.cwd(), 'uploads', req.file.filename);
      
      // Test file access immediately after upload to verify it exists
      if (!fs.existsSync(originalFilePath)) {
        console.error(`WARNING: File should exist but was not found at: ${originalFilePath}`);
        return res.status(500).json({ message: 'File not found after upload' });
      }
      
      console.log(`Confirmed file exists at: ${originalFilePath}, now processing for local storage`);
      
      // Import our image processing util
      const { processMenuItemImage } = await import('./image-utils');
      
      let imageUrl;
      let finalFilePath = originalFilePath;
      let finalFileName = req.file.filename;
      
      try {
        // Process the image locally for optimization
        const processedFilePath = await processMenuItemImage(originalFilePath);
        imageUrl = `/uploads/${path.basename(processedFilePath)}`;
        finalFilePath = processedFilePath;
        finalFileName = path.basename(processedFilePath);
        console.log(`Processed and stored image locally: ${imageUrl}`);
        
        // Delete the original file if it's different from the processed one
        if (processedFilePath !== originalFilePath && fs.existsSync(originalFilePath)) {
          fs.unlinkSync(originalFilePath);
          console.log(`Deleted original file after successful processing: ${originalFilePath}`);
        }
      } catch (processingError) {
        // If processing fails, use the original file
        console.error(`Image processing failed, using original image: ${processingError}`);
        imageUrl = `/uploads/${req.file.filename}`;
        finalFilePath = originalFilePath;
        finalFileName = req.file.filename;
      }
      
      console.log(`Using image URL: ${imageUrl}`);
      
      // If item has an existing image, make note for debugging
      if (item.imageUrl) {
        console.log(`Menu item ${itemId} already had image: ${item.imageUrl}, replacing with: ${imageUrl}`);
      }
      
      // Update menu item with new image URL
      const updatedItem = await storage.updateMenuItem(itemId, { imageUrl });
      if (!updatedItem) {
        console.error(`Failed to update menu item ${itemId} with new image URL`);
        return res.status(404).json({ message: 'Item not found after upload' });
      }
      
      // Get final file stats for the response
      const stats = fs.statSync(finalFilePath);
      
      // Get the restaurant ID for this menu item through the category
      const restaurantId = category ? category.restaurantId : null;
      
      // Get final file stats for the response
      const fileSize = imageUrl.includes('ik.imagekit.io') 
        ? req.file.size  // Use original file size for ImageKit uploads
        : fs.existsSync(finalFilePath) ? fs.statSync(finalFilePath).size : req.file.size;
      
      // Create a file upload record in the database
      const fileUpload = await storage.createFileUpload({
        userId,
        restaurantId,
        originalFilename: req.file.originalname,
        storedFilename: finalFileName,
        filePath: finalFilePath, // Empty path for ImageKit uploads
        fileUrl: imageUrl,
        fileType: req.file.mimetype,
        fileSize: fileSize,
        status: 'active',
        fileCategory: 'menu_item',
        uploadedAt: new Date(),
        metadata: {
          provider: imageUrl.includes('ik.imagekit.io') ? 'imagekit' : 'local',
          compressed: true, // We always optimize images
          menuItemId: itemId,
          menuItemName: item.name
        }
      });
      
      console.log(`Menu item ${itemId} successfully updated with new image URL: ${imageUrl}, file record ID: ${fileUpload.id}`);
      res.json({ 
        imageUrl, 
        success: true,
        fileDetails: {
          name: finalFileName,
          size: fileSize,
          type: req.file.mimetype,
          provider: imageUrl.includes('ik.imagekit.io') ? 'imagekit' : 'local'
        },
        fileUpload
      });
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Error uploading image', error: errorMsg });
    }
  });

  // Track menu item clicks
  app.post('/api/menu-items/:itemId/click', async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const item = await storage.getMenuItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const updatedItem = await storage.updateMenuItem(itemId, {
        clickCount: (item.clickCount || 0) + 1
      });

      res.json({ success: true, clicks: updatedItem.clickCount });
    } catch (error) {
      res.status(500).json({ message: 'Failed to record click' });
    }
  });

  // Get most clicked items for a restaurant
  app.get('/api/restaurants/:restaurantId/most-clicked', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const categories = await storage.getMenuCategoriesByRestaurantId(restaurantId);
      
      let allItems = [];
      for (const category of categories) {
        const items = await storage.getMenuItemsByCategoryId(category.id);
        allItems = [...allItems, ...items];
      }
      
      // Sort by click count
      const sortedItems = allItems.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
      
      res.json(sortedItems);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get most clicked items' });
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
      const restaurantIdParam = req.params.restaurantId;
      console.log(`Recording view for restaurant: ${restaurantIdParam}, source: ${req.body.source}`);
      
      let restaurantId: number = 0; // Initialize with a default value
      let restaurant;
      
      // Try to parse as number first (for backward compatibility)
      if (!isNaN(parseInt(restaurantIdParam))) {
        restaurantId = parseInt(restaurantIdParam);
        restaurant = await storage.getRestaurant(restaurantId);
      } else {
        // If not a number, try to get restaurant by name
        console.log(`Looking up restaurant ID for name: ${restaurantIdParam}`);
        const normalizedName = decodeURIComponent(restaurantIdParam).replace(/-/g, ' ');
        
        // Fetch all restaurants and find the one with matching name
        const allRestaurants = await storage.getAllRestaurants();
        restaurant = allRestaurants.find(
          (r) => r.name.toLowerCase() === normalizedName.toLowerCase()
        );
        
        if (restaurant) {
          restaurantId = restaurant.id;
        } else {
          return res.status(404).json({ message: 'Restaurant not found' });
        }
      }
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      const viewData = insertMenuViewSchema.parse({
        ...req.body,
        restaurantId: restaurantId
      });
      
      const view = await storage.createMenuView(viewData);
      
      // If the source is QR code, also increment the dedicated QR scan counter
      if (req.body.source === 'qr') {
        try {
          // Log details before incrementing
          console.log(`Attempting to increment QR scan count for restaurant ${restaurantId}`);
          
          // Get current restaurant to ensure we have the latest state
          const currentRestaurant = await storage.getRestaurant(restaurantId);
          if (!currentRestaurant) {
            console.error(`Restaurant ${restaurantId} not found when incrementing QR code scan count`);
          } else {
            // Ensure QR code scans has a valid value
            const currentScans = currentRestaurant.qrCodeScans || 0;
            
            const result = await storage.incrementQRCodeScans(restaurantId);
            
            if (result) {
              console.log(`QR code scan successfully recorded for restaurant ${restaurantId}. New count: ${result.qrCodeScans || 0}`);
            } else {
              console.error(`Failed to increment QR code scan count for restaurant ${restaurantId}`);
              
              // Fallback update if the main increment method failed
              try {
                const updatedRestaurant = await storage.updateRestaurant(restaurantId, { 
                  qrCodeScans: currentScans + 1 
                });
                if (updatedRestaurant) {
                  console.log(`QR code scan recorded using fallback method. New count: ${updatedRestaurant.qrCodeScans || 0}`);
                }
              } catch (fallbackError) {
                console.error(`Fallback QR code scan increment also failed: ${fallbackError}`);
              }
            }
          }
        } catch (qrError) {
          console.error(`Error incrementing QR code scan count: ${qrError}`);
          // Don't fail the whole request if just the QR counter fails
        }
      }
      
      console.log(`View recorded successfully for restaurant ${restaurantId}`);
      res.status(201).json(view);
    } catch (error) {
      console.error('Error recording menu view:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error', error: error.message });
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
  
  // Keep compatibility with both versions
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
      
      // Get the pricing plan from database
      const pricingPlan = await storage.getPricingPlan(planId);
      if (!pricingPlan) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      if (!pricingPlan.isActive) {
        return res.status(400).json({ message: 'Selected pricing plan is not currently available' });
      }
      
      // HARDCODED PRICES: Use fixed UI prices instead of database values
      // This ensures consistency with what's shown to users
      let priceInCents;
      
      if (planId === 1) {
        // Monthly plan price: $15.00 = 1500 cents
        priceInCents = 1500;
      } else if (planId === 2) {
        // Yearly plan price: $150.00 = 15000 cents
        priceInCents = 15000;
      } else {
        // Fallback price calculation - using a safe minimum value of 50 cents
        priceInCents = Math.max(50, Math.round(parseFloat(pricingPlan.price) * 100));
      }
      
      console.log(`Processing payment for plan ${planId}: ${priceInCents} cents`);
      
      // Create a payment intent with actual plan price from database
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: pricingPlan.currency?.toLowerCase() || 'usd',
        metadata: {
          userId: userId.toString(),
          planId: pricingPlan.id.toString(),
          planName: pricingPlan.name,
          planTier: pricingPlan.tier,
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
  
  // Create a Stripe subscription with path param - Legacy endpoint maintained for compatibility
  app.post('/api/create-subscription/:planId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      const planId = parseInt(req.params.planId, 10);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user already has an active subscription
      const existingSubscription = await storage.getActiveSubscriptionByUserId(userId);
      if (existingSubscription) {
        return res.status(400).json({ message: 'User already has an active subscription' });
      }
      
      // Get the pricing plan from database
      const pricingPlan = await storage.getPricingPlan(planId);
      if (!pricingPlan) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      if (!pricingPlan.isActive) {
        return res.status(400).json({ message: 'Selected pricing plan is not currently available' });
      }
      
      // HARDCODED PRICES: Use fixed UI prices instead of database values
      // This ensures consistency with what's shown to users
      let priceInCents;
      
      if (planId === 1) {
        // Monthly plan price: $15.00 = 1500 cents
        priceInCents = 1500;
      } else if (planId === 2) {
        // Yearly plan price: $150.00 = 15000 cents
        priceInCents = 15000;
      } else {
        // Fallback price calculation
        priceInCents = Math.max(50, Math.round(parseFloat(pricingPlan.price) * 100));
      }
      
      console.log(`Processing payment for plan ${planId}: ${priceInCents} cents`);
      
      // Create a payment intent with actual plan price from database
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: pricingPlan.currency?.toLowerCase() || 'usd',
        metadata: {
          userId: userId.toString(),
          planId: pricingPlan.id.toString(),
          planName: pricingPlan.name,
          planTier: pricingPlan.tier,
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
      const planId = parseInt(paymentIntent.metadata.planId);
      const planTier = paymentIntent.metadata.planTier;
      
      // Get plan details to set proper subscription duration
      const pricingPlan = await storage.getPricingPlan(planId);
      if (!pricingPlan) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      // Calculate end date based on billing period
      let endDate = new Date();
      if (pricingPlan.billingPeriod === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (pricingPlan.billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        // Default to monthly if not specified
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      const newSubscription = await storage.createSubscription({
        userId,
        tier: planTier || "premium",
        endDate,
        paymentMethod: "stripe",
        isActive: true
      });
      
      // Create payment record with accurate amount from payment intent
      await storage.createPayment({
        userId,
        subscriptionId: newSubscription.id,
        amount: (paymentIntent.amount / 100).toFixed(2), // Convert cents to dollars
        currency: paymentIntent.currency.toUpperCase(),
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
      
      // Get the dedicated QR code scan counter (separate from menu views)
      const restaurant = await storage.getRestaurant(restaurantId);
      const directQrScans = restaurant?.qrCodeScans || 0;
      
      // Calculate days active (in a real app, we would store a createdAt field)
      const daysActive = 7; // Hardcoded for demo purposes
      
      res.json({
        viewCount,
        qrScanCount,
        directQrScans,
        menuItemCount,
        daysActive
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // File upload management endpoints
  app.get('/api/restaurants/:restaurantId/uploads', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const category = req.query.category as string | undefined;
      
      let fileUploads;
      if (category) {
        // If a specific category is requested, filter by that category
        fileUploads = (await storage.getFileUploadsByRestaurantId(restaurantId))
          .filter(upload => upload.fileCategory === category);
      } else {
        // Otherwise get all uploads for this restaurant
        fileUploads = await storage.getFileUploadsByRestaurantId(restaurantId);
      }
      
      // Group the uploads by category for better organization
      const uploadsByCategory: Record<string, any[]> = {};
      
      fileUploads.forEach(upload => {
        const category = upload.fileCategory;
        if (!uploadsByCategory[category]) {
          uploadsByCategory[category] = [];
        }
        uploadsByCategory[category].push(upload);
      });
      
      res.json({
        total: fileUploads.length,
        uploads: fileUploads,
        uploadsByCategory
      });
    } catch (error) {
      console.error('Error fetching restaurant uploads:', error);
      res.status(500).json({ message: 'Failed to fetch uploads' });
    }
  });
  
  // Delete a file upload (check if user has permission)
  app.delete('/api/uploads/:uploadId', isAuthenticated, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const userId = (req.user as any).id;
      
      // Get the upload to check ownership
      const upload = await storage.getFileUpload(uploadId);
      
      if (!upload) {
        return res.status(404).json({ message: 'File upload not found' });
      }
      
      // Check if user owns this upload or is the owner of the restaurant
      if (upload.userId !== userId) {
        // If the user is not the direct owner of the upload, check if they own the restaurant
        if (upload.restaurantId) {
          const restaurant = await storage.getRestaurant(upload.restaurantId);
          if (!restaurant || restaurant.userId !== userId) {
            return res.status(403).json({ message: 'You do not have permission to delete this file' });
          }
        } else {
          return res.status(403).json({ message: 'You do not have permission to delete this file' });
        }
      }
      
      // If we're here, the user has permission to delete the file
      // First, try to delete the physical file
      try {
        if (upload.filePath && fs.existsSync(upload.filePath)) {
          fs.unlinkSync(upload.filePath);
          console.log(`Physical file deleted: ${upload.filePath}`);
        }
      } catch (fileError) {
        console.error(`Error deleting physical file: ${fileError}`);
        // Continue with database deletion even if physical file deletion fails
      }
      
      // Delete the record from the database
      const deleted = await storage.deleteFileUpload(uploadId);
      
      if (deleted) {
        console.log(`File upload with ID ${uploadId} deleted by user ${userId}`);
        return res.json({ success: true, message: 'File deleted successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to delete file record from database' });
      }
    } catch (error) {
      console.error('Error deleting file upload:', error);
      res.status(500).json({ message: 'Server error deleting file' });
    }
  });
  
  // Get all uploads for the current user (across all restaurants)
  app.get('/api/user/uploads', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const category = req.query.category as string | undefined;
      
      let fileUploads;
      if (category) {
        // If a specific category is requested, filter by that category
        fileUploads = (await storage.getFileUploadsByUserId(userId))
          .filter(upload => upload.fileCategory === category);
      } else {
        // Otherwise get all uploads for this user
        fileUploads = await storage.getFileUploadsByUserId(userId);
      }
      
      // Group by restaurant and category
      const uploadsByRestaurant: Record<number, any> = {};
      const uploadsByCategory: Record<string, any[]> = {};
      
      for (const upload of fileUploads) {
        // Group by restaurant
        const restaurantId = upload.restaurantId;
        if (restaurantId) {
          if (!uploadsByRestaurant[restaurantId]) {
            uploadsByRestaurant[restaurantId] = {
              restaurantId,
              uploads: [],
              categories: {}
            };
          }
          uploadsByRestaurant[restaurantId].uploads.push(upload);
          
          // Group within restaurant by category
          const category = upload.fileCategory;
          if (!uploadsByRestaurant[restaurantId].categories[category]) {
            uploadsByRestaurant[restaurantId].categories[category] = [];
          }
          uploadsByRestaurant[restaurantId].categories[category].push(upload);
        }
        
        // Group by category across all restaurants
        const category = upload.fileCategory;
        if (!uploadsByCategory[category]) {
          uploadsByCategory[category] = [];
        }
        uploadsByCategory[category].push(upload);
      }
      
      // Get restaurant names for better presentation
      const restaurantIds = Object.keys(uploadsByRestaurant).map(id => parseInt(id));
      const restaurantPromises = restaurantIds.map(id => storage.getRestaurant(id));
      const restaurants = await Promise.all(restaurantPromises);
      
      // Add restaurant info to the grouped data
      for (let i = 0; i < restaurantIds.length; i++) {
        const id = restaurantIds[i];
        const restaurant = restaurants[i];
        if (restaurant && uploadsByRestaurant[id]) {
          uploadsByRestaurant[id].restaurant = {
            id: restaurant.id,
            name: restaurant.name,
            logoUrl: restaurant.logoUrl
          };
        }
      }
      
      res.json({
        total: fileUploads.length,
        uploads: fileUploads,
        uploadsByCategory,
        uploadsByRestaurant
      });
    } catch (error) {
      console.error('Error fetching user uploads:', error);
      res.status(500).json({ message: 'Failed to fetch uploads' });
    }
  });

  // Get all menu data for a restaurant (for public view)
  app.get('/api/restaurants/:restaurantId/menu', async (req, res) => {
    try {
      const restaurantIdParam = req.params.restaurantId;
      let restaurantId: number = 0; // Initialize with a default value
      let restaurant;
      
      // Try to parse as number first (for backward compatibility)
      if (!isNaN(parseInt(restaurantIdParam))) {
        restaurantId = parseInt(restaurantIdParam);
        restaurant = await storage.getRestaurant(restaurantId);
      } else {
        // If not a number, try to get restaurant by name
        console.log(`Fetching menu for restaurant name: ${restaurantIdParam}`);
        const normalizedName = decodeURIComponent(restaurantIdParam).replace(/-/g, ' ');
        
        // Fetch all restaurants and find the one with matching name
        const allRestaurants = await storage.getAllRestaurants();
        restaurant = allRestaurants.find(
          (r) => r.name.toLowerCase() === normalizedName.toLowerCase()
        );
        
        if (restaurant) {
          restaurantId = restaurant.id;
        }
      }
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Get the restaurant owner's subscription tier
      let subscriptionTier = "free"; // Default tier
      let isPremiumRestaurant = false; // Track premium status separately
      
      try {
        // Fetch user to get their subscription tier
        if (restaurant.userId) {
          const restaurantOwner = await storage.getUser(restaurant.userId);
          
          if (restaurantOwner) {
            // Try to get the active subscription
            const ownerSubscription = await storage.getActiveSubscriptionByUserId(restaurant.userId);
            
            if (ownerSubscription && ownerSubscription.tier) {
              subscriptionTier = ownerSubscription.tier;
              isPremiumRestaurant = subscriptionTier === "premium";
            } else if (restaurantOwner.subscriptionTier) {
              // Fallback to user's subscription tier if stored there
              subscriptionTier = restaurantOwner.subscriptionTier;
              isPremiumRestaurant = subscriptionTier === "premium";
            }
            
            console.log(`Restaurant ${restaurantId} owner subscription status:`, {
              tier: subscriptionTier,
              isPremium: isPremiumRestaurant
            });
          }
        }
      } catch (subError) {
        console.error("Error fetching restaurant owner subscription:", subError);
        // Continue with default free tier if there's an error
      }
      
      // Add subscription tier to the restaurant object
      const restaurantWithSub = {
        ...restaurant,
        subscriptionTier,
        isPremium: isPremiumRestaurant
      };
      
      const categories = await storage.getMenuCategoriesByRestaurantId(restaurantId);
      
      const menu = await Promise.all(categories.map(async (category) => {
        const items = await storage.getMenuItemsByCategoryId(category.id);
        return {
          ...category,
          items
        };
      }));
      
      // Record a new view
      const viewSource = req.query.source as string || 'link';
      await storage.createMenuView({
        restaurantId,
        source: viewSource
      });
      
      // If this is a QR code scan, increment the counter
      if (viewSource === 'qr') {
        try {
          // Get current restaurant to ensure we have the latest state
          const currentRestaurant = await storage.getRestaurant(restaurantId);
          if (!currentRestaurant) {
            console.error(`Restaurant ${restaurantId} not found when incrementing QR code scan count`);
          } else {
            // Ensure QR code scans has a valid value
            const currentScans = currentRestaurant.qrCodeScans || 0;
            
            const result = await storage.incrementQRCodeScans(restaurantId);
            
            if (result) {
              console.log(`QR code scan successfully recorded for restaurant ${restaurantId}. New count: ${result.qrCodeScans || 0}`);
            } else {
              console.error(`Failed to increment QR code scan count for restaurant ${restaurantId}`);
              
              // Fallback update if the main increment method failed
              try {
                const updatedRestaurant = await storage.updateRestaurant(restaurantId, { 
                  qrCodeScans: currentScans + 1 
                });
                if (updatedRestaurant) {
                  console.log(`QR code scan recorded using fallback method. New count: ${updatedRestaurant.qrCodeScans || 0}`);
                }
              } catch (fallbackError) {
                console.error(`Fallback QR code scan increment also failed: ${fallbackError}`);
              }
            }
          }
        } catch (qrError) {
          console.error(`Error incrementing QR code scan count: ${qrError}`);
          // Don't fail the whole request if just the QR counter fails
        }
      }
      
      res.json({
        restaurant: restaurantWithSub,
        menu
      });
    } catch (error) {
      console.error("Error fetching restaurant menu:", error);
      res.status(500).json({ message: 'Server error', details: String(error) });
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
  
  // Dedicated endpoint for incrementing QR code scans
  app.post('/api/restaurants/:restaurantId/qr-scan', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      console.log(`DEDICATED QR SCAN ENDPOINT: Processing scan request for restaurant ID ${restaurantId}`);
      
      // Get the restaurant and current scan count
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        console.error(`DEDICATED QR SCAN ENDPOINT: Restaurant ${restaurantId} not found`);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Get current scan count and log it
      const currentScans = restaurant.qrCodeScans || 0;
      console.log(`DEDICATED QR SCAN ENDPOINT: Current scan count for restaurant ${restaurantId}: ${currentScans}`);
      
      // Try different methods to increment the counter
      let success = false;
      
      // Method 1: Use the dedicated incrementQRCodeScans method
      try {
        const result = await storage.incrementQRCodeScans(restaurantId);
        if (result && typeof result.qrCodeScans === 'number') {
          console.log(`DEDICATED QR SCAN ENDPOINT: Successfully incremented QR code scans to ${result.qrCodeScans}`);
          success = true;
          return res.status(200).json({ 
            success: true, 
            message: 'QR code scan recorded successfully', 
            previousCount: currentScans,
            newCount: result.qrCodeScans
          });
        }
      } catch (method1Error) {
        console.error(`DEDICATED QR SCAN ENDPOINT: Method 1 failed: ${method1Error}`);
      }
      
      // Method 2: Direct update via raw SQL as a fallback
      if (!success) {
        try {
          const { pool } = await import('./db');
          const result = await pool.query(
            'UPDATE restaurants SET qr_code_scans = $1 WHERE id = $2 RETURNING qr_code_scans',
            [currentScans + 1, restaurantId]
          );
          
          if (result.rows && result.rows.length > 0) {
            const newCount = result.rows[0].qr_code_scans;
            console.log(`DEDICATED QR SCAN ENDPOINT: Raw SQL update successful. New count: ${newCount}`);
            return res.status(200).json({ 
              success: true, 
              message: 'QR code scan recorded successfully using raw SQL', 
              previousCount: currentScans,
              newCount: newCount
            });
          }
        } catch (method2Error) {
          console.error(`DEDICATED QR SCAN ENDPOINT: Method 2 failed: ${method2Error}`);
        }
      }
      
      // If all methods failed
      console.error(`DEDICATED QR SCAN ENDPOINT: All increment methods failed for restaurant ${restaurantId}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to increment QR code scan count' 
      });
    } catch (error) {
      console.error(`DEDICATED QR SCAN ENDPOINT: Unexpected error: ${error}`);
      res.status(500).json({ message: 'Server error', details: String(error) });
    }
  });
  
  // Admin routes
  app.get('/api/admin/restaurants', isAuthenticated, isAdmin, async (req, res) => {
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
          ownerName: owner ? owner.fullName || owner.username : 'N/A',
          userEmail: owner ? owner.email : null,
          categoryCount: categories.length,
          menuItemCount: menuItems.length,
          viewCount: viewCount,
          lastVisitDate: lastVisitDate,
          ownerSubscriptionTier: ownerSubscriptionTier
        };
      }));
      
      res.json(enhancedRestaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
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
      
      // Check if the restaurant is premium - ONLY premium restaurants get feedback
      const restaurantOwner = await storage.getUser(restaurant.userId); // Use userId instead of ownerId
      // Check premium status from owner and restaurant settings
      let isPremium = false;
      
      // Check if owner is premium
      if (restaurantOwner && 
          (restaurantOwner.subscriptionTier === 'premium' || 
           restaurantOwner.username === 'Entoto Cloud')) {
        isPremium = true;
      }
      
      // Log restaurant premium status for debugging
      console.log('Restaurant premium check for feedback:', {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        ownerName: restaurantOwner?.username || 'unknown',
        ownerTier: restaurantOwner?.subscriptionTier || 'none',
        isEntotoCloud: restaurantOwner?.username === 'Entoto Cloud',
        isPremium
      });
      
      if (!isPremium) {
        return res.status(403).json({ 
          message: 'Feedback is only available for premium restaurants',
          isPremium: false 
        });
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

  // Registration analytics routes
  app.get('/api/admin/registration-analytics', isAdmin, async (req, res) => {
    try {
      // Get date range from query parameters or default to last 30 days
      const endDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      
      const startDateParam = req.query.startDate ? new Date(req.query.startDate as string) : defaultStartDate;
      const endDateParam = req.query.endDate ? new Date(req.query.endDate as string) : endDate;
      
      // Ensure valid dates
      const startDate = !isNaN(startDateParam.getTime()) ? startDateParam : defaultStartDate;
      const endDateWithTime = !isNaN(endDateParam.getTime()) ? endDateParam : endDate;
      // Set end date to end of day
      endDateWithTime.setHours(23, 59, 59, 999);
      
      // Get source filter if provided
      const source = req.query.source as string | undefined;
      
      try {
        // Get counts
        const totalRegistrationsInRange = await storage.countRegistrationsInDateRange(startDate, endDateWithTime);
        
        // Get counts by source if no specific source filter
        let registrationsBySource = {};
        if (!source) {
          const websiteCount = await storage.countRegistrationsBySource('website');
          const mobileCount = await storage.countRegistrationsBySource('mobile');
          const referralCount = await storage.countRegistrationsBySource('referral');
          const otherCount = await storage.countRegistrationsBySource('other');
          
          registrationsBySource = {
            website: websiteCount,
            mobile: mobileCount,
            referral: referralCount,
            other: otherCount
          };
        }
        
        res.json({
          totalRegistrationsInRange,
          registrationsBySource: source ? { [source]: await storage.countRegistrationsBySource(source) } : registrationsBySource,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDateWithTime.toISOString()
          }
        });
      } catch (analyticsError) {
        console.error('Error running analytics queries:', analyticsError);
        
        // Handle the specific case of missing tables with a more user-friendly message
        if (analyticsError.message && analyticsError.message.includes('relation "registration_analytics" does not exist')) {
          return res.status(503).json({ 
            message: 'Registration analytics are being set up. Please try again later or run database migrations.',
            error: 'TABLE_NOT_CREATED_YET',
            analytics: {
              totalRegistrationsInRange: 0,
              registrationsBySource: {
                website: 0,
                mobile: 0,
                referral: 0,
                other: 0
              },
              dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDateWithTime.toISOString()
              }
            }
          });
        }
        
        // For other errors, return a generic error
        return res.status(500).json({ message: 'Error processing analytics data' });
      }
    } catch (error) {
      console.error('Error fetching registration analytics:', error);
      res.status(500).json({ message: 'Failed to fetch registration analytics' });
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

      // Get registration analytics data for different time periods
      const now = new Date();
      
      // Time periods
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(now.getDate() - 1);
      
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setDate(now.getDate() - 30);
      
      const oneYearAgo = new Date(now);
      oneYearAgo.setDate(now.getDate() - 365);
      
      // Initialize registration stats
      const registrationStats = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0
      };
      
      const viewStats = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        total: 0
      };
      
      try {
        // Get registration analytics
        registrationStats.daily = await storage.countRegistrationsInDateRange(oneDayAgo, now);
        registrationStats.weekly = await storage.countRegistrationsInDateRange(oneWeekAgo, now);
        registrationStats.monthly = await storage.countRegistrationsInDateRange(oneMonthAgo, now);
        registrationStats.yearly = await storage.countRegistrationsInDateRange(oneYearAgo, now);
        
        // Get view analytics
        viewStats.daily = await storage.countMenuViewsInDateRange(oneDayAgo, now);
        viewStats.weekly = await storage.countMenuViewsInDateRange(oneWeekAgo, now);
        viewStats.monthly = await storage.countMenuViewsInDateRange(oneMonthAgo, now);
        viewStats.yearly = await storage.countMenuViewsInDateRange(oneYearAgo, now);
        viewStats.total = await storage.countTotalMenuViews();
      } catch (analyticsError) {
        console.error('Error fetching analytics data (table may not exist yet):', analyticsError);
        // Continue without analytics data if the table doesn't exist yet
      }
      
      res.json({
        totalUsers,
        activeUsers,
        freeUsers,
        paidUsers,
        recentUsers: sanitizedUsers,
        registrationStats,
        viewStats,
        registrationPeriod: {
          startDate: oneWeekAgo.toISOString(),
          endDate: now.toISOString()
        }
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
      const { subscriptionTier, duration } = req.body;
      
      console.log(`Admin subscription update request for user ${userId}:`, { subscriptionTier, duration });
      
      if (!['free', 'premium'].includes(subscriptionTier)) {
        return res.status(400).json({ message: 'Invalid subscription tier' });
      }
      
      if (subscriptionTier === 'premium' && !['1_month', '3_months', '6_months', '1_year'].includes(duration)) {
        return res.status(400).json({ message: 'Invalid premium duration' });
      }
      
      if (subscriptionTier === 'premium') {
        // Calculate dates for premium subscription
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        switch (duration) {
          case '1_month':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case '3_months':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
          case '6_months':
            endDate.setMonth(endDate.getMonth() + 6);
            break;
          case '1_year':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        }
        
        await storage.updateUserPremiumStatus(userId, {
          subscriptionTier: 'premium',
          premiumStartDate: startDate,
          premiumEndDate: endDate,
          premiumDuration: duration,
          notificationSent: false
        });
      } else {
        await storage.updateUserPremiumStatus(userId, {
          subscriptionTier: 'free',
          premiumStartDate: null,
          premiumEndDate: null,
          premiumDuration: null,
          notificationSent: false
        });
      }
      
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`Successfully updated user ${userId} subscription to ${subscriptionTier}`);
      
      // Exclude sensitive data
      const { password, resetPasswordToken, resetPasswordExpires, ...sanitizedUser } = updatedUser;
      
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Error updating user subscription:', error);
      res.status(500).json({ message: 'Failed to upgrade user. Please try again.' });
    }
  });

  // Admin route to upgrade user to premium with specified duration
  app.post('/api/admin/upgrade-user/:userId', isAuthenticated, async (req, res) => {
    try {
      console.log('Admin upgrade check - User:', req.user);
      console.log('Admin upgrade check - Is Admin:', req.user?.isAdmin);
      
      const adminUser = req.user as any;
      if (!adminUser || !adminUser.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const userId = parseInt(req.params.userId, 10);
      const { duration } = req.body; // '1_month', '3_months', '1_year'

      if (!duration || !['1_month', '3_months', '6_months', '1_year'].includes(duration)) {
        return res.status(400).json({ message: 'Invalid duration. Must be 1_month, 3_months, 6_months, or 1_year' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calculate end date based on duration
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      switch (duration) {
        case '1_month':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case '3_months':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case '6_months':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case '1_year':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      // Update user subscription using the correct method
      const updatedUser = await storage.updateUserPremiumStatus(userId, {
        subscriptionTier: 'premium',
        premiumStartDate: startDate,
        premiumEndDate: endDate,
        premiumDuration: duration,
        notificationSent: false
      });

      console.log(`Admin ${adminUser.username} upgraded user ${user.username} to premium for ${duration}`);

      res.json({
        message: 'User upgraded to premium successfully',
        user: updatedUser,
        subscription: {
          tier: 'premium',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          duration
        }
      });
    } catch (error) {
      console.error('Error upgrading user to premium:', error);
      res.status(500).json({ message: 'Error upgrading user to premium' });
    }
  });

  // Admin route to downgrade user from premium 
  app.post('/api/admin/downgrade-user/:userId', isAuthenticated, async (req, res) => {
    try {
      console.log('Admin downgrade check - User:', req.user);
      console.log('Admin downgrade check - Is Admin:', req.user?.isAdmin);
      
      const adminUser = req.user as any;
      if (!adminUser || !adminUser.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const userId = parseInt(req.params.userId, 10);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user subscription to free
      const updatedUser = await storage.updateUserPremiumStatus(userId, {
        subscriptionTier: 'free',
        premiumStartDate: null,
        premiumEndDate: null,
        premiumDuration: null,
        notificationSent: false
      });

      console.log(`Admin ${adminUser.username} downgraded user ${user.username} to free tier`);

      res.json({
        message: 'User downgraded to free tier successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error downgrading user:', error);
      res.status(500).json({ message: 'Error downgrading user' });
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
      // Only return active plans to the public endpoint
      const activePlans = plans.filter(plan => plan.isActive);
      res.json(activePlans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ message: 'Error loading pricing data' });
    }
  });
  
  // Get specific pricing plan by ID
  app.get('/api/pricing/:id', async (req, res) => {
    try {
      const planId = parseInt(req.params.id, 10);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      
      const plan = await storage.getPricingPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      // Only return active plans to public
      if (!plan.isActive) {
        return res.status(404).json({ message: 'Pricing plan not available' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error fetching pricing plan:', error);
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

  // Advertisement routes
  app.get('/api/admin/advertisements', isAdmin, async (req, res) => {
    try {
      const advertisements = await storage.getAdvertisements();
      res.json(advertisements);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      res.status(500).json({ message: 'Failed to fetch advertisements' });
    }
  });

  app.post('/api/admin/advertisements', isAdmin, async (req, res) => {
    try {
      // Add additional server-side validation for required fields
      if (!req.body.title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      
      // Log for debugging
      console.log('Creating advertisement with data:', {
        requestBody: req.body,
        user: req.user
      });
      
      // Process dates correctly
      let adData = { 
        ...req.body, 
        createdBy: (req.user as any).id
      };
      
      // Convert date strings to Date objects
      if (adData.startDate && typeof adData.startDate === 'string') {
        adData.startDate = new Date(adData.startDate);
      }
      
      if (adData.endDate && typeof adData.endDate === 'string') {
        adData.endDate = new Date(adData.endDate);
      }
      
      const newAd = await storage.createAdvertisement(adData);
      console.log('Advertisement created successfully:', newAd);
      res.status(201).json(newAd);
    } catch (error) {
      console.error('Error creating advertisement:', error);
      res.status(500).json({ message: 'Failed to create advertisement', error: String(error) });
    }
  });

  app.patch('/api/admin/advertisements/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      let adData = { ...req.body };
      
      // Process dates correctly
      if (adData.startDate && typeof adData.startDate === 'string') {
        adData.startDate = new Date(adData.startDate);
      }
      
      if (adData.endDate && typeof adData.endDate === 'string') {
        adData.endDate = new Date(adData.endDate);
      }
      
      const updatedAd = await storage.updateAdvertisement(parseInt(id), adData);
      if (!updatedAd) {
        return res.status(404).json({ message: 'Advertisement not found' });
      }
      res.json(updatedAd);
    } catch (error) {
      console.error('Error updating advertisement:', error);
      res.status(500).json({ message: 'Failed to update advertisement' });
    }
  });

  app.delete('/api/admin/advertisements/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdvertisement(parseInt(id));
      res.json({ message: 'Advertisement deleted successfully' });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      res.status(500).json({ message: 'Failed to delete advertisement' });
    }
  });

  // Customer-facing advertisement API
  app.get('/api/advertisements', async (req, res) => {
    try {
      const { position, restaurantId } = req.query;
      if (!position) {
        return res.status(400).json({ message: 'Position parameter is required' });
      }
      
      // Check if this is for a premium restaurant
      if (restaurantId) {
        try {
          const restaurant = await storage.getRestaurant(parseInt(restaurantId as string));
          
          if (restaurant) {
            // Check restaurant owner's subscription
            const ownerSubscription = await storage.getActiveSubscriptionByUserId(restaurant.userId);
            
            // If owner has premium subscription, don't show ads
            if (ownerSubscription && ownerSubscription.tier === "premium") {
              console.log(`Restaurant ${restaurantId} has premium subscription, not serving ads`);
              return res.json(null);
            }
          }
        } catch (error) {
          console.error("Error checking restaurant subscription:", error);
          // Continue to serve ads on error
        }
      }
      
      // Get a single active advertisement for the specified position
      const advertisement = await storage.getActiveAdvertisementByPosition(position as string);
      res.json(advertisement);
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      res.status(500).json({ message: 'Failed to fetch advertisement' });
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
  
  // Diagnostic endpoint to check file uploads directory
  app.get('/api/system/uploads-diagnostic', async (req, res) => {
    console.log('Running uploads directory diagnostic check');
    try {
      const results = {
        uploadsDirectory: {
          exists: false,
          isDirectory: false,
          writeable: false,
          stats: null as any,
          files: [] as string[],
          recentFiles: [] as any[],
        },
        serverInfo: {
          cwd: process.cwd(),
          tmpdir: os.tmpdir(),
          platform: process.platform,
          nodeVersion: process.version,
          requestUrl: req.protocol + '://' + req.get('host')
        }
      };
      
      const uploadsDir = path.join(process.cwd(), 'uploads');
      console.log(`Checking uploads directory at: ${uploadsDir}`);
      
      // Check if directory exists
      if (fs.existsSync(uploadsDir)) {
        results.uploadsDirectory.exists = true;
        
        try {
          const stats = fs.statSync(uploadsDir);
          results.uploadsDirectory.isDirectory = stats.isDirectory();
          results.uploadsDirectory.stats = {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            permissions: stats.mode.toString(8),
          };
          
          // Test write permission
          try {
            const testFile = path.join(uploadsDir, `test-${Date.now()}.txt`);
            fs.writeFileSync(testFile, 'Test write permission');
            fs.unlinkSync(testFile); // Clean up test file
            results.uploadsDirectory.writeable = true;
          } catch (writeErr) {
            console.error('Write permission test failed:', writeErr);
            results.uploadsDirectory.writeable = false;
          }
          
          // List files in directory
          const files = fs.readdirSync(uploadsDir);
          results.uploadsDirectory.files = files;
          
          // Get details of most recent files (up to 5)
          const fileDetails = files
            .map(file => {
              const filePath = path.join(uploadsDir, file);
              try {
                const fileStats = fs.statSync(filePath);
                // Create an HTTP accessible URL for this file
                const httpUrl = `/uploads/${file}`;
                const fileInfo = {
                  name: file,
                  size: fileStats.size,
                  created: fileStats.birthtime,
                  accessTime: fileStats.atime,
                  exists: true,
                  accessible: true,
                  path: filePath,
                  url: httpUrl,
                  fullUrl: req.protocol + '://' + req.get('host') + httpUrl
                };
                return fileInfo;
              } catch (err) {
                return {
                  name: file,
                  exists: false,
                  error: err instanceof Error ? err.message : 'Unknown error'
                };
              }
            })
            .sort((a, b) => {
              if (a.created && b.created) {
                return b.created.getTime() - a.created.getTime();
              }
              return 0;
            })
            .slice(0, 5);
            
          results.uploadsDirectory.recentFiles = fileDetails;
          
          // Add diagnostics on HTTP access
          const baseUrl = req.protocol + '://' + req.get('host');
          results.uploadsDirectory.httpAccessTest = {
            baseUrl,
            testUrl: baseUrl + '/uploads',
            testedAt: new Date().toISOString()
          };
          
          // Create a test file to verify HTTP access
          const testFileName = `http-test-${Date.now()}.txt`;
          const testFilePath = path.join(uploadsDir, testFileName);
          try {
            fs.writeFileSync(testFilePath, 'Diagnostic HTTP test file');
            results.uploadsDirectory.httpAccessTest.testFile = {
              path: testFilePath,
              url: `/uploads/${testFileName}`,
              fullUrl: baseUrl + `/uploads/${testFileName}`,
              created: new Date().toISOString()
            };
            // File will be automatically accessible via the /uploads route
          } catch (testErr) {
            console.error('Failed to create HTTP test file:', testErr);
            results.uploadsDirectory.httpAccessTest.testFileError = 
              testErr instanceof Error ? testErr.message : 'Unknown error';
          }
        } catch (statErr) {
          console.error('Error getting uploads directory stats:', statErr);
        }
      } else {
        console.log('Uploads directory does not exist');
        
        // Try to create it
        try {
          fs.mkdirSync(uploadsDir, { recursive: true });
          console.log(`Created uploads directory at: ${uploadsDir}`);
          results.uploadsDirectory.exists = true;
          results.uploadsDirectory.isDirectory = true;
          results.uploadsDirectory.writeable = true;
        } catch (mkdirErr) {
          console.error('Failed to create uploads directory:', mkdirErr);
        }
      }
      
      res.json(results);
      
      // Clean up the test file after response is sent
      setTimeout(() => {
        const testFilePath = path.join(uploadsDir, `http-test-${Date.now()}.txt`);
        if (fs.existsSync(testFilePath)) {
          try {
            fs.unlinkSync(testFilePath);
            console.log(`Removed HTTP test file: ${testFilePath}`);
          } catch (err) {
            console.error(`Failed to remove HTTP test file: ${err}`);
          }
        }
      }, 60000); // Keep the file around for a minute for testing
    } catch (error) {
      console.error('Error during upload diagnostic:', error);
      res.status(500).json({ 
        message: 'Error performing uploads diagnostic',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Image system diagnostic route
  app.get('/api/system/image-diagnostic', async (req, res) => {
    try {
      // Check placeholder SVGs
      const placeholderResults = await Promise.all([
        checkFile(path.join(process.cwd(), 'public', 'placeholder-image.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-image-dark.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-food.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-food-dark.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-banner.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-banner-dark.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-logo.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-logo-dark.svg'))
      ]);
      
      // Check uploads directory
      let uploadsInfo = {};
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const uploadsExists = fs.existsSync(uploadsDir);
        const uploadStats = uploadsExists ? fs.statSync(uploadsDir) : null;
        
        uploadsInfo = {
          exists: uploadsExists,
          isDirectory: uploadsExists && uploadStats?.isDirectory(),
          writeable: false,
          files: [],
          recentFiles: []
        };
        
        if (uploadsExists && uploadStats?.isDirectory()) {
          // Test write permissions
          try {
            const testFilePath = path.join(uploadsDir, `.test-${Date.now()}`);
            fs.writeFileSync(testFilePath, 'test');
            fs.unlinkSync(testFilePath);
            uploadsInfo.writeable = true;
          } catch (e) {
            uploadsInfo.writeable = false;
          }
          
          // Get file listing (limited to 100)
          try {
            const files = fs.readdirSync(uploadsDir);
            uploadsInfo.files = files.slice(0, 100);
            
            // Get 5 most recent files with details
            const fileDetails = files
              .map(file => {
                try {
                  const filePath = path.join(uploadsDir, file);
                  const stats = fs.statSync(filePath);
                  return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    accessTime: stats.atime,
                    exists: true,
                    accessible: true,
                    path: filePath,
                    url: `/uploads/${file}`,
                    fullUrl: `${req.protocol}://${req.get('host')}/uploads/${file}`
                  };
                } catch (e) {
                  return {
                    name: file,
                    exists: false,
                    error: e.message
                  };
                }
              })
              .filter(file => file.exists && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
              .sort((a, b) => {
                if (a.created && b.created) {
                  return b.created.getTime() - a.created.getTime();
                }
                return 0;
              })
              .slice(0, 5);
              
            uploadsInfo.recentFiles = fileDetails;
            
            // Test HTTP accessibility of recent files
            for (const file of fileDetails) {
              try {
                const url = `${req.protocol}://${req.get('host')}/uploads/${file.name}`;
                const response = await fetch(url, { method: 'HEAD' });
                file.httpAccessTest = {
                  url,
                  status: response.status,
                  ok: response.ok,
                  headers: Object.fromEntries(response.headers.entries())
                };
              } catch (e) {
                file.httpAccessTest = {
                  error: e.message
                };
              }
            }
          } catch (e) {
            uploadsInfo.fileListError = e.message;
          }
        }
      } catch (e) {
        uploadsInfo.error = e.message;
      }
      
      // Get server details
      const serverInfo = {
        hostname: req.hostname,
        protocol: req.protocol,
        headers: req.headers,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      };
      
      res.json({
        timestamp: new Date().toISOString(),
        placeholders: placeholderResults,
        uploads: uploadsInfo,
        server: serverInfo
      });
    } catch (error) {
      console.error('Error generating image diagnostics:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Helper function to check if a file exists and get its stats
  async function checkFile(filePath: string): Promise<any> {
    try {
      const exists = fs.existsSync(filePath);
      if (!exists) {
        return {
          path: filePath,
          exists: false,
          error: 'File does not exist'
        };
      }
      
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        filename: path.basename(filePath)
      };
    } catch (error) {
      return {
        path: filePath,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Ad settings API routes for admin control of advertisement positioning
  app.get('/api/admin/ad-settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAdSettings();
      if (!settings) {
        // Return default settings if none exist
        const defaultSettings = {
          id: 1,
          position: "bottom",
          isEnabled: true,
          description: "Where the advertisement will be displayed on the menu.",
          displayFrequency: 1,
          maxAdsPerPage: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      console.error('Error fetching ad settings:', error);
      res.status(500).json({ message: 'Failed to fetch ad settings' });
    }
  });

  app.put('/api/admin/ad-settings', isAdmin, async (req, res) => {
    try {
      const { position, isEnabled, displayFrequency, maxAdsPerPage } = req.body;

      // Validate input
      const validPositions = ['top', 'middle', 'bottom', 'sidebar'];
      if (position && !validPositions.includes(position)) {
        return res.status(400).json({ message: 'Invalid position. Must be one of: top, middle, bottom, sidebar' });
      }

      if (displayFrequency && (displayFrequency < 1 || displayFrequency > 20)) {
        return res.status(400).json({ message: 'Display frequency must be between 1 and 20' });
      }

      if (maxAdsPerPage && (maxAdsPerPage < 1 || maxAdsPerPage > 10)) {
        return res.status(400).json({ message: 'Max ads per page must be between 1 and 10' });
      }

      const updatedSettings = await storage.updateAdSettings({
        position,
        isEnabled,
        displayFrequency,
        maxAdsPerPage
      });

      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating ad settings:', error);
      res.status(500).json({ message: 'Failed to update ad settings' });
    }
  });

  // Menu item analytics API - track which items customers click most
  app.post('/api/menu-items/:id/track-click', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: 'Invalid menu item ID' });
      }

      await storage.incrementMenuItemClicks(itemId);
      res.json({ success: true, message: 'Click tracked successfully' });
    } catch (error) {
      console.error('Error tracking menu item click:', error);
      res.status(500).json({ message: 'Failed to track click' });
    }
  });

  app.get('/api/restaurants/:id/menu-analytics', isAuthenticated, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: 'Invalid restaurant ID' });
      }

      // Check if user owns this restaurant
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      // For admin users, allow access to any restaurant
      const user = req.user as any;
      if (!user.isAdmin && restaurant.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const analytics = await storage.getMenuItemAnalytics(restaurantId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching menu analytics:', error);
      res.status(500).json({ message: 'Failed to fetch menu analytics' });
    }
  });

  // Admin routes for managing homepage content
  const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = req.user as any;
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  };

  // Menu Examples Management Routes
  app.get('/api/admin/menu-examples', adminOnly, async (req, res) => {
    try {
      const examples = await storage.getMenuExamples();
      res.json(examples);
    } catch (error) {
      console.error('Error fetching menu examples:', error);
      res.status(500).json({ message: 'Failed to fetch menu examples' });
    }
  });

  app.post('/api/admin/menu-examples', adminOnly, async (req, res) => {
    try {
      const example = await storage.createMenuExample(req.body);
      res.status(201).json(example);
    } catch (error) {
      console.error('Error creating menu example:', error);
      res.status(500).json({ message: 'Failed to create menu example' });
    }
  });

  app.patch('/api/admin/menu-examples/:id', adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid example ID' });
      }
      
      const example = await storage.updateMenuExample(id, req.body);
      if (!example) {
        return res.status(404).json({ message: 'Menu example not found' });
      }
      
      res.json(example);
    } catch (error) {
      console.error('Error updating menu example:', error);
      res.status(500).json({ message: 'Failed to update menu example' });
    }
  });

  app.delete('/api/admin/menu-examples/:id', adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid example ID' });
      }
      
      await storage.deleteMenuExample(id);
      res.json({ message: 'Menu example deleted successfully' });
    } catch (error) {
      console.error('Error deleting menu example:', error);
      res.status(500).json({ message: 'Failed to delete menu example' });
    }
  });

  // Testimonials Management Routes
  app.get('/api/admin/testimonials', adminOnly, async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
  });

  app.post('/api/admin/testimonials', adminOnly, async (req, res) => {
    try {
      const testimonial = await storage.createTestimonial(req.body);
      res.status(201).json(testimonial);
    } catch (error) {
      console.error('Error creating testimonial:', error);
      res.status(500).json({ message: 'Failed to create testimonial' });
    }
  });

  app.patch('/api/admin/testimonials/:id', adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }
      
      const testimonial = await storage.updateTestimonial(id, req.body);
      if (!testimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }
      
      res.json(testimonial);
    } catch (error) {
      console.error('Error updating testimonial:', error);
      res.status(500).json({ message: 'Failed to update testimonial' });
    }
  });

  app.delete('/api/admin/testimonials/:id', adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }
      
      await storage.deleteTestimonial(id);
      res.json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      res.status(500).json({ message: 'Failed to delete testimonial' });
    }
  });

  // Public routes for homepage content
  app.get('/api/menu-examples', async (req, res) => {
    try {
      const examples = await storage.getActiveMenuExamples();
      res.json(examples);
    } catch (error) {
      console.error('Error fetching active menu examples:', error);
      res.status(500).json({ message: 'Failed to fetch menu examples' });
    }
  });

  app.get('/api/testimonials', async (req, res) => {
    try {
      const testimonials = await storage.getActiveTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching active testimonials:', error);
      res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}