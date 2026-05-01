import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "./logger";

export interface AuthRequest extends Request {
  userId?: number;
  creatorToken?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function verifyCreatorToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const CREATOR_TOKEN = process.env.CREATOR_TOKEN || "cristina-creator-session-token-secure";
  
  if (token !== CREATOR_TOKEN) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.creatorToken = token;
  next();
}

export function verifyUserToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    logger.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalUserToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
  } catch (error) {
    logger.error("Token verification failed:", error);
  }
  
  next();
}

export function generateUserToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
