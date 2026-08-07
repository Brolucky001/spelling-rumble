import { NextResponse } from "next/server";
import { recordOfficialReplay, requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    const user = await requireUser(request, ["student"]);
    const { questionId } = await request.json();
    if (!Number.isInteger(questionId)) throw new Error("A valid question is required.");
    await recordOfficialReplay(params.competitionId, user.uid, questionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to record replay." }, { status: 400 });
  }
}
