import { Router } from "express";
import { db } from "@workspace/db";
import { inquiriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { verifyCreatorToken } from "../middlewares/auth";
import { sendInquiryReply, sendNewInquiryNotification } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

router.post("/inquiries", async (req, res) => {
  try {
    const { name, email, whatsapp, message } = req.body ?? {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email and message are required" });
    }

    const [inquiry] = await db
      .insert(inquiriesTable)
      .values({ name, email, whatsapp: whatsapp || null, message, isRead: false })
      .returning();

    // Send notification to admin
    try {
      await sendNewInquiryNotification(name, email, message);
    } catch (emailError) {
      logger.error("Failed to send inquiry notification:", emailError);
    }

    return res.status(201).json(inquiry);
  } catch (error) {
    logger.error("Create inquiry error:", error);
    res.status(500).json({ error: "Failed to create inquiry" });
  }
});

router.get("/creator/inquiries", verifyCreatorToken, async (req, res) => {
  try {
    const inquiries = await db
      .select()
      .from(inquiriesTable)
      .orderBy(desc(inquiriesTable.createdAt));

    return res.json(inquiries);
  } catch (error) {
    logger.error("Get inquiries error:", error);
    res.status(500).json({ error: "Failed to get inquiries" });
  }
});

router.put("/creator/inquiries/:id/read", verifyCreatorToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [updated] = await db
      .update(inquiriesTable)
      .set({ isRead: true })
      .where(eq(inquiriesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (error) {
    logger.error("Mark inquiry read error:", error);
    res.status(500).json({ error: "Failed to mark inquiry as read" });
  }
});

router.post("/creator/inquiries/:id/reply", verifyCreatorToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const { replyMessage } = req.body;
    if (!replyMessage) {
      return res.status(400).json({ error: "Reply message is required" });
    }

    const inquiries = await db
      .select()
      .from(inquiriesTable)
      .where(eq(inquiriesTable.id, id));

    if (inquiries.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const inquiry = inquiries[0];

    // Send reply email
    try {
      await sendInquiryReply(inquiry.email, inquiry.name, replyMessage);
    } catch (emailError) {
      logger.error("Failed to send reply email:", emailError);
      return res.status(500).json({ error: "Failed to send reply email" });
    }

    // Mark as read
    const updated = await db
      .update(inquiriesTable)
      .set({ isRead: true })
      .where(eq(inquiriesTable.id, id))
      .returning();

    return res.json({
      success: true,
      inquiry: updated[0],
      message: "Reply sent successfully",
    });
  } catch (error) {
    logger.error("Reply to inquiry error:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
});

export default router;
