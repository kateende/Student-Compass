import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const energyLogsTable = pgTable("energy_logs", {
  id: serial("id").primaryKey(),
  taskName: text("task_name").notNull(),
  energyLevel: integer("energy_level").notNull(),
  categoryId: integer("category_id").references(() => categoriesTable.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEnergyLogSchema = createInsertSchema(energyLogsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertEnergyLog = z.infer<typeof insertEnergyLogSchema>;
export type EnergyLog = typeof energyLogsTable.$inferSelect;
