import { db } from './db';
import { users } from '../shared/schema';

/**
 * Database health check and connection validation
 */
export class DatabaseHealth {
  
  /**
   * Check if database connection is working
   */
  static async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      // Try a simple query to test connection
      await db.select().from(users).limit(1);
      return { connected: true };
    } catch (error) {
      console.error('Database connection failed:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Validate that all required environment variables are present
   */
  static validateEnvironment(): { valid: boolean; missing: string[] } {
    const required = ['DATABASE_URL'];
    const missing: string[] = [];

    for (const envVar of required) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Full health check including environment and connection
   */
  static async fullHealthCheck(): Promise<{
    healthy: boolean;
    environment: { valid: boolean; missing: string[] };
    database: { connected: boolean; error?: string };
  }> {
    const environment = this.validateEnvironment();
    const database = await this.checkConnection();

    return {
      healthy: environment.valid && database.connected,
      environment,
      database
    };
  }

  /**
   * Wait for database to be ready with retry logic
   */
  static async waitForDatabase(maxRetries: number = 10, delayMs: number = 1000): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Database connection attempt ${attempt}/${maxRetries}`);
      
      const { connected } = await this.checkConnection();
      if (connected) {
        console.log('Database connection established successfully');
        return true;
      }

      if (attempt < maxRetries) {
        console.log(`Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.error('Failed to establish database connection after all retries');
    return false;
  }
}