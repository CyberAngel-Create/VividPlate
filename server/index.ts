import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import session from "express-session";
import memorystore from "memorystore";

// ==============================
// Local storage setup
// ==============================
console.log("Using local storage for all file operations");

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at ${uploadsDir}`);
} else {
  console.log(`Using existing uploads directory at ${uploadsDir}`);
}

try {
  const testFile = path.join(uploadsDir, `test-${Date.now()}.txt`);
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
  console.log("Uploads directory is writable");
} catch (err) {
  console.error("Uploads directory is NOT writable", err);
}

// ==============================
// Express app
// ==============================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ==============================
// CORS
// ==============================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://digitalmenumate.replit.app",
    "https://vividplate.com",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ==============================
// Health check (Cloud Run)
// ==============================
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
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

// ==============================
// Routes & services
// ==============================
import { registerRoutes } from "./routes";
import { DatabaseHealth } from "./database-health";

// ==============================
// Telegram bot
// ==============================
async function startTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log("⚠️ Telegram bot disabled (no token)");
    return;
  }

  try {
    const { spawn } = await import("child_process");
    const bot = spawn("node", ["run-telegram-bot.js"], {
      stdio: "inherit",
    });

    console.log("🤖 Telegram bot started");
    bot.on("exit", (code) =>
      console.log(`🤖 Bot exited with code ${code}`)
    );
  } catch (err) {
    console.error("❌ Failed to start Telegram bot", err);
  }
}

// ==============================
// App startup (Cloud Run SAFE)
// ==============================
(async () => {
  const PORT = Number(process.env.PORT) || 8080;
  let dbReady = false;

  console.log("🚀 Starting application...");

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

  // 🔥 LISTEN IMMEDIATELY (Cloud Run requirement)
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });

  // ==============================
  // Background checks AFTER listen
  // ==============================
  console.log("🔍 Validating environment...");
  const envCheck = DatabaseHealth.validateEnvironment();

  if (envCheck.valid) {
    console.log("🔍 Connecting to database...");
    dbReady = await DatabaseHealth.waitForDatabase(5, 2000);

    if (dbReady) {
      console.log("✅ Database connected");
      startTelegramBot();
    } else {
      console.log("⚠️ Database not ready (limited mode)");
    }
  } else {
    console.log("⚠️ Missing env vars:", envCheck.missing);
  }

  // ==============================
  // Graceful shutdown
  // ==============================
  const shutdown = (signal: string) => {
    console.log(`🛑 ${signal} received`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
})().catch((err) => {
  console.error("💥 Startup failed", err);
  process.exit(1);
});
