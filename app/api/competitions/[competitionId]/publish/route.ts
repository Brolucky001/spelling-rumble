import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    await requireUser(request, ["administrator"]);
    const reference = getAdminDb().doc(`competitions/${params.competitionId}`);
    if (!(await reference.get()).exists) throw new Error("Competition was not found.");
    await reference.update({ status: "active" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to publish competition." }, { status: 400 });
  }
}
