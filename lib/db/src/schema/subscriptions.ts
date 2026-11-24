import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    plan: text("plan").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("subscriptions_stripe_subscription_id_unique").on(table.stripeSubscriptionId)],
);
