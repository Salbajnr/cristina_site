import { pgTable, text, integer, serial, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentTable = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("photo"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  previewUrl: text("preview_url").notNull(),
  isLocked: boolean("is_locked").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  categoryId: integer("category_id"),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContentSchema = createInsertSchema(contentTable).omit({ id: true });
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contentTable.$inferSelect;
