import {
  pgTable,
  serial,
  text,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const majorRecommendationsTable = pgTable("major_recommendations", {
  id: serial("id").primaryKey(),
  majorName: text("major_name").notNull(),
  matchScore: real("match_score").notNull(),
  reasoning: text("reasoning").notNull(),
  topCategories: text("top_categories").array().notNull().default([]),
  careerPaths: text("career_paths").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMajorRecommendationSchema = createInsertSchema(
  majorRecommendationsTable
).omit({ id: true, createdAt: true });

export type InsertMajorRecommendation = z.infer<
  typeof insertMajorRecommendationSchema
>;
export type MajorRecommendation =
  typeof majorRecommendationsTable.$inferSelect;
