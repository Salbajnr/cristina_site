import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, commentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Public: list all posts
router.get("/posts", async (_req, res) => {
  const posts = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.createdAt));
  return res.json(posts);
});

// Public: get single post
router.get("/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(post);
});

// Creator: create post
router.post("/creator/posts", async (req, res) => {
  const { type, title, body, mediaUrl } = req.body ?? {};
  if (!body) return res.status(400).json({ error: "Body is required" });

  const [post] = await db
    .insert(postsTable)
    .values({ type: type || "text", title: title || null, body, mediaUrl: mediaUrl || null })
    .returning();
  return res.status(201).json(post);
});

// Creator: delete post
router.delete("/creator/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(postsTable).where(eq(postsTable.id, id));
  await db.delete(commentsTable).where(eq(commentsTable.postId, id));
  return res.json({ success: true, id });
});

// Public: list comments for a post
router.get("/posts/:id/comments", async (req, res) => {
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid id" });
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, postId))
    .orderBy(desc(commentsTable.createdAt));
  return res.json(comments);
});

// Public: add comment to a post
router.post("/posts/:id/comments", async (req, res) => {
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid id" });

  const { authorName, body } = req.body ?? {};
  if (!authorName || !body) return res.status(400).json({ error: "authorName and body are required" });

  const [comment] = await db
    .insert(commentsTable)
    .values({ postId, authorName, body })
    .returning();
  return res.status(201).json(comment);
});

export default router;
