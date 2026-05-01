import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, energyLogsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateCategoryBody,
  UpdateCategoryParams,
  UpdateCategoryBody,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/categories", async (_req, res) => {
  const categories = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      logCount: sql<number>`count(${energyLogsTable.id})::int`,
      avgEnergy:
        sql<number | null>`avg(${energyLogsTable.energyLevel})::float`,
      createdAt: categoriesTable.createdAt,
    })
    .from(categoriesTable)
    .leftJoin(
      energyLogsTable,
      eq(energyLogsTable.categoryId, categoriesTable.id)
    )
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  return res.json(categories);
});

router.post("/categories", async (req, res) => {
  const body = CreateCategoryBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const [category] = await db
    .insert(categoriesTable)
    .values({ name: body.data.name })
    .returning();

  return res.status(201).json({ ...category, logCount: 0, avgEnergy: null });
});

router.put("/categories/:id", async (req, res) => {
  const params = UpdateCategoryParams.safeParse(req.params);
  const body = UpdateCategoryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return res.status(400).json({ error: "Invalid params or body" });
  }

  const [updated] = await db
    .update(categoriesTable)
    .set({ name: body.data.name })
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  const [stats] = await db
    .select({
      logCount: sql<number>`count(${energyLogsTable.id})::int`,
      avgEnergy:
        sql<number | null>`avg(${energyLogsTable.energyLevel})::float`,
    })
    .from(energyLogsTable)
    .where(eq(energyLogsTable.categoryId, updated.id));

  return res.json({
    ...updated,
    logCount: stats?.logCount ?? 0,
    avgEnergy: stats?.avgEnergy ?? null,
  });
});

router.delete("/categories/:id", async (req, res) => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id));

  return res.status(204).send();
});

export default router;
