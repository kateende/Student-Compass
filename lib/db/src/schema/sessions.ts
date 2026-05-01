import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { mentorsTable } from "./mentors";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id")
    .references(() => mentorsTable.id, { onDelete: "cascade" })
    .notNull(),
  topic: text("topic").notNull(),
  notes: text("notes"),
  status: text("status", {
    enum: ["scheduled", "completed", "cancelled"],
  })
    .notNull()
    .default("scheduled"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
