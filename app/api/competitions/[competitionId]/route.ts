import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { assertCompetitionConfig, requireUser } from "@/lib/official-competition";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

async function editableCompetition(competitionId: string) {
  const db = getAdminDb();
  const reference = db.doc(`competitions/${competitionId}`);
  const [competition, attempts, results] = await Promise.all([reference.get(), reference.collection("attempts").limit(1).get(), reference.collection("results").limit(1).get()]);
  if (!competition.exists) throw new Error("Competition was not found.");
  if (competition.data()?.status !== "scheduled") throw new Error("Only scheduled competitions can be changed. Create a new competition instead.");
  if (!attempts.empty || !results.empty) throw new Error("This competition already has activity and cannot be changed or deleted.");
  return reference;
}

export async function PATCH(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    const user = await requireUser(request, ["administrator"]);
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const existing = await db.doc(`competitions/${params.competitionId}`).get();
    if (!existing.exists) throw new Error("Competition was not found.");
    if (existing.data()?.status !== "scheduled") {
      if (typeof body.title !== "string" || !body.title.trim()) throw new Error("Only the title of a past competition can be edited.");
      await existing.ref.update({ title: body.title.trim(), updatedAt: new Date().toISOString() });
      await recordAudit(user.uid, "competition.title_updated", params.competitionId, { title: body.title.trim() });
      return NextResponse.json({ ok: true });
    }
    const { competitionId: _ignored, ...config } = assertCompetitionConfig(body);
    const reference = await editableCompetition(params.competitionId);
    await reference.update({ ...config, updatedAt: new Date().toISOString() });
    await recordAudit(user.uid, "competition.updated", params.competitionId, { title: config.title });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update competition." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    const user = await requireUser(request, ["administrator"]);
    const db = getAdminDb();
    const reference = db.doc(`competitions/${params.competitionId}`);
    const competition = await reference.get();
    if (!competition.exists) throw new Error("Competition was not found.");
    const endsAt = new Date(competition.data()?.endsAt ?? 0).getTime();
    if (competition.data()?.status === "active" && (!Number.isFinite(endsAt) || Date.now() <= endsAt)) throw new Error("An active competition cannot be deleted until it has ended.");
    await db.recursiveDelete(reference);
    await db.doc(`leaderboards/${params.competitionId}`).delete();
    await recordAudit(user.uid, "competition.deleted", params.competitionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete competition." }, { status: 400 });
  }
}
