const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const fs = require('fs');

// Create Express router
const router = express.Router();

// Test accounts that will work in the system
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

// Create a simple Express application to test auth
const app = express();

// Set up middleware (increase limits for larger payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Set up session management
app.use(session({
  secret: 'vividplate-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,  // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // Prune expired entries every day
  })
}));

// Setup authentication routes
// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  console.log(`Login attempt for: ${identifier}`);
  
  // Find user
  const user = TEST_USERS.find(user => 
    (user.username.toLowerCase() === identifier.toLowerCase() || 
     user.email.toLowerCase() === identifier.toLowerCase()) && 
    user.password === password
  );
  
  if (!user) {
    console.log(`Login failed for: ${identifier}`);
    return res.status(401).json({ message: 'Invalid username/email or password' });
  }
  
  // Store user in session
  req.session.user = { ...user, password: undefined };
  console.log(`Login successful for: ${user.username}`);
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  res.json(req.session.user);
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ message: 'Error during logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Admin login endpoint
app.post('/api/auth/admin-login', (req, res) => {
  const { identifier, password } = req.body;
  
  // Find admin user
  const user = TEST_USERS.find(user => 
    (user.username.toLowerCase() === identifier.toLowerCase() || 
     user.email.toLowerCase() === identifier.toLowerCase()) && 
    user.password === password && 
    user.isAdmin
  );
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
  
  // Store user in session
  req.session.user = { ...user, password: undefined };
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Protected route example
app.get('/api/profile', isAuthenticated, (req, res) => {
  res.json(req.session.user);
});

// Start the server on port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test authentication server running on port ${PORT}`);
  console.log('Available test accounts:');
  TEST_USERS.forEach(user => {
    console.log(`- Username: ${user.username}, Password: ${user.password}, Admin: ${user.isAdmin}`);
  });
  
  console.log('\nYou can log in using these test accounts.');
  console.log('For example, try logging in with the admin account:');
  console.log('Username: admin');
  console.log('Password: admin1234');
});