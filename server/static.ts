import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Try multiple possible locations for the public directory
  const candidates = [
    path.resolve(__dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
  ];
  const distPath = candidates.find(p => fs.existsSync(p)) || candidates[0];
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html only for non-API routes (SPA client-side routing)
  app.use("*", (_req, res) => {
    if (_req.originalUrl.startsWith("/api/") || _req.originalUrl.startsWith("/uploads/")) {
      res.status(404).json({ message: "Route non trouvée" });
      return;
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
