import {
  pgTable,
  serial,
  text,
  real,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mentorsTable = pgTable("mentors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  major: text("major").notNull(),
  year: text("year").notNull(),
  bio: text("bio").notNull(),
  avatarUrl: text("avatar_url"),
  strengths: text("strengths").array().notNull().default([]),
  rating: real("rating"),
  sessionCount: integer("session_count").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMentorSchema = createInsertSchema(mentorsTable).omit({
  id: true,
  createdAt: true,
  sessionCount: true,
});

export type InsertMentor = z.infer<typeof insertMentorSchema>;
export type Mentor = typeof mentorsTable.$inferSelect;
