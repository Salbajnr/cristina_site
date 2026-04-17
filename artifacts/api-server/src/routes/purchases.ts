import { Router } from "express";
import { db } from "@workspace/db";
import { purchasesTable, contentTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePurchaseBody } from "@workspace/api-zod";

const router = Router();

router.post("/purchases", async (req, res) => {
  const parseResult = CreatePurchaseBody.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid request", details: parseResult.error });
  }

  const { contentId, customerEmail, customerName, paymentMethod } = parseResult.data;

  const contentItems = await db
    .select()
    .from(contentTable)
    .where(eq(contentTable.id, contentId));

  if (contentItems.length === 0) {
    return res.status(404).json({ error: "Content not found" });
  }

  const content = contentItems[0];
  const amount = parseFloat(content.price as string);

  const inserted = await db
    .insert(purchasesTable)
    .values({
      contentId,
      contentTitle: content.title,
      customerEmail,
      customerName,
      amount: content.price as string,
      status: "completed",
      paymentMethod: paymentMethod ?? "card",
    })
    .returning();

  const purchase = inserted[0];

  return res.status(201).json({
    id: purchase.id,
    contentId: purchase.contentId,
    contentTitle: purchase.contentTitle,
    customerEmail: purchase.customerEmail,
    amount: parseFloat(purchase.amount as string),
    status: purchase.status,
    createdAt: purchase.createdAt.toISOString(),
  });
});

export default router;
