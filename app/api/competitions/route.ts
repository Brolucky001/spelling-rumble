import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { assertCompetitionConfig, requireUser } from "@/lib/official-competition";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request, ["administrator"]);
    const config = assertCompetitionConfig(await request.json());
    const competition = await getAdminDb().collection("competitions").add({ ...config, status: "scheduled", createdAt: FieldValue.serverTimestamp() });
    await recordAudit(user.uid, "competition.created", competition.id, { title: config.title });
    return NextResponse.json({ id: competition.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create competition." }, { status: 400 });
  }
}
