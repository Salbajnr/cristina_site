import { Router } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { purchasesTable, contentTable, usersTable, subscriptionsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { optionalUserToken, verifyUserToken } from "../middlewares/auth";
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
router.post("/purchases/checkout-session", verifyUserToken, async (req, res) => {
  try {
    const { contentId } = req.body ?? {};

    if (!Number.isSafeInteger(contentId) || contentId < 1) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let appUrl: URL;
    try {
      appUrl = new URL(process.env.APP_URL || "http://localhost:5173");
    } catch {
      return res.status(500).json({ error: "APP_URL is not a valid URL" });
    }

    if (req.get("origin") !== appUrl.origin) {
      return res.status(403).json({ error: "Checkout origin is not allowed" });
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
      success_url: new URL("/checkout/success?session_id={CHECKOUT_SESSION_ID}", appUrl).toString(),
      cancel_url: new URL(`/content/${content.id}`, appUrl).toString(),
      metadata: {
        contentId: content.id,
        userId: String(req.userId),
      },
    });

    if (!session.url) {
      return res.status(502).json({ error: "Stripe did not return a checkout URL" });
    }

    return res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error("Checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/purchases/checkout-session/:id", verifyUserToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    if (session.metadata?.userId !== String(req.userId)) {
      return res.status(403).json({ error: "Checkout session does not belong to this account" });
    }

    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return res.json({ status: "processing" });
    }

    if (session.mode === "subscription") {
      const stripeSubscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!stripeSubscriptionId) {
        return res.json({ status: "processing" });
      }

      const [subscription] = await db
        .select({ status: subscriptionsTable.status, plan: subscriptionsTable.plan })
        .from(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.userId, req.userId!),
            eq(subscriptionsTable.stripeSubscriptionId, stripeSubscriptionId),
          ),
        )
        .limit(1);

      if (!subscription || !["active", "trialing"].includes(subscription.status)) {
        return res.json({ status: "processing" });
      }

      return res.json({ status: "complete", type: "subscription", plan: subscription.plan });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) {
      return res.json({ status: "processing" });
    }

    const [purchase] = await db
      .select({ contentId: purchasesTable.contentId })
      .from(purchasesTable)
      .where(
        and(
          eq(purchasesTable.userId, req.userId!),
          eq(purchasesTable.stripePaymentIntentId, paymentIntentId),
          eq(purchasesTable.status, "completed"),
        ),
      )
      .limit(1);

    if (!purchase) {
      return res.json({ status: "processing" });
    }

    return res.json({ status: "complete", type: "content", contentId: purchase.contentId });
  } catch (error) {
    logger.error({ err: error }, "Verify checkout session error");
    return res.status(502).json({ error: "Unable to verify checkout status" });
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

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = Number(subscription.metadata.userId);
      const plan = subscription.metadata.plan;

      if (!Number.isSafeInteger(userId) || userId < 1 || !plan) {
        logger.error({ subscriptionId: subscription.id }, "Subscription webhook is missing account metadata");
        return res.status(400).json({ error: "Subscription metadata is incomplete" });
      }

      await db
        .insert(subscriptionsTable)
        .values({
          userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id ?? null,
          plan,
          status: subscription.status,
        })
        .onConflictDoUpdate({
          target: subscriptionsTable.stripeSubscriptionId,
          set: {
            stripeCustomerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer?.id ?? null,
            plan,
            status: subscription.status,
            updatedAt: new Date(),
          },
        });
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription") {
        return res.json({ received: true });
      }

      const contentId = parseInt(session.metadata?.contentId || "0");
      const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
      if (!Number.isSafeInteger(contentId) || contentId < 1 || !Number.isSafeInteger(userId) || !userId) {
        logger.error({ sessionId: session.id }, "Content checkout webhook is missing account metadata");
        return res.status(400).json({ error: "Checkout metadata is incomplete" });
      }
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      if (!paymentIntentId) {
        logger.error({ sessionId: session.id }, "Paid checkout session is missing its payment intent");
        return res.status(400).json({ error: "Payment intent is missing" });
      }

      const [existingPurchase] = await db
        .select({ id: purchasesTable.id })
        .from(purchasesTable)
        .where(eq(purchasesTable.stripePaymentIntentId, paymentIntentId))
        .limit(1);
      if (existingPurchase) {
        return res.json({ received: true });
      }

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
          stripePaymentIntentId: paymentIntentId,
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

