import { Request, Response, NextFunction } from 'express';

// Define our test user accounts
const TEST_USERS = [
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
    username: 'entotocloud', 
    password: 'cloud123',
    email: 'entoto@example.com',
    fullName: 'Entoto Cloud',
    isAdmin: false,
    subscriptionTier: 'premium',
    isActive: true,
    createdAt: new Date()
  }
];

// Simple authentication middleware
export function setupSimpleAuth(app) {
  // Login endpoint
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    
    console.log(`Login attempt for: ${identifier}`);
    
    // Find user by username or email
    const user = TEST_USERS.find(user => 
      (user.username === identifier || user.email === identifier) && 
      user.password === password
    );
    
    if (!user) {
      console.log(`Login failed for ${identifier}: Invalid credentials`);
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }
    
    // Set user in session
    const session = req.session as any;
    session.user = user;
    
    console.log(`Login successful for ${user.username}`);
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Error during logout:', err);
        return res.status(500).json({ message: 'Error during logout' });
      }
      
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  // Get current user endpoint
  app.get('/api/auth/me', (req, res) => {
    const session = req.session as any;
    if (!session.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = session.user;
    res.json(userWithoutPassword);
  });
  
  // Admin login endpoint
  app.post('/api/auth/admin-login', (req, res) => {
    const { identifier, password } = req.body;
    
    // Find admin user
    const user = TEST_USERS.find(user => 
      (user.username === identifier || user.email === identifier) && 
      user.password === password && 
      user.isAdmin
    );
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    // Set user in session
    const session = req.session as any;
    session.user = user;
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Authentication middleware for protected routes
  app.use('/api/profile', isAuthenticated);
  app.use('/api/restaurants', isAuthenticated);
  app.use('/api/menus', isAuthenticated);
  
  return app;
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  if (!session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  if (!session.user || !session.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}