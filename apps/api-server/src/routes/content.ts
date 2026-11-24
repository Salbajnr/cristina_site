import { Router } from "express";
import { db } from "@workspace/db";
import { contentTable, categoriesTable, contentCommentsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";

const router = Router();

function formatContent(c: typeof contentTable.$inferSelect, categoryName?: string) {
  return {
    id: c.id,
    title: c.title,
    description: c.description ?? undefined,
    type: c.type as "photo" | "video" | "bundle",
    price: parseFloat(c.price as string),
    previewUrl: c.previewUrl,
    isLocked: c.isLocked,
    isFeatured: c.isFeatured,
    categoryId: c.categoryId ?? undefined,
    categoryName: categoryName ?? undefined,
    likeCount: c.likeCount,
    commentCount: c.commentCount,
    createdAt: c.createdAt.toISOString(),
    tags: c.tags ?? [],
  };
}

router.get("/content", async (req, res) => {
  const { categoryId, type } = req.query;

  let items = await db.select().from(contentTable);

  if (categoryId) {
    const catId = parseInt(categoryId as string);
    items = items.filter((c) => c.categoryId === catId);
  }

  if (type) {
    items = items.filter((c) => c.type === type);
  }

  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return res.json(items.map((c) => formatContent(c, c.categoryId ? catMap.get(c.categoryId) : undefined)));
});

router.get("/content/featured", async (req, res) => {
  const items = await db
    .select()
    .from(contentTable)
    .where(eq(contentTable.isFeatured, true));

  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return res.json(items.map((c) => formatContent(c, c.categoryId ? catMap.get(c.categoryId) : undefined)));
});

router.get("/content/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const items = await db
    .select()
    .from(contentTable)
    .where(eq(contentTable.id, id));

  if (items.length === 0) {
    return res.status(404).json({ error: "Not found" });
  }

  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const c = items[0];

  return res.json(formatContent(c, c.categoryId ? catMap.get(c.categoryId) : undefined));
});

router.get("/content/:id/comments", async (req, res) => {
  const contentId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(contentId) || contentId <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const [content] = await db.select({ id: contentTable.id }).from(contentTable).where(eq(contentTable.id, contentId));
  if (!content) return res.status(404).json({ error: "Not found" });

  const comments = await db
    .select()
    .from(contentCommentsTable)
    .where(eq(contentCommentsTable.contentId, contentId))
    .orderBy(desc(contentCommentsTable.createdAt));
  return res.json(comments);
});

router.post("/content/:id/comments", async (req, res) => {
  const contentId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(contentId) || contentId <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const authorName = typeof req.body?.authorName === "string" ? req.body.authorName.trim() : "";
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!authorName || authorName.length > 100 || !body || body.length > 2000) {
    return res.status(400).json({ error: "Name and comment are required (maximum 100 and 2000 characters)." });
  }

  const [content] = await db.select({ id: contentTable.id }).from(contentTable).where(eq(contentTable.id, contentId));
  if (!content) return res.status(404).json({ error: "Not found" });

  const [comment] = await db.insert(contentCommentsTable).values({ contentId, authorName, body }).returning();
  await db
    .update(contentTable)
    .set({ commentCount: sql`${contentTable.commentCount} + 1` })
    .where(eq(contentTable.id, contentId));
  return res.status(201).json(comment);
});

export default router;
