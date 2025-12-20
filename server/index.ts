import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import fs from 'fs';
import path from 'path';
import session from 'express-session';
import memorystore from 'memorystore';

// We're using only local storage for all file operations
console.log('Using local storage for all file operations');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at ${uploadsDir}`);
} else {
  console.log(`Using existing uploads directory at ${uploadsDir}`);
}

// Test uploads directory is writable
try {
  const testFile = path.join(uploadsDir, `test-${Date.now()}.txt`);
  fs.writeFileSync(testFile, 'Test write permission');
  fs.unlinkSync(testFile);
  console.log('Uploads directory is writable');
} catch (error) {
  console.error('ERROR: Uploads directory is not writable:', error);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for custom domain support
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://digitalmenumate.replit.app',
    'https://vividplate.com',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Add health check endpoint while preserving SPA routing
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Add domain-specific handling for custom domain
app.use((req, res, next) => {
  const host = req.headers.host;
  
  // Log requests to help debug domain issues
  if (host === 'vividplate.com' || host === 'www.vividplate.com') {
    console.log(`Custom domain request: ${req.method} ${req.url} from ${host}`);
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Import routes and database health check
import { registerRoutes } from "./routes";
import { testBackblazeConnection } from './backblaze-config';
import { DatabaseHealth } from './database-health';

// Telegram bot startup function
async function startTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN not provided - Telegram bot disabled');
    return;
  }

  try {
    // Import and run the bot as a module
    const { spawn } = await import('child_process');
    const botProcess = spawn('node', ['run-telegram-bot.js'], {
      detached: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    botProcess.stdout?.on('data', (data) => {
      console.log(`🤖 Bot: ${data.toString().trim()}`);
    });

    botProcess.stderr?.on('data', (data) => {
      console.error(`🤖 Bot Error: ${data.toString().trim()}`);
    });

    botProcess.on('close', (code) => {
      console.log(`🤖 Bot process exited with code ${code}`);
    });

    console.log('🤖 Telegram bot started successfully');
  } catch (error) {
    console.error('❌ Failed to start Telegram bot:', error);
  }
}

(async () => {
  const port = parseInt(process.env.PORT || '5000', 10);
  let dbReady = false;

  // Validate environment variables first
  console.log('🔍 Validating environment configuration...');
  const envCheck = DatabaseHealth.validateEnvironment();
  if (!envCheck.valid) {
    console.error('⚠️ Missing environment variables:', envCheck.missing);
    console.log('⚠️ Starting in limited mode - some features may not work');
  } else {
    console.log('✅ Environment variables validated');
    
    // Test database connection with retry logic
    console.log('🔍 Testing database connection...');
    dbReady = await DatabaseHealth.waitForDatabase(5, 2000);
    if (!dbReady) {
      console.error('⚠️ Database connection failed - starting in limited mode');
    } else {
      console.log('✅ Database connection established');
    }
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    console.log('🚀 Application started successfully');
    
    // Start Telegram bot only if database is ready
    if (dbReady) {
      startTelegramBot();
    }
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

})().catch((error) => {
  console.error('💥 Failed to start application:', error);
  process.exit(1);
});