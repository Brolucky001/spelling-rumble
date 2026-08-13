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
    const { competitionId: _ignored, ...config } = assertCompetitionConfig(await request.json());
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
    const reference = await editableCompetition(params.competitionId);
    await reference.delete();
    await recordAudit(user.uid, "competition.deleted", params.competitionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete competition." }, { status: 400 });
  }
}
