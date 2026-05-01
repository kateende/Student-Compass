import { Router } from "express";
import { db } from "@workspace/db";
import {
  energyLogsTable,
  categoriesTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetEnergyLogsQueryParams,
  CreateEnergyLogBody,
  GetEnergyLogParams,
  UpdateEnergyLogParams,
  UpdateEnergyLogBody,
  DeleteEnergyLogParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/energy-logs", async (req, res) => {
  const query = GetEnergyLogsQueryParams.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { categoryId, limit } = query.data;

  const logs = await db
    .select({
      id: energyLogsTable.id,
      taskName: energyLogsTable.taskName,
      energyLevel: energyLogsTable.energyLevel,
      categoryId: energyLogsTable.categoryId,
      categoryName: categoriesTable.name,
      notes: energyLogsTable.notes,
      loggedAt: energyLogsTable.loggedAt,
      createdAt: energyLogsTable.createdAt,
    })
    .from(energyLogsTable)
    .leftJoin(
      categoriesTable,
      eq(energyLogsTable.categoryId, categoriesTable.id)
    )
    .where(categoryId ? eq(energyLogsTable.categoryId, categoryId) : undefined)
    .orderBy(desc(energyLogsTable.loggedAt))
    .limit(limit ?? 50);

  return res.json(logs);
});

router.post("/energy-logs", async (req, res) => {
  const body = CreateEnergyLogBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const { taskName, energyLevel, categoryId, notes, loggedAt } = body.data;

  const [log] = await db
    .insert(energyLogsTable)
    .values({
      taskName,
      energyLevel,
      categoryId: categoryId ?? null,
      notes: notes ?? null,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    })
    .returning();

  let categoryName: string | null = null;
  if (log.categoryId) {
    const cat = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, log.categoryId))
      .limit(1);
    categoryName = cat[0]?.name ?? null;
  }

  return res.status(201).json({ ...log, categoryName });
});

router.get("/energy-logs/:id", async (req, res) => {
  const params = GetEnergyLogParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const [log] = await db
    .select({
      id: energyLogsTable.id,
      taskName: energyLogsTable.taskName,
      energyLevel: energyLogsTable.energyLevel,
      categoryId: energyLogsTable.categoryId,
      categoryName: categoriesTable.name,
      notes: energyLogsTable.notes,
      loggedAt: energyLogsTable.loggedAt,
      createdAt: energyLogsTable.createdAt,
    })
    .from(energyLogsTable)
    .leftJoin(
      categoriesTable,
      eq(energyLogsTable.categoryId, categoriesTable.id)
    )
    .where(eq(energyLogsTable.id, params.data.id))
    .limit(1);

  if (!log) return res.status(404).json({ error: "Not found" });
  return res.json(log);
});

router.put("/energy-logs/:id", async (req, res) => {
  const params = UpdateEnergyLogParams.safeParse(req.params);
  const body = UpdateEnergyLogBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return res.status(400).json({ error: "Invalid params or body" });
  }

  const { taskName, energyLevel, categoryId, notes } = body.data;
  const updates: Record<string, unknown> = {};
  if (taskName !== undefined) updates.taskName = taskName;
  if (energyLevel !== undefined) updates.energyLevel = energyLevel;
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (notes !== undefined) updates.notes = notes;

  const [updated] = await db
    .update(energyLogsTable)
    .set(updates)
    .where(eq(energyLogsTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  let categoryName: string | null = null;
  if (updated.categoryId) {
    const cat = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, updated.categoryId))
      .limit(1);
    categoryName = cat[0]?.name ?? null;
  }

  return res.json({ ...updated, categoryName });
});

router.delete("/energy-logs/:id", async (req, res) => {
  const params = DeleteEnergyLogParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  await db
    .delete(energyLogsTable)
    .where(eq(energyLogsTable.id, params.data.id));

  return res.status(204).send();
});

export default router;
