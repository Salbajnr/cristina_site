CREATE TABLE IF NOT EXISTS "likes" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "likes_user_target_unique"
  ON "likes" ("user_id", "target_type", "target_id");

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "stripe_subscription_id" TEXT NOT NULL,
  "stripe_customer_id" TEXT,
  "plan" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_unique"
  ON "subscriptions" ("stripe_subscription_id");

CREATE TABLE IF NOT EXISTS "content_comments" (
  "id" SERIAL PRIMARY KEY,
  "content_id" INTEGER NOT NULL,
  "author_name" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "content_comments_content_id_created_at_idx"
  ON "content_comments" ("content_id", "created_at");
