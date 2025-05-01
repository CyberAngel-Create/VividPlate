import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { and, eq } from "drizzle-orm";
import { users } from "../shared/schema";
import { pool, db } from "../server/db";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log("Creating admin user...");
    
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmin.length > 0) {
      console.log("Admin user already exists");
      await pool.end();
      return;
    }
    
    // Create admin user
    const hashedPassword = await hashPassword("admin1234");
    
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@digitamenumate.com",
      fullName: "System Administrator",
      isAdmin: true,
      isActive: true,
    }).returning();
    
    console.log("Admin user created successfully:", adminUser);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await pool.end();
  }
}

createAdminUser();