import { Request, Response, NextFunction } from "express";
import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      creatorUserId?: string;
    }
  }
}

export type AuthRequest = Request;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required by the API.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function getUserName(user: SupabaseUser, email: string, fallback?: string): string {
  const name = user.user_metadata?.name;
  return typeof name === "string" && name.trim()
    ? name.trim()
    : fallback || email.split("@")[0];
}

async function getLocalUserId(user: SupabaseUser): Promise<number | null> {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const [mappedUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.authUserId, user.id));

  if (mappedUser) {
    return mappedUser.id;
  }

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existingUser) {
    if (existingUser.authUserId || !user.email_confirmed_at) {
      return null;
    }

    const [linkedUser] = await db
      .update(usersTable)
      .set({
        authUserId: user.id,
        name: getUserName(user, email, existingUser.name),
        passwordHash: null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, existingUser.id))
      .returning({ id: usersTable.id });

    return linkedUser?.id ?? null;
  }

  const [createdUser] = await db
    .insert(usersTable)
    .values({
      authUserId: user.id,
      email,
      name: getUserName(user, email),
      passwordHash: null,
    })
    .onConflictDoNothing()
    .returning({ id: usersTable.id });

  if (createdUser) {
    return createdUser.id;
  }

  const [racedUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.authUserId, user.id));

  return racedUser?.id ?? null;
}

async function authenticateUser(token: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error) {
    if (error.status && error.status < 500) {
      logger.warn({ err: error }, "Supabase access token validation failed");
      return null;
    }
    throw error;
  }

  return data.user ? getLocalUserId(data.user) : null;
}

export async function verifyCreatorToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      logger.warn({ err: authError }, "Creator access token validation failed");
      return res.status(401).json({ error: "Invalid or expired creator session" });
    }

    const { data: creatorRole, error: roleError } = await supabaseAdmin
      .from("creator_roles")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (roleError) {
      logger.error({ err: roleError }, "Creator role lookup failed");
      return res.status(503).json({ error: "Authorization service unavailable" });
    }
    if (!creatorRole) {
      return res.status(403).json({ error: "Creator access required" });
    }

    req.creatorUserId = authData.user.id;
    return next();
  } catch (error) {
    logger.error({ err: error }, "Creator authentication failed");
    return res.status(503).json({ error: "Authentication service unavailable" });
  }
}

export async function verifyUserToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const userId = await authenticateUser(token);
    if (!userId) {
      return res.status(401).json({ error: "Invalid or unlinked account" });
    }
    req.userId = userId;
    return next();
  } catch (error) {
    logger.error({ err: error }, "User authentication failed");
    return res.status(503).json({ error: "Authentication service unavailable" });
  }
}

export async function optionalUserToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return next();
  }

  try {
    const userId = await authenticateUser(token);
    if (userId) {
      req.userId = userId;
    }
  } catch (error) {
    logger.error({ err: error }, "Optional user authentication failed");
    return res.status(503).json({ error: "Authentication service unavailable" });
  }

  return next();
}
