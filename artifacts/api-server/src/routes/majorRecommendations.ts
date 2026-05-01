import { Router } from "express";
import { db } from "@workspace/db";
import { majorRecommendationsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/major-recommendations", async (_req, res) => {
  const recommendations = await db
    .select()
    .from(majorRecommendationsTable)
    .orderBy(desc(majorRecommendationsTable.matchScore));

  return res.json(recommendations);
});

export default router;
