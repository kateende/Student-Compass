import { Router } from "express";
import { db } from "@workspace/db";
import { mentorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetMentorsQueryParams,
  CreateMentorBody,
  GetMentorParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/mentors", async (req, res) => {
  const query = GetMentorsQueryParams.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  let rows = await db.select().from(mentorsTable).orderBy(mentorsTable.name);

  if (query.data.major) {
    rows = rows.filter((m) =>
      m.major.toLowerCase().includes(query.data.major!.toLowerCase())
    );
  }
  if (query.data.year) {
    rows = rows.filter((m) => m.year === query.data.year);
  }

  return res.json(rows);
});

router.post("/mentors", async (req, res) => {
  const body = CreateMentorBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const [mentor] = await db
    .insert(mentorsTable)
    .values({
      name: body.data.name,
      major: body.data.major,
      year: body.data.year,
      bio: body.data.bio,
      avatarUrl: body.data.avatarUrl ?? null,
      strengths: body.data.strengths,
      isAvailable: body.data.isAvailable ?? true,
    })
    .returning();

  return res.status(201).json(mentor);
});

router.get("/mentors/:id", async (req, res) => {
  const params = GetMentorParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const [mentor] = await db
    .select()
    .from(mentorsTable)
    .where(eq(mentorsTable.id, params.data.id))
    .limit(1);

  if (!mentor) return res.status(404).json({ error: "Not found" });
  return res.json(mentor);
});

export default router;
