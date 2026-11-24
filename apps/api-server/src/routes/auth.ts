import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyUserToken } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/auth/me", verifyUserToken, async (req, res) => {
  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!));

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    logger.error({ err: error }, "Get user error");
    return res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
