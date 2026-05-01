import { Router } from "express";
import { db } from "@workspace/db";
import {
  energyLogsTable,
  categoriesTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  GetEnergyLogsQueryParams,
  CreateEnergyLogBody,
  GetEnergyLogParams,
  UpdateEnergyLogParams,
  UpdateEnergyLogBody,
  DeleteEnergyLogParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/energy-logs", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const query = GetEnergyLogsQueryParams.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { categoryId, limit } = query.data;

  const conditions = [eq(energyLogsTable.userId, userId)];
  if (categoryId) conditions.push(eq(energyLogsTable.categoryId, categoryId));

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
    .where(and(...conditions))
    .orderBy(desc(energyLogsTable.loggedAt))
    .limit(limit ?? 50);

  return res.json(logs);
});

router.post("/energy-logs", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const body = CreateEnergyLogBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const { taskName, energyLevel, categoryId, notes, loggedAt } = body.data;

  const [log] = await db
    .insert(energyLogsTable)
    .values({
      userId,
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

router.get("/energy-logs/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
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
    .where(and(eq(energyLogsTable.id, params.data.id), eq(energyLogsTable.userId, userId)))
    .limit(1);

  if (!log) return res.status(404).json({ error: "Not found" });
  return res.json(log);
});

router.put("/energy-logs/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
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
    .where(and(eq(energyLogsTable.id, params.data.id), eq(energyLogsTable.userId, userId)))
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

router.delete("/energy-logs/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const params = DeleteEnergyLogParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  await db
    .delete(energyLogsTable)
    .where(and(eq(energyLogsTable.id, params.data.id), eq(energyLogsTable.userId, userId)));

  return res.status(204).send();
});

export default router;
