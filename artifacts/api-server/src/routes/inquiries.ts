import { Router } from "express";
import { db } from "@workspace/db";
import { inquiriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

const router = Router();

router.post("/inquiries", async (req, res) => {
  const { name, email, whatsapp, message } = req.body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required" });
  }

  const [inquiry] = await db
    .insert(inquiriesTable)
    .values({ name, email, whatsapp: whatsapp || null, message })
    .returning();

  return res.status(201).json(inquiry);
});

router.get("/creator/inquiries", async (req, res) => {
  const inquiries = await db
    .select()
    .from(inquiriesTable)
    .orderBy(desc(inquiriesTable.createdAt));

  return res.json(inquiries);
});

router.put("/creator/inquiries/:id/read", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [updated] = await db
    .update(inquiriesTable)
    .set({ isRead: true })
    .where(eq(inquiriesTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
});

export default router;
