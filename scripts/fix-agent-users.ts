#!/usr/bin/env tsx
import { storage } from "../server/storage";

async function ensureAgent(username: string) {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    console.log(`User not found: ${username}`);
    return { username, updated: false, createdAgent: false };
  }

  let updated = false;
  if (user.role !== "agent") {
    await storage.updateUser(user.id, { role: "agent" } as any);
    updated = true;
    console.log(`Updated role -> agent for user ${username} (id=${user.id})`);
  }

  const existingAgent = await storage.getAgentByUserId(user.id);
  if (existingAgent) {
    console.log(`Agent profile exists for ${username}: id=${existingAgent.id}, status=${existingAgent.approvalStatus}`);
    return { username, updated, createdAgent: false };
  }

  const names = (user.fullName || user.username || username).split(" ");
  const agentData = {
    userId: user.id,
    firstName: names[0] || user.username,
    lastName: names.slice(1).join(" ") || "",
    dateOfBirth: "1970-01-01",
    gender: "other",
    address: "",
    city: "",
    state: "",
    country: "Ethiopia",
    postalCode: "",
    idType: "national_id",
    idNumber: `PENDING-${user.id}`,
    idFrontImageUrl: "",
    idBackImageUrl: "",
    selfieImageUrl: ""
  } as any;

  const created = await storage.createAgent(agentData);
  console.log(`Created pending agent profile id=${created.id} for user ${username}`);
  return { username, updated, createdAgent: true };
}

(async () => {
  const usernames = process.argv.slice(2);
  if (usernames.length === 0) {
    console.log("Usage: fix-agent-users.ts <username> [username...]");
    process.exit(1);
  }

  for (const username of usernames) {
    try {
      await ensureAgent(username);
    } catch (err) {
      console.error(`Failed to fix agent user ${username}:`, err);
    }
  }

  process.exit(0);
})();
