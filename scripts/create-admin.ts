// This script creates an admin user for testing purposes
import { storage } from '../server/storage';
import * as bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (existingAdmin) {
      console.log('Admin user already exists with ID:', existingAdmin.id);
      return;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin1234', salt);
    
    // Create admin user
    const admin = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@digitamenumate.com',
      fullName: 'Admin User',
      isAdmin: true,
      isActive: true
    });
    
    console.log('Admin user created successfully with ID:', admin.id);
    console.log('Username: admin');
    console.log('Password: admin1234');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run the function
createAdminUser().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});