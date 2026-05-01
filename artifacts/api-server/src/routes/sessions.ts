import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, mentorsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  CreateSessionBody,
  GetSessionParams,
  UpdateSessionParams,
  UpdateSessionBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router = Router();

const withMentor = async (session: typeof sessionsTable.$inferSelect) => {
  const [mentor] = await db
    .select()
    .from(mentorsTable)
    .where(eq(mentorsTable.id, session.mentorId))
    .limit(1);

  return {
    ...session,
    mentorName: mentor?.name ?? "Unknown",
    mentorMajor: mentor?.major ?? "",
    mentorAvatarUrl: mentor?.avatarUrl ?? null,
  };
};

router.get("/sessions", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;

  const sessions = await db
    .select({
      id: sessionsTable.id,
      mentorId: sessionsTable.mentorId,
      mentorName: mentorsTable.name,
      mentorMajor: mentorsTable.major,
      mentorAvatarUrl: mentorsTable.avatarUrl,
      topic: sessionsTable.topic,
      notes: sessionsTable.notes,
      status: sessionsTable.status,
      scheduledAt: sessionsTable.scheduledAt,
      createdAt: sessionsTable.createdAt,
    })
    .from(sessionsTable)
    .leftJoin(mentorsTable, eq(sessionsTable.mentorId, mentorsTable.id))
    .where(eq(sessionsTable.userId, userId))
    .orderBy(desc(sessionsTable.scheduledAt));

  return res.json(sessions);
});

router.post("/sessions", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const body = CreateSessionBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const { mentorId, topic, notes, scheduledAt } = body.data;

  const [session] = await db
    .insert(sessionsTable)
    .values({
      userId,
      mentorId,
      topic,
      notes: notes ?? null,
      scheduledAt: new Date(scheduledAt),
    })
    .returning();

  await db
    .update(mentorsTable)
    .set({ sessionCount: sql<number>`${mentorsTable.sessionCount} + 1` })
    .where(eq(mentorsTable.id, mentorId));

  const enriched = await withMentor(session);
  return res.status(201).json(enriched);
});

router.get("/sessions/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const [session] = await db
    .select({
      id: sessionsTable.id,
      mentorId: sessionsTable.mentorId,
      mentorName: mentorsTable.name,
      mentorMajor: mentorsTable.major,
      mentorAvatarUrl: mentorsTable.avatarUrl,
      topic: sessionsTable.topic,
      notes: sessionsTable.notes,
      status: sessionsTable.status,
      scheduledAt: sessionsTable.scheduledAt,
      createdAt: sessionsTable.createdAt,
    })
    .from(sessionsTable)
    .leftJoin(mentorsTable, eq(sessionsTable.mentorId, mentorsTable.id))
    .where(and(eq(sessionsTable.id, params.data.id), eq(sessionsTable.userId, userId)))
    .limit(1);

  if (!session) return res.status(404).json({ error: "Not found" });
  return res.json(session);
});

router.put("/sessions/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const params = UpdateSessionParams.safeParse(req.params);
  const body = UpdateSessionBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return res.status(400).json({ error: "Invalid params or body" });
  }

  const { topic, notes, status, scheduledAt } = body.data;
  const updates: Record<string, unknown> = {};
  if (topic !== undefined) updates.topic = topic;
  if (notes !== undefined) updates.notes = notes;
  if (status !== undefined) updates.status = status;
  if (scheduledAt !== undefined) updates.scheduledAt = new Date(scheduledAt);

  const [updated] = await db
    .update(sessionsTable)
    .set(updates)
    .where(and(eq(sessionsTable.id, params.data.id), eq(sessionsTable.userId, userId)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  const enriched = await withMentor(updated);
  return res.json(enriched);
});

export default router;
