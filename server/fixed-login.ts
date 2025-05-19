import { Request, Response, NextFunction } from 'express';
import { MemUser, findUserByCredentials } from './mem-auth';

/**
 * Memory-based authentication handler that works with hard-coded test accounts
 * This is a simpler solution than using Passport which requires database access
 */
export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password } = req.body;
    console.log(`Login attempt for: ${identifier}`);
    
    // List all available test users for debugging
    console.log('Available test users:');
    const { testUsers } = await import('./mem-auth');
    testUsers.forEach(user => {
      console.log(`- Username: ${user.username}, Email: ${user.email}`);
    });
    
    // Find user in memory
    const user = findUserByCredentials(identifier, password);
    
    if (!user) {
      console.log(`Authentication failed: No user found with identifier "${identifier}" and matching password`);
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }
    
    console.log('Authentication successful for:', user.username);
    
    // Login the user via session
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('Session error during login:', loginErr);
        return res.status(500).json({ message: 'Error establishing session' });
      }
      
      console.log(`User ${user.username} (ID: ${user.id}) logged in successfully`);
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    });
  } catch (error) {
    console.error('Error in login handler:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}