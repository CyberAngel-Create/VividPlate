// Simplified authentication server to let us log in with test accounts
const express = require('express');
const session = require('express-session');
const cors = require('express'); // Use express for CORS too
const path = require('path');
const fs = require('fs');

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

// Create Express app
const app = express();

// Set up middleware
app.use(express.json());
app.use(cors());
app.use(session({
  secret: 'vivid-plate-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

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
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
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

// Start the server on port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test login server running on port ${PORT}`);
  console.log('Available test accounts:');
  
  // Print available test accounts for reference
  TEST_USERS.forEach(user => {
    console.log(`- Username: ${user.username}, Password: ${user.password}, Admin: ${user.isAdmin}`);
  });
  
  console.log('\nTry logging in with:');
  console.log('curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"identifier":"admin", "password":"admin1234"}\'');
});