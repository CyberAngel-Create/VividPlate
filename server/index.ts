import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeFilenClient } from './filen-config';
import fs from 'fs';
import path from 'path';

// Initialize Filen client
try {
  initializeFilenClient();
  console.log('Filen client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Filen client:', error);
}

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

// Add health check endpoint while preserving SPA routing
app.get('/health', (req, res) => {
  res.status(200).send('OK');
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

(async () => {
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

  // Try to start server with retries and port fallback
  const startServer = async (initialPort = 5000) => {
    let port = initialPort;
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await new Promise((resolve, reject) => {
          server.listen({
            port,
            host: "0.0.0.0",
            reusePort: true,
          }, () => {
            log(`serving on port ${port}`);
            resolve(true);
          }).on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
              port++;
              reject(err);
            } else {
              reject(err);
            }
          });
        });
        break; // If successful, exit loop
      } catch (err) {
        if (attempt === maxRetries - 1) {
          throw err; // If all retries failed, throw error
        }
        log(`Port ${port-1} in use, trying ${port}...`);
      }
    }
  };

  try {
    await startServer();
  } catch (err) {
    log(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
})();
