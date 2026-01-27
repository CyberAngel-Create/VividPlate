#!/usr/bin/env tsx
import bcrypt from 'bcryptjs';
import { storage } from '../server/storage';

async function createUnverifiedAgent(opts: {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone: string;
}) {
  const { username, password, email, fullName, phone } = opts;
  try {
    let user = await storage.getUserByUsername(username);
    if (user) {
      console.log(`User already exists: ${username} (id=${user.id})`);
    } else {
      const hashed = await bcrypt.hash(password, 10);
      user = await storage.createUser({
        username,
        password: hashed,
        email,
        fullName,
        phone,
        isAdmin: false,
        isActive: true,
        role: 'agent'
      } as any);
      console.log(`Created user ${username} (id=${user.id})`);
    }

    // Ensure role is agent
    if (user.role !== 'agent') {
      await storage.updateUser(user.id, { role: 'agent' });
      console.log(`Updated role -> agent for user id=${user.id}`);
    }

    // Create a pending agent profile if none exists
    const existingAgent = await storage.getAgentByUserId(user.id);
    if (existingAgent) {
      console.log(`Agent profile already exists: agent id=${existingAgent.id}, status=${existingAgent.approvalStatus}`);
    } else {
      const names = (fullName || username).split(' ');
      const agentData = {
        userId: user.id,
        firstName: names[0] || username,
        lastName: names.slice(1).join(' ') || '',
        dateOfBirth: '1970-01-01',
        gender: 'other',
        address: '',
        city: '',
        state: '',
        country: 'Ethiopia',
        postalCode: '',
        idType: 'national_id',
        idNumber: `PENDING-${user.id}`,
        idFrontImageUrl: '',
        idBackImageUrl: '',
        selfieImageUrl: ''
      } as any;

      const created = await storage.createAgent(agentData);
      console.log(`Created pending agent profile id=${created.id} for user id=${user.id}`);
      // Make sure the users.role was already set to 'agent' above
    }

  } catch (err) {
    console.error('Failed to create unverified agent:', err);
    process.exit(1);
  }
}

(async () => {
  await createUnverifiedAgent({
    username: 'angelhaime',
    password: 'agent1234',
    email: 'angelhaime@example.com',
    fullName: 'Angel Haime',
    phone: '+251900000001'
  });
  console.log('Done');
  process.exit(0);
})();
