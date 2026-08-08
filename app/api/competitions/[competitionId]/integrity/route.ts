import { NextResponse } from "next/server";
import { recordIntegrityEvent, requireUser, type IntegrityEvent } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    const user = await requireUser(request, ["student"]);
    const { event } = await request.json();
    if (typeof event !== "string") throw new Error("An integrity event is required.");
    await recordIntegrityEvent(params.competitionId, user.uid, event as IntegrityEvent);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to record integrity information." }, { status: 400 });
  }
}
