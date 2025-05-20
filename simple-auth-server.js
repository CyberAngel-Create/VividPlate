const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Enable JSON parsing and CORS
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

// Test accounts
const USERS = [
  { id: 1, username: 'admin', password: 'admin1234', email: 'admin@example.com', fullName: 'Admin User', isAdmin: true, subscriptionTier: 'admin' },
  { id: 2, username: 'restaurant1', password: 'password123', email: 'restaurant1@example.com', fullName: 'Restaurant Owner', isAdmin: false, subscriptionTier: 'free' },
  { id: 3, username: 'entotocloud', password: 'cloud123', email: 'entoto@example.com', fullName: 'Entoto Cloud', isAdmin: false, subscriptionTier: 'premium' }
];

// Login endpoint
app.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  console.log(`Login attempt: ${identifier}`);
  
  const user = USERS.find(u => 
    (u.username.toLowerCase() === identifier.toLowerCase() || 
     u.email.toLowerCase() === identifier.toLowerCase()) && 
    u.password === password);
  
  if (!user) {
    console.log('Login failed: Invalid credentials');
    return res.status(401).json({ message: 'Invalid username/email or password' });
  }
  
  console.log(`Login successful: ${user.username}`);
  const { password: _, ...userInfo } = user;
  res.json(userInfo);
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple auth server running at http://localhost:${PORT}`);
  console.log('Available test accounts:');
  USERS.forEach(u => console.log(`- ${u.username} / ${u.password}`));
});
