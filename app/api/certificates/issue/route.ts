import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireUser(request, ["administrator"]);
    const { userId, competitionId, award = "Participation" } = await request.json();
    if (typeof userId !== "string" || typeof competitionId !== "string" || typeof award !== "string") throw new Error("Certificate details are invalid.");
    const db = getAdminDb(); const [profile, result] = await Promise.all([db.doc(`users/${userId}`).get(), db.doc(`competitions/${competitionId}/results/${userId}`).get()]);
    if (!profile.exists || !result.exists || result.data()?.status !== "final") throw new Error("A final official result is required before issuing a certificate.");
    const certificateNumber = `SR-${competitionId.slice(0, 6).toUpperCase()}-${userId.slice(0, 6).toUpperCase()}`;
    await db.doc(`certificates/${competitionId}_${userId}`).set({ certificateNumber, userId, competitionId, studentName: profile.data()?.displayName ?? "Student", award: award.trim(), status: "issued", issuedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ certificateNumber });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to issue certificate." }, { status: 400 }); }
}
