import { Router } from "express";
import { and, count, eq, sql } from "drizzle-orm";
import { contentTable, db, likesTable, postsTable } from "@workspace/db";
import { optionalUserToken, verifyUserToken } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
const targetTypes = ["content", "post"] as const;
type TargetType = (typeof targetTypes)[number];

function parseTarget(type: string, rawId: string): { type: TargetType; id: number } | null {
  const id = Number(rawId);
  if (!targetTypes.includes(type as TargetType) || !Number.isSafeInteger(id) || id < 1) {
    return null;
  }
  return { type: type as TargetType, id };
}

async function targetExists(type: TargetType, id: number) {
  const [target] =
    type === "content"
      ? await db.select({ id: contentTable.id }).from(contentTable).where(eq(contentTable.id, id)).limit(1)
      : await db.select({ id: postsTable.id }).from(postsTable).where(eq(postsTable.id, id)).limit(1);
  return Boolean(target);
}

async function getLikeSummary(type: TargetType, id: number, userId?: number) {
  const [likeCount] =
    type === "content"
      ? await db.select({ count: contentTable.likeCount }).from(contentTable).where(eq(contentTable.id, id))
      : await db
          .select({ count: count() })
          .from(likesTable)
          .where(and(eq(likesTable.targetType, type), eq(likesTable.targetId, id)));

  const [like] = userId
    ? await db
        .select({ id: likesTable.id })
        .from(likesTable)
        .where(
          and(
            eq(likesTable.userId, userId),
            eq(likesTable.targetType, type),
            eq(likesTable.targetId, id),
          ),
        )
        .limit(1)
    : [];

  return { count: Number(likeCount?.count ?? 0), isLiked: Boolean(like) };
}

router.get("/:type/:id", optionalUserToken, async (req, res) => {
  const target = parseTarget(req.params.type, req.params.id);
  if (!target) return res.status(400).json({ error: "Invalid like target" });

  try {
    if (!(await targetExists(target.type, target.id))) {
      return res.status(404).json({ error: "Target not found" });
    }

    return res.json(await getLikeSummary(target.type, target.id, req.userId));
  } catch (error) {
    logger.error({ err: error }, "Get like state error");
    return res.status(500).json({ error: "Failed to get like state" });
  }
});

router.put("/:type/:id", verifyUserToken, async (req, res) => {
  const target = parseTarget(req.params.type, req.params.id);
  if (!target) return res.status(400).json({ error: "Invalid like target" });
  if (typeof req.body?.liked !== "boolean") {
    return res.status(400).json({ error: "liked must be a boolean" });
  }

  try {
    if (!(await targetExists(target.type, target.id))) {
      return res.status(404).json({ error: "Target not found" });
    }

    await db.transaction(async (tx) => {
      const filter = and(
        eq(likesTable.userId, req.userId!),
        eq(likesTable.targetType, target.type),
        eq(likesTable.targetId, target.id),
      );

      if (req.body.liked) {
        const [inserted] = await tx
          .insert(likesTable)
          .values({ userId: req.userId!, targetType: target.type, targetId: target.id })
          .onConflictDoNothing()
          .returning({ id: likesTable.id });

        if (inserted && target.type === "content") {
          await tx
            .update(contentTable)
            .set({ likeCount: sql`${contentTable.likeCount} + 1` })
            .where(eq(contentTable.id, target.id));
        }
      } else {
        const [deleted] = await tx
          .delete(likesTable)
          .where(filter)
          .returning({ id: likesTable.id });

        if (deleted && target.type === "content") {
          await tx
            .update(contentTable)
            .set({ likeCount: sql`greatest(${contentTable.likeCount} - 1, 0)` })
            .where(eq(contentTable.id, target.id));
        }
      }
    });

    return res.json(await getLikeSummary(target.type, target.id, req.userId));
  } catch (error) {
    logger.error({ err: error }, "Update like state error");
    return res.status(500).json({ error: "Failed to update like state" });
  }
});

export default router;
