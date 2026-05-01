import { Router } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { purchasesTable, contentTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { optionalUserToken } from "../middlewares/auth";
import { sendPurchaseConfirmation } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acpi.3",
});

// Get all purchases
router.get("/purchases", optionalUserToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const purchases = await db
      .select()
      .from(purchasesTable)
      .where(eq(purchasesTable.userId, req.userId));

    return res.json(
      purchases.map((p) => ({
        id: p.id,
        contentId: p.contentId,
        contentTitle: p.contentTitle,
        amount: parseFloat(p.amount as string),
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    logger.error("Get purchases error:", error);
    res.status(500).json({ error: "Failed to get purchases" });
  }
});

// Get single purchase
router.get("/purchases/:id", optionalUserToken, async (req, res) => {
  try {
    const purchaseId = parseInt(req.params.id);

    const purchases = await db
      .select()
      .from(purchasesTable)
      .where(eq(purchasesTable.id, purchaseId));

    if (purchases.length === 0) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const purchase = purchases[0];

    // Check access: either user owns it or is creator
    if (purchase.userId && req.userId !== purchase.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    return res.json({
      id: purchase.id,
      contentId: purchase.contentId,
      contentTitle: purchase.contentTitle,
      amount: parseFloat(purchase.amount as string),
      status: purchase.status,
      createdAt: purchase.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("Get purchase error:", error);
    res.status(500).json({ error: "Failed to get purchase" });
  }
});

// Create checkout session (for Stripe)
router.post("/purchases/checkout-session", optionalUserToken, async (req, res) => {
  try {
    const { contentId, success_url, cancel_url } = req.body;

    if (!contentId || !success_url || !cancel_url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const contentItems = await db
      .select()
      .from(contentTable)
      .where(eq(contentTable.id, contentId));

    if (contentItems.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    const content = contentItems[0];
    const amount = Math.round(parseFloat(content.price as string) * 100); // Convert to cents

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: content.title,
              description: content.description || undefined,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url,
      cancel_url,
      metadata: {
        contentId: content.id,
        userId: req.userId || null,
      },
    });

    return res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error("Checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Webhook handler for Stripe
router.post("/purchases/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const contentId = parseInt(session.metadata?.contentId || "0");
      const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;

      // Get content details
      const contentItems = await db
        .select()
        .from(contentTable)
        .where(eq(contentTable.id, contentId));

      if (contentItems.length === 0) {
        logger.error("Content not found for webhook:", contentId);
        return res.status(404).json({ error: "Content not found" });
      }

      const content = contentItems[0];
      const amount = (session.amount_total || 0) / 100; // Convert from cents

      // Get customer info from session
      const customerEmail = session.customer_details?.email || "";
      const customerName = session.customer_details?.name || "Valued Customer";

      // Create purchase record
      const purchases = await db
        .insert(purchasesTable)
        .values({
          userId,
          contentId,
          contentTitle: content.title,
          customerEmail,
          customerName,
          amount: amount.toString(),
          status: "completed",
          paymentMethod: "card",
          stripePaymentIntentId: session.payment_intent as string,
        })
        .returning();

      const purchase = purchases[0];

      // Send confirmation email
      try {
        await sendPurchaseConfirmation(
          customerEmail,
          customerName,
          content.title,
          amount,
          contentId,
          purchase.id
        );
      } catch (emailError) {
        logger.error("Failed to send purchase confirmation email:", emailError);
      }

      logger.info(`Purchase completed: ${purchase.id}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error("Webhook error:", error);
    res.status(400).json({ error: "Webhook error" });
  }
});

// Create purchase (legacy, for direct API calls without Stripe for now)
router.post("/purchases", optionalUserToken, async (req, res) => {
  try {
    const { contentId, customerEmail, customerName, paymentMethod } = req.body;

    if (!contentId || !customerEmail || !customerName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
        userId: req.userId || null,
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

    // Send confirmation email
    try {
      await sendPurchaseConfirmation(customerEmail, customerName, content.title, amount, contentId, purchase.id);
    } catch (emailError) {
      logger.error("Failed to send purchase confirmation email:", emailError);
    }

    return res.status(201).json({
      id: purchase.id,
      contentId: purchase.contentId,
      contentTitle: purchase.contentTitle,
      customerEmail: purchase.customerEmail,
      amount: parseFloat(purchase.amount as string),
      status: purchase.status,
      createdAt: purchase.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("Create purchase error:", error);
    res.status(500).json({ error: "Failed to create purchase" });
  }
});

export default router;

