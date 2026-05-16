#!/usr/bin/env tsx
import { storage } from "../server/storage";

async function resetAgentDocs(username: string) {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    console.log(`User not found: ${username}`);
    return;
  }

  const agent = await storage.getAgentByUserId(user.id);
  if (!agent) {
    console.log(`No agent profile for user: ${username}`);
    return;
  }

  const updated = await storage.updateAgent(agent.id, {
    idNumber: "",
    idFrontImageUrl: "",
    idBackImageUrl: "",
    selfieImageUrl: ""
  } as any);

  console.log(`Reset docs for ${username}: agentId=${agent.id}, approvalStatus=${agent.approvalStatus}`);
  if (updated) {
    console.log(`Updated idNumber='${updated.idNumber}', idFrontImageUrl='${updated.idFrontImageUrl}', idBackImageUrl='${updated.idBackImageUrl}', selfieImageUrl='${updated.selfieImageUrl}'`);
  }
}

(async () => {
  const usernames = process.argv.slice(2);
  if (usernames.length === 0) {
    console.log("Usage: reset-agent-docs.ts <username> [username...]");
    process.exit(1);
  }

  for (const username of usernames) {
    try {
      await resetAgentDocs(username);
    } catch (err) {
      console.error(`Failed to reset docs for ${username}:`, err);
    }
  }

  process.exit(0);
})();
