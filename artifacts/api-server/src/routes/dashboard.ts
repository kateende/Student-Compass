import { Router } from "express";
import { db } from "@workspace/db";
import {
  energyLogsTable,
  categoriesTable,
  sessionsTable,
  mentorsTable,
} from "@workspace/db";
import { eq, gte, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const [logStats] = await db
    .select({
      totalLogs: sql<number>`count(${energyLogsTable.id})::int`,
      avgEnergyOverall:
        sql<number | null>`avg(${energyLogsTable.energyLevel})::float`,
    })
    .from(energyLogsTable);

  const categoryStats = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      avgEnergy:
        sql<number | null>`avg(${energyLogsTable.energyLevel})::float`,
    })
    .from(categoriesTable)
    .leftJoin(
      energyLogsTable,
      eq(energyLogsTable.categoryId, categoriesTable.id)
    )
    .groupBy(categoriesTable.id);

  const thriving = categoryStats.filter(
    (c) => c.avgEnergy !== null && c.avgEnergy > 7
  );
  const needsAttention = categoryStats.filter(
    (c) => c.avgEnergy !== null && c.avgEnergy < 4
  );
  const topCategory =
    categoryStats.sort((a, b) => (b.avgEnergy ?? 0) - (a.avgEnergy ?? 0))[0] ??
    null;

  const now = new Date();
  const [sessionStats] = await db
    .select({
      upcomingSessions: sql<number>`count(${sessionsTable.id})::int`,
    })
    .from(sessionsTable)
    .where(gte(sessionsTable.scheduledAt, now));

  const [mentorStats] = await db
    .select({
      totalMentors: sql<number>`count(${mentorsTable.id})::int`,
    })
    .from(mentorsTable);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [streakStats] = await db
    .select({
      recentLogs: sql<number>`count(${energyLogsTable.id})::int`,
    })
    .from(energyLogsTable)
    .where(gte(energyLogsTable.loggedAt, sevenDaysAgo));

  return res.json({
    totalLogs: logStats?.totalLogs ?? 0,
    avgEnergyOverall: logStats?.avgEnergyOverall ?? null,
    topCategory: topCategory?.name ?? null,
    topCategoryAvgEnergy: topCategory?.avgEnergy ?? null,
    burnoutRiskCategories: needsAttention.length,
    thrivingCategories: thriving.length,
    upcomingSessions: sessionStats?.upcomingSessions ?? 0,
    totalMentors: mentorStats?.totalMentors ?? 0,
    streak: streakStats?.recentLogs ?? 0,
  });
});

router.get("/dashboard/energy-by-category", async (_req, res) => {
  const rows = await db
    .select({
      categoryId: categoriesTable.id,
      categoryName: categoriesTable.name,
      avgEnergy: sql<number>`avg(${energyLogsTable.energyLevel})::float`,
      logCount: sql<number>`count(${energyLogsTable.id})::int`,
    })
    .from(categoriesTable)
    .leftJoin(
      energyLogsTable,
      eq(energyLogsTable.categoryId, categoriesTable.id)
    )
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  const result = rows.map((r) => {
    const avg = r.avgEnergy ?? 0;
    let status: "thriving" | "okay" | "needs-attention" = "okay";
    if (avg > 7) status = "thriving";
    else if (avg < 4) status = "needs-attention";

    return { ...r, status };
  });

  return res.json(result);
});

router.get("/dashboard/recent-activity", async (_req, res) => {
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
    .orderBy(desc(energyLogsTable.loggedAt))
    .limit(10);

  return res.json(logs);
});

export default router;
