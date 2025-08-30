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
  insertDietaryPreferencesSchema,
  insertWaiterCallSchema
} from "@shared/schema";
import { ObjectStorageService } from './objectStorage';
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
import axios from "axios";
import { promisify } from "util";
import { scrypt, timingSafeEqual } from "crypto";
import { processMenuItemImage, processBannerImage, processLogoImage } from './image-utils';
import { compressImageSmart } from './smart-image-compression';
import { processTelegramWebhook, handleTelegramPasswordReset } from './telegram-bot';

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

// Initialize Chapa Payment Gateway
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

if (!CHAPA_SECRET_KEY) {
  console.warn('⚠️ CHAPA_SECRET_KEY not provided - Payment functionality will be disabled');
}

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
          id: 5, 
          username: 'entotocloud', 
          password: 'cloud123',
          email: 'entotocloudrestaurant@gmail.com',
          phone: '251977816299',
          fullName: 'Entoto Cloud',
          isAdmin: false,
          subscriptionTier: 'premium',
          isActive: true,
          createdAt: new Date()
        },
        { 
          id: 11, 
          username: 'freleg', 
          password: 'freleg123',
          email: 'freleg@example.com',
          fullName: 'Free User',
          isAdmin: false,
          subscriptionTier: 'free',
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      console.log('Looking for user with identifier:', identifier);
      
      // Try to find user from database first
      let user;
      try {
        console.log('Calling storage.getUserByIdentifier...');
        user = await storage.getUserByIdentifier(identifier);
        console.log('storage.getUserByIdentifier returned:', user ? 'user found' : 'no user');
      } catch (error) {
        console.error('Error calling storage.getUserByIdentifier:', error);
        user = null;
      }
      
      if (user) {
        console.log('Database user found:', user.username, user.email, user.phone);
        console.log('Provided password:', password);
        console.log('Stored hash:', user.password);
        
        // Verify password against database user
        const isValidPassword = await comparePasswords(password, user.password);
        console.log('Password comparison result:', isValidPassword);
        
        if (isValidPassword) {
          console.log('Database user authenticated successfully');
          return done(null, user);
        } else {
          console.log('Database user found but password mismatch');
          return done(null, false, { message: 'Incorrect password.' });
        }
      }
      
      console.log('User not found in database, checking test users...');
      
      // Fallback to test users for development
      user = testUsers.find(u => 
        u.username.toLowerCase() === identifier.toLowerCase() || 
        u.email.toLowerCase() === identifier.toLowerCase() ||
        (u.phone && u.phone === identifier)
      );
      
      if (!user) {
        console.log('No test user found with that identifier');
      }
      
      if (!user) {
        console.log(`User not found with identifier: ${identifier}`);
        return done(null, false, { message: 'Incorrect username, email, or phone number.' });
      }

      console.log(`User found: ${user.username}, checking password...`);
      console.log(`Stored password: "${user.password}"`);
      console.log(`Provided password: "${password}"`);
      console.log(`Password match: ${user.password === password}`);
      
      // Direct password matching for test users (fallback)
      if (user && user.password === password) {
        console.log('Test user password matched successfully');
        return done(null, user);
      }
      
      console.log('Password validation failed');
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
  // Helper function to convert relative URLs to absolute URLs
  const makeAbsoluteUrl = (url: string | null, req: Request): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Already absolute
    }
    if (url.startsWith('/')) {
      // Convert relative URL to absolute
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return baseUrl + url;
    }
    return url;
  };

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
    // Improved caching for permanent images to reduce data usage
    const options = {
      root: uploadDir,
      dotfiles: 'deny' as const,
      headers: {
        'Cache-Control': 'public, max-age=86400, immutable', // Cache for 24 hours, immutable
        'X-Content-Type-Options': 'nosniff', // Security header
        'Access-Control-Allow-Origin': '*', // Allow cross-origin access
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
        'Cross-Origin-Resource-Policy': 'cross-origin' // Allow cross-origin resource sharing
      }
    };
    
    const fileName = req.path.substring(1); // Remove leading slash
    
    // Security check: prevent directory traversal but allow safe subdirectories
    if (!fileName || fileName.includes('..') || fileName.startsWith('/') || fileName.endsWith('/')) {
      console.warn(`Suspicious file path requested: ${fileName}`);
      return res.status(403).send('Forbidden');
    }
    
    // Allow only specific safe subdirectories for menu items, logos, and banners
    const allowedPaths = /^(menu-items|logos|banners)\/[^\/]+$|^[^\/]+$/;
    if (!allowedPaths.test(fileName)) {
      console.warn(`Unauthorized file path requested: ${fileName}`);
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
    try {
      const { identifier, password } = req.body;
      console.log(`Login attempt for identifier: ${identifier}`);
      
      // Try to find user by username, email, or phone number in the database first
      let user = await storage.getUserByIdentifier(identifier);
      
      // If not found in database, check test users
      if (!user) {
        console.log('User not found in database, checking test users...');
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
            id: 5, 
            username: 'entotocloud', 
            password: 'cloud123',
            email: 'entotocloudrestaurant@gmail.com',
            fullName: 'Entoto Cloud',
            isAdmin: false,
            subscriptionTier: 'premium',
            isActive: true,
            createdAt: new Date()
          },
          { 
            id: 11, 
            username: 'freleg', 
            password: 'freleg123',
            email: 'freleg@example.com',
            fullName: 'Free User',
            isAdmin: false,
            subscriptionTier: 'free',
            isActive: true,
            createdAt: new Date()
          }
        ];
        
        user = testUsers.find(u => 
          u.username.toLowerCase() === identifier.toLowerCase() || 
          u.email.toLowerCase() === identifier.toLowerCase() ||
          (u.phone && u.phone === identifier)
        );
        
        if (user) {
          console.log(`Found test user: ${user.username} (ID: ${user.id})`);
        } else {
          console.log('No test user found with that identifier');
        }
      }
      
      if (!user) {
        console.log(`Authentication failed: No user found with identifier "${identifier}"`);
        return res.status(401).json({ message: 'Invalid username/email or password' });
      }
      
      console.log(`User found: ${user.username}, checking password...`);
      
      // All users (including test users) now use bcrypt hashed passwords
      console.log(`Authenticating user ID ${user.id} with bcrypt`);
      const isPasswordValid = await comparePasswords(password, user.password);
      console.log(`Password validation result: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log('Password validation failed');
        return res.status(401).json({ message: 'Invalid username/email or password' });
      }
      
      // Check if user is active
      if (!user.isActive) {
        console.log('User account is inactive');
        return res.status(401).json({ message: 'Account is inactive' });
      }
      
      console.log('Password matched successfully');
      
      // Login the user via session
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session error during login:', loginErr);
          return res.status(500).json({ message: 'Error establishing session' });
        }
        
        console.log(`User ${user.username} (ID: ${user.id}) logged in successfully`);
        
        // Return user data without password
        const { password: _, resetPasswordToken, resetPasswordExpires, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
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
      const { username, email, fullName, phone } = req.body;
      
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
      
      // Check if phone already exists (if changing phone)
      if (phone && phone !== (req.user as any).phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Phone number already registered to another account' });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, {
        username,
        email,
        fullName,
        phone
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

  // Telegram Password Reset API
  app.post('/api/auth/telegram-reset', async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }
      
      const result = await handleTelegramPasswordReset(phoneNumber);
      
      if (result.success) {
        res.status(200).json({ 
          message: result.message,
          newPassword: result.newPassword
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('Telegram password reset error:', error);
      res.status(500).json({ message: 'Failed to process password reset' });
    }
  });

  // Telegram Bot Webhook
  app.post('/webhook/telegram', async (req, res) => {
    try {
      await processTelegramWebhook(req.body);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Subscription Status Endpoint
  app.get('/api/user/subscription-status', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get user details to check subscription tier
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user has an active subscription record
      const activeSubscription = await storage.getActiveSubscriptionByUserId(userId);
      
      // Count restaurants to enforce limits
      const restaurantCount = await storage.countRestaurantsByUserId(userId);
      
      // Determine tier from user's subscription_tier field OR active subscription
      const userTier = user.subscriptionTier || "free";
      const subscriptionTier = activeSubscription?.tier || "free";
      
      // Use the highest tier available (business > premium > free)
      let effectiveTier = "free";
      if (userTier === "business" || subscriptionTier === "business") {
        effectiveTier = "business";
      } else if (userTier === "premium" || subscriptionTier === "premium") {
        effectiveTier = "premium";
      }
      const isPaid = effectiveTier !== "free";
      
      // Determine expiration date
      let expiresAt = null;
      if (isPaid) {
        if (activeSubscription?.endDate) {
          // Use active subscription end date if available
          expiresAt = activeSubscription.endDate;
        } else if (userTier === "premium") {
          // For users with premium tier but no subscription record, 
          // provide a default expiration date (1 month from now)
          const defaultExpiration = new Date();
          defaultExpiration.setMonth(defaultExpiration.getMonth() + 1);
          expiresAt = defaultExpiration.toISOString();
        }
      }
      
      console.log(`Subscription status for user ${userId} (${user.username}): userTier=${userTier}, subscriptionTier=${subscriptionTier}, effectiveTier=${effectiveTier}, restaurantCount=${restaurantCount}, expiresAt=${expiresAt}`);
      
      // Automatically manage restaurant active status based on subscription
      const maxRestaurants = effectiveTier === "business" ? 10 : (effectiveTier === "premium" ? 3 : 1);
      await storage.manageRestaurantsBySubscription(userId, maxRestaurants);
      
      return res.json({
        tier: effectiveTier,
        isPaid: isPaid,
        maxRestaurants: maxRestaurants,
        currentRestaurants: restaurantCount,
        expiresAt: expiresAt
      });
    } catch (error) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // User image usage endpoint - for free plan restrictions (10 images limit)
  app.get('/api/user/image-usage', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const uploadedImages = await storage.getUserImageCount(userId);
      const maxImages = user.subscriptionTier === 'free' ? 10 : 100; // Free plan: 10 images only
      
      res.json({
        uploadedImages,
        maxImages,
        remainingImages: Math.max(0, maxImages - uploadedImages),
        subscriptionTier: user.subscriptionTier || 'free'
      });
    } catch (error) {
      console.error('Error fetching user image usage:', error);
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
      const restaurants = await storage.getRestaurantsByUserId(userId);
      console.log("Restaurants fetched successfully:", restaurants);
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
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Determine max restaurants based on user's subscription tier (Free plan restrictions)
      let maxRestaurants = 1; // Free tier default
      if (user.subscriptionTier === 'premium') {
        maxRestaurants = 2;
      } else if (user.subscriptionTier === 'business') {
        maxRestaurants = 3;
      }
      
      // Check if user has reached their limit (Free plan: 1 restaurant only)
      if (restaurantCount >= maxRestaurants) {
        return res.status(403).json({ 
          message: user.subscriptionTier === 'free' ? 'Free plan restaurant limit reached' : 'Restaurant limit reached',
          details: user.subscriptionTier === 'free' ? 'Free users are limited to 1 restaurant. Please upgrade to create more restaurants.' : 'Please upgrade to create more restaurants.',
          currentRestaurants: restaurantCount,
          maxRestaurants: maxRestaurants,
          upgradeRequired: true
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
      
      // Convert image URLs to absolute URLs before sending
      const restaurantWithAbsoluteUrls = {
        ...restaurant,
        logoUrl: makeAbsoluteUrl(restaurant.logoUrl, req),
        bannerUrl: makeAbsoluteUrl(restaurant.bannerUrl, req),
        bannerUrls: Array.isArray(restaurant.bannerUrls) 
          ? restaurant.bannerUrls.map(url => makeAbsoluteUrl(url, req))
          : restaurant.bannerUrls
      };
      
      res.json(restaurantWithAbsoluteUrls);
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

      // Check subscription tier and image limits for free users
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.subscriptionTier === 'free') {
        const imageCount = await storage.getUserImageCount(userId);
        if (imageCount >= 10) {
          return res.status(403).json({ 
            message: 'Free plan image limit reached',
            details: 'Free users are limited to 10 images. Please upgrade to continue uploading.',
            currentImages: imageCount,
            maxImages: 10,
            upgradeRequired: true
          });
        }
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
      
      try {
        // Save the image permanently to database storage
        const { PermanentImageHelpers } = await import('./permanent-image-service');
        const permanentFilename = await PermanentImageHelpers.saveLogoImage(
          originalFilePath, 
          userId, 
          restaurantId
        );
        
        // Use permanent image URL
        logoUrl = `/api/images/${permanentFilename}`;
        console.log(`Saved logo permanently to database: ${logoUrl}`);
        
        // Clean up temporary file
        if (fs.existsSync(originalFilePath)) {
          fs.unlinkSync(originalFilePath);
          console.log(`Cleaned up temporary file: ${originalFilePath}`);
        }
      } catch (processingError) {
        console.error(`Logo permanent storage failed: ${processingError}`);
        // Fallback to local storage if permanent storage fails
        logoUrl = `/uploads/${req.file.filename}`;
        console.log(`Fallback to local storage: ${logoUrl}`);
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

      // Check subscription tier and image limits for free users
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.subscriptionTier === 'free') {
        const imageCount = await storage.getUserImageCount(userId);
        if (imageCount >= 10) {
          return res.status(403).json({ 
            message: 'Free plan image limit reached',
            details: 'Free users are limited to 10 images. Please upgrade to continue uploading.',
            currentImages: imageCount,
            maxImages: 10,
            upgradeRequired: true
          });
        }
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
      
      // Save the image permanently to database storage
      let bannerUrl;
      
      try {
        const { PermanentImageHelpers } = await import('./permanent-image-service');
        const permanentFilename = await PermanentImageHelpers.saveBannerImage(
          originalFilePath, 
          userId, 
          restaurantId
        );
        
        // Use permanent image URL
        bannerUrl = `/api/images/${permanentFilename}`;
        console.log(`Saved banner permanently to database: ${bannerUrl}`);
        
        // Clean up temporary file
        if (fs.existsSync(originalFilePath)) {
          fs.unlinkSync(originalFilePath);
          console.log(`Cleaned up temporary file: ${originalFilePath}`);
        }
      } catch (processingError) {
        console.error(`Banner permanent storage failed: ${processingError}`);
        // Fallback to local storage if permanent storage fails
        bannerUrl = `/uploads/${req.file.filename}`;
        console.log(`Fallback to local storage: ${bannerUrl}`);
      }
      
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
      
      // Filter out empty/invalid URLs
      bannerUrls = bannerUrls.filter(url => 
        url && 
        url.trim() !== '' && 
        url !== 'null' && 
        url !== 'undefined' &&
        !url.includes('placeholder') &&
        !url.includes('fallback')
      );
      
      // Check maximum banner limit (3 banners max)
      if (bannerUrls.length >= 3) {
        console.warn(`Restaurant ${restaurantId} already has maximum banners (${bannerUrls.length})`);
        return res.status(400).json({ 
          message: 'Maximum number of banner images reached. You can upload up to 3 banner images. Please delete an existing banner before uploading a new one.',
          currentCount: bannerUrls.length,
          maxCount: 3
        });
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
      
      // Create a file upload record in the database
      const fileUpload = await storage.createFileUpload({
        userId,
        restaurantId,
        originalFilename: req.file.originalname,
        storedFilename: req.file.filename,
        filePath: originalFilePath,
        fileUrl: bannerUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        status: 'active',
        fileCategory: 'banner',
        uploadedAt: new Date(),
        metadata: {
          compressed: true, // Since we use permanent image storage compression
          bannerIndex: bannerUrls.length - 1 // Store the index of this banner in the array
        }
      });
      
      console.log(`Restaurant ${restaurantId} banner file record created with ID: ${fileUpload.id}`);
      
      res.json({ 
        bannerUrl,         // Return the single URL for backward compatibility
        bannerUrls,        // Return the full array of banner URLs
        success: true,
        fileDetails: {
          name: req.file.filename,
          size: req.file.size,
          type: req.file.mimetype,
          compressed: true // Since we use permanent image storage compression
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

  // Get restaurant statistics for dashboard
  app.get('/api/restaurants/:restaurantId/stats', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      console.log(`Fetching stats for restaurant ${restaurantId}`);
      
      const stats = await storage.getRestaurantStats(restaurantId);
      console.log(`Stats for restaurant ${restaurantId}:`, stats);
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching restaurant stats:', error);
      res.status(500).json({ message: 'Failed to fetch restaurant statistics' });
    }
  });

  // Get feedbacks for a restaurant
  app.get('/api/restaurants/:restaurantId/feedbacks', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      console.log(`Fetching feedbacks for restaurant ${restaurantId}`);
      
      const feedbacks = await storage.getFeedbacksByRestaurantId(restaurantId);
      console.log(`Found ${feedbacks.length} feedbacks for restaurant ${restaurantId}`);
      
      res.json(feedbacks);
    } catch (error) {
      console.error('Error fetching restaurant feedbacks:', error);
      res.status(500).json({ message: 'Failed to fetch feedbacks' });
    }
  });

  // CRITICAL: Combined menu endpoint for shared menu links
  app.get('/api/restaurants/:restaurantId/menu', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      console.log(`Fetching complete menu for restaurant ${restaurantId}`);
      
      // Get restaurant details
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Get categories and their items
      const categories = await storage.getMenuCategoriesByRestaurantId(restaurantId);
      const categoriesWithItems = await Promise.all(
        categories.map(async (category) => {
          const items = await storage.getMenuItemsByCategoryId(category.id);
          return {
            ...category,
            items
          };
        })
      );
      
      console.log(`Menu fetched successfully: ${categoriesWithItems.length} categories`);
      
      res.json({
        restaurant,
        menu: categoriesWithItems
      });
    } catch (error) {
      console.error('Error fetching complete menu:', error);
      res.status(500).json({ message: 'Server error fetching menu' });
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

  // Reorder categories
  app.put('/api/restaurants/:restaurantId/categories/reorder', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const { categoryOrders } = req.body;
      const restaurantId = parseInt(req.params.restaurantId);
      
      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({ message: 'Category orders must be an array' });
      }
      
      // Update each category's display order
      const updatePromises = categoryOrders.map(async ({ id, displayOrder }) => {
        return await storage.updateMenuCategory(id, { displayOrder });
      });
      
      await Promise.all(updatePromises);
      
      // Return updated categories
      const updatedCategories = await storage.getMenuCategoriesByRestaurantId(restaurantId);
      res.json(updatedCategories);
    } catch (error) {
      console.error("Error reordering categories:", error);
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
      const userId = (req.user as any).id;
      
      console.log(`🍽️ Creating menu item for category ${categoryId}, user ${userId}`);
      console.log(`📋 Request body:`, JSON.stringify(req.body, null, 2));
      
      const category = await storage.getMenuCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant || restaurant.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const itemData = insertMenuItemSchema.parse({
        ...req.body,
        categoryId
      });
      
      console.log(`✅ Parsed item data:`, JSON.stringify(itemData, null, 2));
      console.log(`🖼️ Image URL in parsed data: "${itemData.imageUrl}"`);
      
      const item = await storage.createMenuItem(itemData);
      
      console.log(`🎉 Created menu item:`, JSON.stringify(item, null, 2));
      console.log(`🖼️ Final image URL: "${item.imageUrl}"`);
      
      res.status(201).json(item);
    } catch (error) {
      console.error(`❌ Menu item creation error:`, error);
      if (error instanceof z.ZodError) {
        console.error(`❌ Validation errors:`, error.errors);
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

      // Check subscription tier and image limits for free users
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.subscriptionTier === 'free') {
        const imageCount = await storage.getUserImageCount(userId);
        if (imageCount >= 10) {
          return res.status(403).json({ 
            message: 'Free plan image limit reached',
            details: 'Free users are limited to 10 images. Please upgrade to continue uploading.',
            currentImages: imageCount,
            maxImages: 10,
            upgradeRequired: true
          });
        }
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
      
      try {
        // Save the image permanently to database storage
        const { PermanentImageHelpers } = await import('./permanent-image-service');
        const permanentFilename = await PermanentImageHelpers.saveMenuItemImage(
          originalFilePath, 
          userId, 
          null // No specific restaurant ID for general menu item uploads
        );
        
        // Use permanent image URL
        imageUrl = `/api/images/${permanentFilename}`;
        console.log(`Saved menu item image permanently to database: ${imageUrl}`);
        
        // Clean up temporary file
        if (fs.existsSync(originalFilePath)) {
          fs.unlinkSync(originalFilePath);
          console.log(`Cleaned up temporary file: ${originalFilePath}`);
        }
      } catch (processingError) {
        console.error(`Menu item permanent storage failed: ${processingError}`);
        // Fallback to local storage if permanent storage fails
        imageUrl = `/uploads/${req.file.filename}`;
      }
      
      console.log(`Using image URL: ${imageUrl}`);
      
      // Get final file stats for the response
      const fileSize = req.file.size;
      
      // Create a file upload record in the database
      const fileUpload = await storage.createFileUpload({
        userId,
        restaurantId: null, // Will be assigned when the menu item is created
        originalFilename: req.file.originalname,
        storedFilename: req.file.filename,
        filePath: req.file.path,
        fileUrl: imageUrl,
        fileType: req.file.mimetype,
        fileSize: fileSize,
        status: 'active',
        fileCategory: 'menu_item',
        uploadedAt: new Date(),
        metadata: {
          provider: 'permanent',
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
          name: req.file.filename,
          size: fileSize,
          type: req.file.mimetype,
          provider: imageUrl.includes('/api/images/') ? 'permanent' : 'local'
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
      
      try {
        // Save the image permanently to database storage
        const { PermanentImageHelpers } = await import('./permanent-image-service');
        const permanentFilename = await PermanentImageHelpers.saveMenuItemImage(
          originalFilePath, 
          userId, 
          category.restaurantId
        );
        
        // Use permanent image URL
        imageUrl = `/api/images/${permanentFilename}`;
        console.log(`Saved menu item image permanently to database: ${imageUrl}`);
        
        // Clean up temporary file
        if (fs.existsSync(originalFilePath)) {
          fs.unlinkSync(originalFilePath);
          console.log(`Cleaned up temporary file: ${originalFilePath}`);
        }
      } catch (processingError) {
        console.error(`Menu item permanent storage failed: ${processingError}`);
        // Fallback to local storage if permanent storage fails
        imageUrl = `/uploads/${req.file.filename}`;
      }
      
      console.log(`🖼️ Using image URL: ${imageUrl}`);
      
      // If item has an existing image, make note for debugging
      if (item.imageUrl) {
        console.log(`📸 Menu item ${itemId} already had image: ${item.imageUrl}, replacing with: ${imageUrl}`);
      }
      
      // Update menu item with new image URL
      const updatedItem = await storage.updateMenuItem(itemId, { imageUrl });
      if (!updatedItem) {
        console.error(`Failed to update menu item ${itemId} with new image URL`);
        return res.status(404).json({ message: 'Item not found after upload' });
      }
      
      // Get the restaurant ID for this menu item through the category
      const restaurantId = category ? category.restaurantId : null;
      
      // Get final file stats for the response
      const fileSize = req.file.size;
      
      // Create a file upload record in the database
      const fileUpload = await storage.createFileUpload({
        userId,
        restaurantId,
        originalFilename: req.file.originalname,
        storedFilename: req.file.filename,
        filePath: originalFilePath,
        fileUrl: imageUrl,
        fileType: req.file.mimetype,
        fileSize: fileSize,
        status: 'active',
        fileCategory: 'menu_item',
        uploadedAt: new Date(),
        metadata: {
          provider: imageUrl.includes('/api/images/') ? 'permanent' : 'local',
          compressed: true, // We always optimize images
          menuItemId: itemId,
          menuItemName: item.name
        }
      });
      
      console.log(`✅ Menu item ${itemId} successfully updated with new image URL: ${imageUrl}, file record ID: ${fileUpload.id}`);
      res.json({ 
        imageUrl, 
        success: true,
        fileDetails: {
          name: req.file.filename,
          size: fileSize,
          type: req.file.mimetype,
          provider: imageUrl.includes('/api/images/') ? 'permanent' : 'local'
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
          console.log(`Attempting to increment QR scan count for restaurant ${restaurantId}`);
          await storage.incrementQRCodeScans(restaurantId);
          console.log(`QR code scan successfully recorded for restaurant ${restaurantId}`);
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

  // Import Chapa service
  let chapaService, SUBSCRIPTION_PLANS, convertPrice, getCurrencyByLocation;
  try {
    const chapaModule = await import('./chapa-service');
    chapaService = chapaModule.chapaService;
    SUBSCRIPTION_PLANS = chapaModule.SUBSCRIPTION_PLANS;
    convertPrice = chapaModule.convertPrice;
    getCurrencyByLocation = chapaModule.getCurrencyByLocation;
  } catch (error) {
    console.warn('Chapa service not available:', error.message);
    chapaService = null;
    SUBSCRIPTION_PLANS = {};
    convertPrice = (price: number) => price;
    getCurrencyByLocation = () => 'ETB';
  }

  // Get subscription plans with international pricing
  app.get('/api/chapa/subscription-plans', (req, res) => {
    try {
      const userCurrency = req.query.currency as string || 'ETB';
      const countryCode = req.query.country as string;
      
      // Get appropriate currency based on user location
      const currency = countryCode ? getCurrencyByLocation(countryCode) : userCurrency;
      
      // Convert plan prices to user's currency
      const plansWithPricing = Object.entries(SUBSCRIPTION_PLANS).reduce((acc, [key, plan]) => {
        let monthlyPrice = plan.monthlyPrice;
        let yearlyPrice = plan.yearlyPrice;
        let planCurrency = currency;
        
        // Use international pricing if available, otherwise convert from ETB
        if (plan.international && plan.internationalPricing && plan.internationalPricing[currency]) {
          if (plan.internationalPricing.monthly) {
            monthlyPrice = plan.internationalPricing.monthly[currency];
          }
          if (plan.internationalPricing.yearly) {
            yearlyPrice = plan.internationalPricing.yearly[currency];
          }
        } else if (currency !== 'ETB' && plan.monthlyPrice > 0) {
          monthlyPrice = convertPrice(plan.monthlyPrice, currency);
          yearlyPrice = convertPrice(plan.yearlyPrice, currency);
        }
        
        acc[key] = {
          ...plan,
          monthlyPrice,
          yearlyPrice,
          currency: planCurrency,
          originalPrice: plan.monthlyPrice,
          originalCurrency: 'ETB',
          popular: key === 'double' // Set "Two Restaurants" as most popular
        };
        return acc;
      }, {} as any);
      
      res.json({
        plans: plansWithPricing,
        currency,
        supportedCurrencies: ['ETB', 'USD', 'EUR', 'GBP']
      });
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Initialize Chapa payment with international support
  app.post('/api/chapa/initialize-payment/:planId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      const planId = req.params.planId.toLowerCase();
      const { email, firstName, lastName, phoneNumber, currency, countryCode, paymentMethod, cardNumber, expiryDate, cvv, cardholderName } = req.body;
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if this is a free plan - no payment needed
      if (planId === 'free') {
        return res.json({
          status: 'success',
          message: 'Free plan activated successfully',
          data: {
            plan: 'free',
            redirect_url: '/payment-success?plan=free'
          }
        });
      }

      if (!chapaService) {
        return res.status(503).json({ 
          message: 'Payment service temporarily unavailable',
          details: 'Payment processing is currently being configured. Please try again later or contact support.',
          supportMethods: paymentMethod === 'local' 
            ? ['Telebirr', 'CBE Birr', 'Bank Transfer', 'Mobile Banking']
            : ['Visa', 'Mastercard', 'International Bank Transfer']
        });
      }

      if (!(planId in SUBSCRIPTION_PLANS)) {
        return res.status(404).json({ message: 'Invalid subscription plan' });
      }

      const plan = SUBSCRIPTION_PLANS[planId];
      
      // Get billing period from query params
      const billingPeriod = req.query.period === 'yearly' ? 'yearly' : 'monthly';
      
      // Determine currency and price
      const userCurrency = currency || getCurrencyByLocation(countryCode) || 'ETB';
      let finalPrice = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      
      // Use international pricing if available, otherwise convert from ETB
      if (plan.international && plan.internationalPricing && plan.internationalPricing[userCurrency]) {
        finalPrice = plan.internationalPricing[userCurrency];
      } else if (userCurrency !== 'ETB' && plan.price > 0) {
        finalPrice = convertPrice(plan.price, userCurrency);
      }
      
      // Free plan doesn't require payment
      if (finalPrice === 0) {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // Free for 1 year
        
        const newSubscription = await storage.createSubscription({
          userId,
          tier: planId,
          endDate,
          paymentMethod: "free",
          isActive: true
        });

        return res.json({
          status: 'success',
          message: 'Free subscription activated',
          subscription: newSubscription
        });
      }

      // Format amount for Chapa
      const amount = chapaService.formatAmount(finalPrice, userCurrency);
      
      // Generate unique transaction reference
      const txRef = chapaService.generateTxRef(`vividplate_${planId}_${userId}`);
      
      // Prepare callback and return URLs
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const callbackUrl = `${baseUrl}/api/chapa/callback`;
      const returnUrl = `${baseUrl}/payment-success?plan=${planId}&currency=${userCurrency}`;

      const paymentData: any = {
        amount,
        currency: userCurrency,
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        tx_ref: txRef,
        callback_url: callbackUrl,
        return_url: returnUrl,
        description: `VividPlate ${plan.name} Plan Subscription (${userCurrency})`,
        customization: {
          title: 'VividPlate',
          description: `Subscribe to ${plan.name} plan - ${finalPrice} ${userCurrency}`,
          logo: `${baseUrl}/favicon.ico`
        }
      };

      // Add card details for international payments
      if (paymentMethod === 'international' && cardNumber && expiryDate && cvv && cardholderName) {
        paymentData.card = {
          number: cardNumber.replace(/\s/g, ''),
          expiry_month: expiryDate.split('/')[0],
          expiry_year: '20' + expiryDate.split('/')[1],
          cvv: cvv,
          cardholder_name: cardholderName
        };
      }

      // Validate payment data
      const validationErrors = chapaService.validatePaymentData(paymentData);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid payment data', 
          errors: validationErrors 
        });
      }

      // Initialize payment with Chapa
      const chapaResponse = await chapaService.initializePayment(paymentData);
      
      res.json({
        ...chapaResponse,
        planDetails: {
          name: plan.name,
          price: finalPrice,
          currency: userCurrency,
          originalPrice: plan.price,
          originalCurrency: 'ETB'
        }
      });
      
    } catch (error) {
      console.error("Chapa international payment initialization error:", error);
      res.status(500).json({ 
        message: 'Error initializing payment', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Pricing plans endpoint - serve Chapa pricing with international support
  app.get('/api/pricing', (req, res) => {
    try {
      const userCurrency = req.query.currency as string || 'ETB';
      const countryCode = req.query.country as string;
      
      // Get appropriate currency based on user location if functions are available
      const currency = (countryCode && getCurrencyByLocation) ? getCurrencyByLocation(countryCode) : userCurrency;
      
      if (!SUBSCRIPTION_PLANS || Object.keys(SUBSCRIPTION_PLANS).length === 0) {
        // Fallback to static plans if Chapa service is not available
        const fallbackPlans = {
          free: {
            name: 'Free',
            monthlyPrice: 0,
            yearlyPrice: 0,
            currency: 'ETB',
            description: 'Basic menu management with limited features',
            features: [
              'No Restaurants',
              '10 Image Uploads Only',
              'Basic Menu Viewing',
              'Standard Support'
            ],
            maxRestaurants: 0,
            maxMenuItems: 0,
            maxImages: 10,
            popular: false
          },
          single: {
            name: 'Single Restaurant',
            monthlyPrice: 800,
            yearlyPrice: 9600,
            currency: 'ETB',
            description: 'Perfect for single restaurant owners',
            features: [
              '1 Restaurant',
              'Unlimited Menu Items',
              'Unlimited Image Uploads',
              'QR Code Generation',
              'Custom Themes',
              'Analytics',
              'Priority Support'
            ],
            maxRestaurants: 1,
            maxMenuItems: -1,
            maxImages: -1,
            popular: false
          },
          double: {
            name: 'Two Restaurants',
            monthlyPrice: 1500,
            yearlyPrice: 18000,
            currency: 'ETB',
            description: 'Ideal for growing restaurant businesses',
            features: [
              '2 Restaurants',
              'Unlimited Menu Items',
              'Unlimited Image Uploads',
              'Advanced Analytics',
              'Custom Themes',
              'Menu Translation',
              'Priority Support',
              'Advanced QR Codes'
            ],
            maxRestaurants: 2,
            maxMenuItems: -1,
            maxImages: -1,
            popular: true
          },
          triple: {
            name: 'Three Restaurants',
            monthlyPrice: 2000,
            yearlyPrice: 24000,
            currency: 'ETB',
            description: 'Complete solution for restaurant chains',
            features: [
              '3 Restaurants',
              'Unlimited Menu Items',
              'Unlimited Image Uploads',
              'Advanced Analytics & Reports',
              'Custom Branding',
              'Menu Translation',
              '24/7 Support',
              'API Access',
              'Multi-language Support'
            ],
            maxRestaurants: 3,
            maxMenuItems: -1,
            maxImages: -1,
            popular: false
          }
        };
        return res.json(fallbackPlans);
      }
      
      // Convert plan prices to user's currency using new structure
      const plansWithPricing = Object.entries(SUBSCRIPTION_PLANS).reduce((acc, [key, plan]) => {
        let monthlyPrice = plan.monthlyPrice;
        let yearlyPrice = plan.yearlyPrice;
        let planCurrency = currency;
        
        // Use international pricing if available, otherwise convert from ETB
        if (plan.international && plan.internationalPricing && plan.internationalPricing[currency]) {
          if (plan.internationalPricing.monthly) {
            monthlyPrice = plan.internationalPricing.monthly[currency];
          }
          if (plan.internationalPricing.yearly) {
            yearlyPrice = plan.internationalPricing.yearly[currency];
          }
        } else if (currency !== 'ETB' && plan.monthlyPrice > 0 && convertPrice) {
          monthlyPrice = convertPrice(plan.monthlyPrice, currency);
          yearlyPrice = convertPrice(plan.yearlyPrice, currency);
        }
        
        acc[key] = {
          ...plan,
          monthlyPrice,
          yearlyPrice,
          currency: planCurrency,
          originalPrice: plan.monthlyPrice,
          originalCurrency: 'ETB',
          popular: key === 'double' // Set "Two Restaurants" as most popular
        };
        return acc;
      }, {} as any);
      
      res.json(plansWithPricing);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      // Return basic fallback plans on error with new structure
      const basicPlans = {
        free: {
          name: 'Free',
          monthlyPrice: 0,
          yearlyPrice: 0,
          currency: 'ETB',
          description: 'Basic menu management with limited features',
          features: ['No Restaurants', '10 Image Uploads Only'],
          maxRestaurants: 0,
          maxMenuItems: 0,
          maxImages: 10,
          popular: false
        },
        single: {
          name: 'Single Restaurant',
          monthlyPrice: 800,
          yearlyPrice: 9600,
          currency: 'ETB',
          description: 'Perfect for single restaurant owners',
          features: ['1 Restaurant', 'Unlimited Menu Items', 'Unlimited Image Uploads'],
          maxRestaurants: 1,
          maxMenuItems: -1,
          maxImages: -1,
          popular: false
        }
      };
      res.json(basicPlans);
    }
  });

  // Update subscription limits based on new pricing plans
  app.get('/api/subscription/limits', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get current subscription
      const subscription = await storage.getUserSubscription(userId);
      const tier = subscription?.tier || 'free';
      
      // Get limits based on tier
      let limits = {
        maxRestaurants: 0,
        maxMenuItems: 0,
        maxImages: 10
      };

      if (SUBSCRIPTION_PLANS[tier]) {
        const plan = SUBSCRIPTION_PLANS[tier];
        limits = {
          maxRestaurants: plan.maxRestaurants,
          maxMenuItems: plan.maxMenuItems,
          maxImages: plan.maxImages
        };
      }

      res.json({
        tier,
        limits,
        subscription
      });
    } catch (error) {
      console.error('Error fetching subscription limits:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Also need to remove the old fallback section that's causing issues
  // Remove the old pricing endpoint implementation
  app.get('/api/pricing-old', (req, res) => {
    // Old implementation removed - now using updated structure above
    res.json({ message: 'Deprecated endpoint' });
  });



  // Legacy Stripe endpoints - redirect to Chapa
  app.post('/api/create-subscription', isAuthenticated, async (req, res) => {
    try {
      const { planId } = req.body;
      console.log(`Legacy Stripe payment request for plan ${planId} - redirecting to Chapa`);
      
      res.json({
        message: 'Payment system updated. Please use the new Chapa payment system.',
        redirectTo: `/chapa-subscribe/${planId}`,
        legacy: true
      });
    } catch (error) {
      console.error("Legacy subscription endpoint error:", error);
      res.status(500).json({ 
        message: 'Payment system temporarily unavailable', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/create-subscription/:planId', isAuthenticated, async (req, res) => {
    try {
      const planId = req.params.planId.toLowerCase();
      
      res.json({
        message: 'Payment system updated. Please use the new Chapa payment system.',
        redirectTo: `/chapa-subscribe/${planId}`
      });
    } catch (error) {
      console.error("Legacy subscription endpoint error:", error);
      res.status(500).json({ 
        message: 'Payment system temporarily unavailable', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Chapa callback endpoint (called by Chapa after payment)
  // According to Chapa docs, this receives a GET request with JSON payload: {trx_ref, ref_id, status}
  app.get('/api/chapa/callback', async (req, res) => {
    try {
      console.log('Chapa callback received - query params:', req.query);
      
      if (!chapaService) {
        console.error('Chapa service not available for callback processing');
        return res.status(503).json({ message: 'Payment service unavailable' });
      }

      // Chapa sends callback as GET request with query parameters
      const { trx_ref, ref_id, status } = req.query;
      
      if (!trx_ref) {
        return res.status(400).json({ message: 'Invalid callback data: missing trx_ref' });
      }

      console.log('Chapa callback received:', { trx_ref, ref_id, status });

      // Verify the payment with Chapa
      try {
        const verificationResult = await chapaService.verifyPayment(trx_ref as string);
        console.log('Chapa verification result:', verificationResult);
        
        if (verificationResult.status === 'success' && verificationResult.data.status === 'success') {
          // Payment successful, update subscription
          const txRefParts = (trx_ref as string).split('_');
          if (txRefParts.length >= 3) {
            const planId = txRefParts[1];
            const userId = parseInt(txRefParts[2]);
            
            if (userId && planId && SUBSCRIPTION_PLANS[planId]) {
              const plan = SUBSCRIPTION_PLANS[planId];
              const endDate = new Date();
              endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription
              
              const newSubscription = await storage.createSubscription({
                userId,
                tier: planId,
                endDate,
                paymentMethod: "chapa",
                isActive: true
              });

              console.log('Subscription created successfully:', newSubscription);
            }
          }
        }

        res.json({ 
          message: 'Callback processed successfully',
          status: verificationResult.status,
          data: verificationResult.data 
        });
      } catch (verifyError) {
        console.error('Payment verification failed:', verifyError);
        res.status(400).json({ 
          message: 'Payment verification failed', 
          error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Chapa callback error:', error);
      res.status(500).json({ 
        message: 'Callback processing failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual payment verification endpoint
  app.post('/api/chapa/verify-payment', isAuthenticated, async (req, res) => {
    try {
      const { txRef, planId } = req.body;
      const userId = (req.user as any).id;
      
      if (!chapaService) {
        return res.status(503).json({ 
          message: 'Payment service temporarily unavailable',
          error: 'Chapa service not configured' 
        });
      }

      if (!txRef) {
        return res.status(400).json({ message: 'Transaction reference is required' });
      }

      // Verify payment with Chapa
      const verificationResult = await chapaService.verifyPayment(txRef);
      
      if (verificationResult.status === 'success' && verificationResult.data.status === 'success') {
        // Payment successful, create/update subscription
        if (planId && SUBSCRIPTION_PLANS[planId]) {
          const plan = SUBSCRIPTION_PLANS[planId];
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription
          
          const newSubscription = await storage.createSubscription({
            userId,
            tier: planId,
            endDate,
            paymentMethod: "chapa",
            isActive: true
          });

          res.json({
            status: 'success',
            message: 'Payment verified and subscription activated',
            subscription: newSubscription,
            paymentData: verificationResult.data
          });
        } else {
          res.json({
            status: 'success',
            message: 'Payment verified successfully',
            paymentData: verificationResult.data
          });
        }
      } else {
        res.status(400).json({
          status: 'failed',
          message: 'Payment verification failed',
          error: verificationResult.message || 'Payment not successful',
          paymentData: verificationResult.data
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ 
        message: 'Payment verification failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/verify-payment', isAuthenticated, async (req, res) => {
    res.status(400).json({
      message: 'Stripe payment system has been replaced with Chapa. Please use /api/chapa/verify-payment',
      error: 'Payment system updated'
    });
  });

  // Admin Authentication Middleware
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };

  // Admin Dashboard - Statistics API
  app.get('/api/admin/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const [users, restaurants, subscriptions, viewsAnalytics, registrationAnalytics] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllRestaurants(),
        storage.getAllSubscriptions(),
        storage.getViewsAnalytics(),
        storage.getRegistrationAnalytics()
      ]);

      const stats = {
        totalUsers: users.length,
        totalRestaurants: restaurants.length,
        activeUsers: users.filter(u => u.isActive !== false).length,
        premiumUsers: users.filter(u => u.subscriptionTier === 'premium').length,
        businessUsers: users.filter(u => u.subscriptionTier === 'business').length,
        freeUsers: users.filter(u => u.subscriptionTier === 'free' || !u.subscriptionTier).length,
        paidUsers: users.filter(u => u.subscriptionTier === 'premium' || u.subscriptionTier === 'business').length,
        activeSubscriptions: subscriptions.filter(s => s.isActive).length,
        recentUsers: users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5),
        viewStats: viewsAnalytics,
        registrationStats: registrationAnalytics
      };

      res.json(stats);
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ message: 'Failed to load dashboard data' });
    }
  });

  // Admin Users API
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(user => {
        const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitive } = user;
        return userWithoutSensitive;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Admin get users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Admin Restaurants API
  app.get('/api/admin/restaurants', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const restaurants = await storage.getAllRestaurantsWithOwners();
      res.json(restaurants);
    } catch (error) {
      console.error('Admin get restaurants error:', error);
      res.status(500).json({ message: 'Failed to fetch restaurants' });
    }
  });

  // Admin Pricing Plans Management API
  app.get('/api/admin/pricing-plans', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const plans = await storage.getAllPricingPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/admin/pricing-plans', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const planData = req.body;
      const plan = await storage.createPricingPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error('Error creating pricing plan:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/admin/pricing-plans/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const updates = req.body;
      const plan = await storage.updatePricingPlan(planId, updates);
      if (!plan) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      res.json(plan);
    } catch (error) {
      console.error('Error updating pricing plan:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/admin/pricing-plans/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const deleted = await storage.deletePricingPlan(planId);
      if (!deleted) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin Logs API
  app.get('/api/admin/logs', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const logs = await storage.getAllLogs();
      res.json(logs);
    } catch (error) {
      console.error('Admin get logs error:', error);
      res.status(500).json({ message: 'Failed to fetch logs' });
    }
  });

  // Admin Pricing API
  app.get('/api/admin/pricing', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const plans = [
        {
          id: 'free',
          name: 'Free',
          description: 'Basic features for small restaurants',
          price: 0,
          currency: 'ETB',
          features: ['1 restaurant', '1 menu', 'QR code generation', 'Basic analytics'],
          maxRestaurants: 1,
          isActive: true
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Advanced features for growing businesses',
          price: 1500,
          currency: 'ETB',
          features: ['Up to 3 restaurants', 'Multiple menus', 'No ads', 'Customer feedback', 'Advanced analytics'],
          maxRestaurants: 3,
          isActive: true
        },
        {
          id: 'business',
          name: 'Business',
          description: 'Enterprise features for large operations',
          price: 3000,
          currency: 'ETB',
          features: ['Up to 10 restaurants', 'Unlimited menus', 'Priority support', 'Custom branding', 'API access'],
          maxRestaurants: 10,
          isActive: true
        }
      ];
      res.json(plans);
    } catch (error) {
      console.error('Admin get pricing error:', error);
      res.status(500).json({ message: 'Failed to fetch pricing plans' });
    }
  });

  // Admin Contact Info API
  app.get('/api/admin/contact-info', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const contactInfo = {
        id: 1,
        address: "Ethiopia, Addis Ababa",
        email: "vividplate.spp@gmail.com", 
        phone: "+251-913-690-687",
        openHours: "Monday - Sunday: 9:00 AM - 10:00 PM",
        socialMedia: {
          facebook: "",
          twitter: "",
          instagram: ""
        }
      };
      res.json(contactInfo);
    } catch (error) {
      console.error('Admin get contact info error:', error);
      res.status(500).json({ message: 'Failed to fetch contact info' });
    }
  });

  // Admin Advertisements API
  app.get('/api/admin/advertisements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const advertisements = await storage.getAllAdvertisements();
      res.json(advertisements);
    } catch (error) {
      console.error('Admin get advertisements error:', error);
      res.status(500).json({ message: 'Failed to fetch advertisements' });
    }
  });

  // Admin Testimonials API
  app.get('/api/admin/testimonials', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const testimonials = await storage.getAllTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Admin get testimonials error:', error);
      res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
  });

  // Waiter Call API routes
  app.post('/api/waiter-calls', async (req, res) => {
    try {
      const callData = insertWaiterCallSchema.parse(req.body);
      const call = await storage.createWaiterCall(callData);
      res.json(call);
    } catch (error) {
      console.error('Error creating waiter call:', error);
      res.status(500).json({ message: 'Failed to create waiter call' });
    }
  });

  app.get('/api/restaurants/:restaurantId/waiter-calls', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const calls = await storage.getWaiterCallsByRestaurantId(restaurantId);
      res.json(calls);
    } catch (error) {
      console.error('Error fetching waiter calls:', error);
      res.status(500).json({ message: 'Failed to fetch waiter calls' });
    }
  });

  app.get('/api/restaurants/:restaurantId/waiter-calls/pending', isAuthenticated, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const calls = await storage.getPendingWaiterCalls(restaurantId);
      res.json(calls);
    } catch (error) {
      console.error('Error fetching pending waiter calls:', error);
      res.status(500).json({ message: 'Failed to fetch pending waiter calls' });
    }
  });

  app.patch('/api/waiter-calls/:callId', isAuthenticated, async (req, res) => {
    try {
      const callId = parseInt(req.params.callId);
      const { status } = req.body;
      const call = await storage.updateWaiterCallStatus(callId, status);
      if (!call) {
        return res.status(404).json({ message: 'Waiter call not found' });
      }
      res.json(call);
    } catch (error) {
      console.error('Error updating waiter call status:', error);
      res.status(500).json({ message: 'Failed to update waiter call status' });
    }
  });

  // Object Storage API routes for background images
  app.post('/api/objects/upload', async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/restaurants/:restaurantId/background-image', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const { backgroundImageUrl } = req.body;

      if (!backgroundImageUrl) {
        return res.status(400).json({ error: 'backgroundImageUrl is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(backgroundImageUrl);

      // Get current restaurant and update theme settings
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const currentThemeSettings = restaurant.themeSettings || {};
      const updatedThemeSettings = {
        ...currentThemeSettings,
        backgroundImageUrl: objectPath
      };

      const updatedRestaurant = await storage.updateRestaurant(restaurantId, {
        themeSettings: updatedThemeSettings
      });

      res.json({
        success: true,
        objectPath,
        restaurant: updatedRestaurant
      });
    } catch (error) {
      console.error('Error setting background image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Serve permanent images from database with optimized caching
  app.get('/api/images/:filename', async (req, res) => {
    try {
      const { PermanentImageService } = await import('./permanent-image-service');
      const filename = req.params.filename;
      
      const image = await PermanentImageService.getImage(filename);
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }
      
      // Convert base64 back to buffer
      const imageBuffer = Buffer.from(image.imageData, 'base64');
      
      // Generate ETag for better caching
      const { createHash } = await import('crypto');
      const etag = createHash('md5').update(imageBuffer).digest('hex');
      
      // Check if client has cached version
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      
      // Set comprehensive caching headers
      res.set({
        'Content-Type': image.mimeType,
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etag,
        'Last-Modified': new Date(image.uploadedAt).toUTCString(),
        'Expires': new Date(Date.now() + 31536000000).toUTCString(),
        'Content-Disposition': `inline; filename="${image.originalName}"`
      });
      
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error serving permanent image:', error);
      res.status(500).json({ message: 'Error serving image' });
    }
  });

  app.get('/objects/:objectPath(*)', async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error('Error serving object:', error);
      if (error.name === 'ObjectNotFoundError') {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
