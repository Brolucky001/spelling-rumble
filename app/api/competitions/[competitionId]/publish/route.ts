import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    const user = await requireUser(request, ["administrator"]);
    const reference = getAdminDb().doc(`competitions/${params.competitionId}`);
    const competition = await reference.get();
    if (!competition.exists) throw new Error("Competition was not found.");
    if (competition.data()?.status !== "scheduled") throw new Error("Only scheduled competitions can be published.");
    await reference.update({ status: "active" });
    await recordAudit(user.uid, "competition.published", params.competitionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to publish competition." }, { status: 400 });
  }
}
