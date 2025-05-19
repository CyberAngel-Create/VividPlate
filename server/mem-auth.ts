// This file provides a memory-based authentication system
// as a fallback when database connections are not working

export interface MemUser {
  id: number;
  username: string;
  password: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: Date;
}

// In-memory test users for authentication
export const testUsers: MemUser[] = [
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

// Functions to use memory-based authentication
export function findUserByCredentials(identifier: string, password: string): MemUser | undefined {
  return testUsers.find(user => 
    (user.username.toLowerCase() === identifier.toLowerCase() || 
     user.email.toLowerCase() === identifier.toLowerCase()) && 
    user.password === password
  );
}

export function findUserById(id: number): MemUser | undefined {
  return testUsers.find(user => user.id === id);
}

export function findAdminById(id: number): MemUser | undefined {
  return testUsers.find(user => user.id === id && user.isAdmin);
}