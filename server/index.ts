import dotenv from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite.js";
import fs from "fs";
import path from "path";
import session from "express-session";
import memorystore from "memorystore";

// Load environment variables FIRST
dotenv.config({ path: path.join(process.cwd(), '.env') });

// We're using only local storage for all file operations
console.log("Using local storage for all file operations");

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at ${uploadsDir}`);
} else {
  console.log(`Using existing uploads directory at ${uploadsDir}`);
}

try {
  const testFile = path.join(uploadsDir, `test-${Date.now()}.txt`);
  fs.writeFileSync(testFile, "Test write permission");
  fs.unlinkSync(testFile);
  console.log("Uploads directory is writable");
} catch (error) {
  console.error("ERROR: Uploads directory is not writable:", error);
}

// ==============================
// Express app
// ==============================
const app = express();
// Increase payload limits to allow larger JSON bodies (e.g., base64 image strings)
// Default express.json limit is 100kb which can cause 413 errors on registration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ==============================
// CORS
// ==============================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://vividplate.com,http://localhost:5000,http://127.0.0.1:5000")
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Add health check endpoint while preserving SPA routing
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ads.txt handler removed

// Add domain-specific handling for custom domain
app.use((req, res, next) => {
  const host = req.headers.host;

  // Log requests to help debug domain issues
  if (host === "vividplate.com" || host === "www.vividplate.com") {
    console.log(`Custom domain request: ${req.method} ${req.url} from ${host}`);
  }

  next();
});

// ==============================
// Request logging
// ==============================
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJson: any;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJson = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (reqPath.startsWith("/api")) {
      const duration = Date.now() - start;
      let msg = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJson) msg += ` :: ${JSON.stringify(capturedJson)}`;
      log(msg.length > 80 ? msg.slice(0, 80) + "…" : msg);
    }
  });

  next();
});

// Import routes and database health check
import { registerRoutes } from "./routes.js";
import { testBackblazeConnection } from "./backblaze-config.js";
import { DatabaseHealth } from "./database-health.js";

// ==============================
// Telegram bot
// ==============================
async function startTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN not provided - Telegram bot disabled");
    return;
  }
  try {
    // Initialize the Telegram bot in-process by importing the service module.
    // This avoids relying on a separate script file being present after build/deploy
    const mod = await import("./telegram-service.js");
    // The module exports `telegramService` which initializes itself on import
    if (mod && mod.telegramService && typeof mod.telegramService.isEnabled === 'function') {
      if (mod.telegramService.isEnabled()) {
        console.log('🤖 Telegram bot initialized in-process');
      } else {
        console.log('⚠️ Telegram service module loaded but bot is disabled');
      }
    } else {
      console.log('🤖 Telegram module imported');
    }
  } catch (error) {
    console.error("❌ Failed to initialize Telegram service:", error);
  }
}

// ==============================
// App startup (Cloud Run SAFE)
// ==============================
(async () => {
  const port = parseInt(process.env.PORT || "5000", 10);
  let dbReady = false;

  // Validate environment variables first
  console.log("🔍 Validating environment configuration...");
  const envCheck = DatabaseHealth.validateEnvironment();
  if (!envCheck.valid) {
    console.error("⚠️ Missing environment variables:", envCheck.missing);
    console.log("⚠️ Starting in limited mode - some features may not work");
  } else {
    console.log("✅ Environment variables validated");

    // Test database connection with retry logic
    console.log("🔍 Testing database connection...");
    dbReady = await DatabaseHealth.waitForDatabase(5, 2000);
    if (!dbReady) {
      console.error("⚠️ Database connection failed - starting in limited mode");
    } else {
      console.log("✅ Database connection established");
    }
  }

  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("❌ API Error:", err);
    res.status(err.status || 500).json({ message: err.message || "Error" });
  });

  // Vite dev / static prod
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    console.log("🚀 Application started successfully");

    // Start Telegram bot only if database is ready
    if (dbReady) {
      startTelegramBot();
    }
  });

  // ==============================
  // Graceful shutdown handling
  // ==============================
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    server.close((err) => {
      if (err) {
        console.error("❌ Error during server shutdown:", err);
        process.exit(1);
      }

      console.log("✅ Server closed successfully");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error("⚠️ Forcing shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception:", error);
    gracefulShutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("unhandledRejection");
  });
})().catch((error) => {
  console.error("💥 Failed to start application:", error);
  process.exit(1);
});
