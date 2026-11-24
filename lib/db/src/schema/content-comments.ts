import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const contentCommentsTable = pgTable("content_comments", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
