import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const likesTable = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    targetType: text("target_type").notNull(),
    targetId: integer("target_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("likes_user_target_unique").on(table.userId, table.targetType, table.targetId)],
);
