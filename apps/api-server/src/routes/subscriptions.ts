import { Router } from "express";
import Stripe from "stripe";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { verifyUserToken } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acpi.3",
});

const plans = {
  monthly: {
    amount: 1999,
    interval: "month" as const,
    intervalCount: 1,
    name: "Monthly membership",
  },
  quarterly: {
    amount: 4497,
    interval: "month" as const,
    intervalCount: 3,
    name: "3-month membership",
  },
  annual: {
    amount: 11988,
    interval: "year" as const,
    intervalCount: 1,
    name: "Annual membership",
  },
};

router.get("/me", verifyUserToken, async (req, res) => {
  try {
    const subscriptions = await db
      .select({
        plan: subscriptionsTable.plan,
        status: subscriptionsTable.status,
        createdAt: subscriptionsTable.createdAt,
      })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, req.userId!),
          inArray(subscriptionsTable.status, ["active", "trialing"]),
        ),
      )
      .orderBy(desc(subscriptionsTable.createdAt));

    return res.json(
      subscriptions.map((subscription) => ({
        ...subscription,
        createdAt: subscription.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    logger.error({ err: error }, "Get subscriptions error");
    return res.status(500).json({ error: "Failed to get subscriptions" });
  }
});

router.post("/checkout-session", verifyUserToken, async (req, res) => {
  const planId = req.body?.plan;
  if (typeof planId !== "string" || !Object.prototype.hasOwnProperty.call(plans, planId)) {
    return res.status(400).json({ error: "Select a valid subscription plan" });
  }

  const plan = plans[planId as keyof typeof plans];
  let appUrl: URL;
  try {
    appUrl = new URL(process.env.APP_URL || "http://localhost:5173");
  } catch {
    return res.status(500).json({ error: "APP_URL is not a valid URL" });
  }

  if (req.get("origin") !== appUrl.origin) {
    return res.status(403).json({ error: "Checkout origin is not allowed" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.amount,
            recurring: {
              interval: plan.interval,
              interval_count: plan.intervalCount,
            },
            product_data: { name: plan.name },
          },
          quantity: 1,
        },
      ],
      success_url: new URL("/checkout/success?session_id={CHECKOUT_SESSION_ID}", appUrl).toString(),
      cancel_url: new URL("/subscriptions", appUrl).toString(),
      metadata: {
        plan: planId,
        userId: String(req.userId),
      },
      subscription_data: {
        metadata: {
          plan: planId,
          userId: String(req.userId),
        },
      },
    });

    if (!session.url) {
      return res.status(502).json({ error: "Stripe did not return a checkout URL" });
    }

    return res.json({ url: session.url });
  } catch (error) {
    logger.error({ err: error }, "Create subscription checkout session error");
    return res.status(502).json({ error: "Unable to start subscription checkout" });
  }
});

router.post("/portal", verifyUserToken, async (req, res) => {
  let appUrl: URL;
  try {
    appUrl = new URL(process.env.APP_URL || "http://localhost:5173");
  } catch {
    return res.status(500).json({ error: "APP_URL is not a valid URL" });
  }

  if (req.get("origin") !== appUrl.origin) {
    return res.status(403).json({ error: "Billing portal origin is not allowed" });
  }

  try {
    const [subscription] = await db
      .select({ customerId: subscriptionsTable.stripeCustomerId })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, req.userId!),
          inArray(subscriptionsTable.status, ["active", "trialing"]),
        ),
      )
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    if (!subscription?.customerId) {
      return res.status(404).json({ error: "No active billing account was found" });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.customerId,
      return_url: new URL("/subscriptions", appUrl).toString(),
    });

    return res.json({ url: portal.url });
  } catch (error) {
    logger.error({ err: error }, "Create billing portal session error");
    return res.status(502).json({ error: "Unable to open the Stripe billing portal" });
  }
});

export default router;
