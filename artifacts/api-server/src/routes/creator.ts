import { Router } from "express";
import { db } from "@workspace/db";
import { profileTable, contentTable, categoriesTable, purchasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const CREATOR_PASSWORD = process.env.CREATOR_PASSWORD ?? "cristina2024";
const CREATOR_TOKEN = "cristina-creator-session-token-secure";

router.post("/creator/verify", async (req, res) => {
  const { password } = req.body ?? {};
  if (!password || password !== CREATOR_PASSWORD) {
    return res.status(401).json({ success: false, token: "" });
  }
  return res.json({ success: true, token: CREATOR_TOKEN });
});

router.put("/profile", async (req, res) => {
  const { displayName, username, bio, avatarUrl, coverUrl, location } = req.body ?? {};
  const profiles = await db.select().from(profileTable).limit(1);
  if (profiles.length === 0) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const updates: Partial<typeof profileTable.$inferInsert> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (username !== undefined) updates.username = username;
  if (bio !== undefined) updates.bio = bio;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (coverUrl !== undefined) updates.coverUrl = coverUrl;
  if (location !== undefined) updates.location = location;

  const updated = await db
    .update(profileTable)
    .set(updates)
    .where(eq(profileTable.id, profiles[0].id))
    .returning();

  const p = updated[0];
  return res.json({
    id: p.id,
    displayName: p.displayName,
    username: p.username,
    bio: p.bio,
    avatarUrl: p.avatarUrl ?? undefined,
    coverUrl: p.coverUrl ?? undefined,
    location: p.location ?? undefined,
    subscriberCount: p.subscriberCount,
    totalPhotos: p.totalPhotos,
    totalVideos: p.totalVideos,
    joinedDate: p.joinedDate.toISOString(),
  });
});

router.post("/content", async (req, res) => {
  const { title, description, type, price, previewUrl, isLocked, isFeatured, categoryId, tags } = req.body ?? {};

  if (!title || !type || price === undefined || !previewUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const inserted = await db
    .insert(contentTable)
    .values({
      title,
      description: description ?? null,
      type,
      price: String(price),
      previewUrl,
      isLocked: isLocked ?? true,
      isFeatured: isFeatured ?? false,
      categoryId: categoryId ?? null,
      tags: tags ?? null,
      likeCount: 0,
      commentCount: 0,
    })
    .returning();

  const c = inserted[0];
  let categoryName: string | undefined;
  if (c.categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, c.categoryId));
    categoryName = cats[0]?.name;
  }

  await syncProfileCounts();

  return res.status(201).json({
    id: c.id,
    title: c.title,
    description: c.description ?? undefined,
    type: c.type as "photo" | "video" | "bundle",
    price: parseFloat(c.price as string),
    previewUrl: c.previewUrl,
    isLocked: c.isLocked,
    isFeatured: c.isFeatured,
    categoryId: c.categoryId ?? undefined,
    categoryName,
    likeCount: c.likeCount,
    commentCount: c.commentCount,
    createdAt: c.createdAt.toISOString(),
    tags: c.tags ?? [],
  });
});

router.put("/content/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const { title, description, type, price, previewUrl, isLocked, isFeatured, categoryId, tags } = req.body ?? {};

  const updates: Partial<typeof contentTable.$inferInsert> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (type !== undefined) updates.type = type;
  if (price !== undefined) updates.price = String(price);
  if (previewUrl !== undefined) updates.previewUrl = previewUrl;
  if (isLocked !== undefined) updates.isLocked = isLocked;
  if (isFeatured !== undefined) updates.isFeatured = isFeatured;
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (tags !== undefined) updates.tags = tags;

  const updated = await db
    .update(contentTable)
    .set(updates)
    .where(eq(contentTable.id, id))
    .returning();

  if (updated.length === 0) return res.status(404).json({ error: "Not found" });

  const c = updated[0];
  let categoryName: string | undefined;
  if (c.categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, c.categoryId));
    categoryName = cats[0]?.name;
  }

  await syncProfileCounts();

  return res.json({
    id: c.id,
    title: c.title,
    description: c.description ?? undefined,
    type: c.type as "photo" | "video" | "bundle",
    price: parseFloat(c.price as string),
    previewUrl: c.previewUrl,
    isLocked: c.isLocked,
    isFeatured: c.isFeatured,
    categoryId: c.categoryId ?? undefined,
    categoryName,
    likeCount: c.likeCount,
    commentCount: c.commentCount,
    createdAt: c.createdAt.toISOString(),
    tags: c.tags ?? [],
  });
});

router.delete("/content/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const deleted = await db.delete(contentTable).where(eq(contentTable.id, id)).returning();
  if (deleted.length === 0) return res.status(404).json({ error: "Not found" });

  await syncProfileCounts();

  return res.json({ success: true, id });
});

router.get("/purchases", async (req, res) => {
  const purchases = await db.select().from(purchasesTable).orderBy(purchasesTable.createdAt);
  return res.json(
    purchases.map((p) => ({
      id: p.id,
      contentId: p.contentId,
      contentTitle: p.contentTitle,
      customerEmail: p.customerEmail,
      amount: parseFloat(p.amount as string),
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

async function syncProfileCounts() {
  const allContent = await db.select().from(contentTable);
  const photos = allContent.filter((c) => c.type === "photo").length;
  const videos = allContent.filter((c) => c.type === "video").length;

  const profiles = await db.select().from(profileTable).limit(1);
  if (profiles.length > 0) {
    await db
      .update(profileTable)
      .set({ totalPhotos: photos, totalVideos: videos })
      .where(eq(profileTable.id, profiles[0].id));

    for (const cat of ["Photos", "Videos", "Bundles", "All"]) {
      const count = cat === "All"
        ? allContent.length
        : allContent.filter((c) => {
            if (cat === "Photos") return c.type === "photo";
            if (cat === "Videos") return c.type === "video";
            if (cat === "Bundles") return c.type === "bundle";
            return false;
          }).length;

      await db
        .update(categoriesTable)
        .set({ itemCount: count })
        .where(eq(categoriesTable.name, cat));
    }
  }
}

export default router;
