// Simple direct authentication system that works with hard-coded test accounts
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const fs = require('fs');

// Define test users
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

// Create a simple Express application
const app = express();

// Set up JSON body parsing (increase limits to accept larger payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Set up session
app.use(session({
  secret: 'menumate-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 86400000 // 1 day
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // Clear expired sessions once per day
  })
}));

// Configure routes for authentication
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  console.log(`Login attempt for: ${identifier} / ${password}`);
  
  // Find user by username or email (case insensitive)
  const user = TEST_USERS.find(user => 
    (user.username.toLowerCase() === identifier.toLowerCase() || 
     user.email.toLowerCase() === identifier.toLowerCase()) && 
    user.password === password
  );
  
  if (!user) {
    console.log('Login failed: Invalid credentials');
    return res.status(401).json({ message: 'Invalid username/email or password' });
  }
  
  // Store user info in session (excluding password)
  const { password: _, ...safeUser } = user;
  req.session.user = safeUser;
  
  console.log(`Login successful for: ${user.username}`);
  res.json(safeUser);
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  res.json(req.session.user);
});

// Admin login endpoint
app.post('/api/auth/admin-login', (req, res) => {
  const { identifier, password } = req.body;
  
  // Find admin user only
  const user = TEST_USERS.find(user => 
    (user.username.toLowerCase() === identifier.toLowerCase() || 
     user.email.toLowerCase() === identifier.toLowerCase()) && 
    user.password === password &&
    user.isAdmin === true
  );
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
  
  // Store user info in session (excluding password)
  const { password: _, ...safeUser } = user;
  req.session.user = safeUser;
  
  res.json(safeUser);
});

// Setup mock profile/user routes
app.get('/api/profile', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  res.json(req.session.user);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth test server running on port ${PORT}`);
  console.log('Available test accounts:');
  TEST_USERS.forEach(user => {
    console.log(`- Username: ${user.username}, Password: ${user.password}`);
  });
});