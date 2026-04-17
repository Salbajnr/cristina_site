import { Router } from "express";
import { db } from "@workspace/db";
import { profileTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/profile", async (req, res) => {
  const profiles = await db.select().from(profileTable).limit(1);
  if (profiles.length === 0) {
    return res.status(404).json({ error: "Profile not found" });
  }
  const p = profiles[0];
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

router.get("/stats", async (req, res) => {
  const { contentTable } = await import("@workspace/db");
  const { count, sql } = await import("drizzle-orm");

  const allContent = await db.select().from(contentTable);
  const photos = allContent.filter((c) => c.type === "photo").length;
  const videos = allContent.filter((c) => c.type === "video").length;
  const bundles = allContent.filter((c) => c.type === "bundle").length;

  const profiles = await db.select().from(profileTable).limit(1);
  const subscriberCount = profiles[0]?.subscriberCount ?? 0;

  return res.json({
    totalContent: allContent.length,
    totalPhotos: photos,
    totalVideos: videos,
    totalBundles: bundles,
    subscriberCount,
  });
});

export default router;
