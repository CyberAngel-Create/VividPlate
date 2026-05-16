#!/usr/bin/env tsx
import { storage } from "../server/storage";

async function promoteUsersToAgents(usernames: string[]) {
  for (const username of usernames) {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`User not found: ${username}`);
        continue;
      }

      console.log(`Found user: ${user.username} (id=${user.id})`);

      // Update role to 'agent' (safe even if already agent)
      await storage.updateUser(user.id, { role: 'agent' });
      console.log(`Updated role for ${user.username} -> agent`);

      // If agent profile exists, ensure it's approved; otherwise create it
      const existingAgent = await storage.getAgentByUserId(user.id);
      if (existingAgent) {
        console.log(`Agent profile already exists for ${user.username} (agent id=${existingAgent.id})`);
        // If not approved, attempt to approve using admin id 1
        if (existingAgent.approvalStatus !== 'approved') {
          try {
            const approved = await storage.approveAgent(existingAgent.id, 1, 'Auto-approved by script');
            if (approved) console.log(`Approved existing agent for ${user.username}`);
          } catch (e) {
            console.warn(`Failed to approve existing agent for ${user.username}:`, e);
          }
        }
        continue;
      }

      // Create a minimal agent profile with placeholder values
      const names = (user.fullName || user.username || '').split(' ');
      const firstName = names[0] || user.username;
      const lastName = names.slice(1).join(' ') || 'Agent';

      const agentData = {
        userId: user.id,
        firstName,
        lastName,
        dateOfBirth: '1970-01-01',
        gender: 'other',
        address: '',
        city: '',
        state: '',
        country: 'Ethiopia',
        postalCode: '',
        idType: 'national_id',
        idNumber: `AG-${user.id}`,
        idFrontImageUrl: '',
        idBackImageUrl: '',
        selfieImageUrl: '',
      } as any;

      try {
        const created = await storage.createAgent(agentData);
        console.log(`Created agent profile (id=${created.id}) for ${user.username}`);

        // Approve agent (admin id 1)
        try {
          const approved = await storage.approveAgent(created.id, 1, 'Auto-approved by script');
          if (approved) console.log(`Approved new agent for ${user.username}`);
        } catch (e) {
          console.warn(`Failed to approve agent for ${user.username}:`, e);
        }
      } catch (e) {
        console.error(`Failed to create agent profile for ${user.username}:`, e);
      }

    } catch (err) {
      console.error(`Error processing ${username}:`, err);
    }
  }
}

(async () => {
  const candidates = [
    'agentmichael',
    'angelmichael',
    'agentlegesse',
    'agentlegese',
    'agentlegese',
    'agentlegesse'
  ];

  await promoteUsersToAgents(Array.from(new Set(candidates)));
  console.log('Done');
  process.exit(0);
})();
