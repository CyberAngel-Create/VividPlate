#!/usr/bin/env tsx
import { storage } from "../server/storage";

async function check(username: string) {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      console.log(`User not found: ${username}`);
      return;
    }
    console.log(`User: id=${user.id} username=${user.username} role=${user.role} fullName='${user.fullName}' email=${user.email}`);
    const agent = await storage.getAgentByUserId(user.id);
    if (!agent) {
      console.log('No agent profile found for this user');
    } else {
      console.log(`Agent: id=${agent.id} approvalStatus=${agent.approvalStatus} tokenBalance=${agent.tokenBalance}`);
    }
  } catch (err) {
    console.error('Error checking user:', err);
  }
}

(async () => {
  const args = process.argv.slice(2);
  const username = args[0] || 'angelhaime';
  await check(username);
  process.exit(0);
})();
