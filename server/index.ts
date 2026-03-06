import 'dotenv/config';
import 'express-async-errors';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startReminderScheduler } from "./scheduler";
import { seedDefaultAdmin } from "./seed-admin";
import { ensureSchemaSync } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  const port = parseInt(process.env.PORT || "5000", 10);
  let isReady = false;

  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      if (!isReady && !req.path.startsWith("/health")) {
        return res.status(200).send("<!DOCTYPE html><html><head><meta http-equiv='refresh' content='3'></head><body><p>Starting...</p></body></html>");
      }
      next();
    });

    httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`listening on port ${port} (initializing...)`);
    });
  }

  await ensureSchemaSync();
  await registerRoutes(httpServer, app);
  
  await seedDefaultAdmin();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[Error] ${status} - ${message}`, err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
    isReady = true;
    log(`serving on port ${port}`);
    startReminderScheduler();
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
    httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`serving on port ${port}`);
      startReminderScheduler();
    });
  }
})();
