import type { VercelRequest, VercelResponse } from "@vercel/web-frameworks/express";

// Dynamic import to avoid issues at build time
let app: any;

async function getApp() {
  if (app) return app;
  const { default: appModule } = await import("../artifacts/api-server/dist/index.mjs");
  app = appModule;
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  return expressApp(req, res);
}

