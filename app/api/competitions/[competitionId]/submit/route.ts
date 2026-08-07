import { NextResponse } from "next/server";
import { requireUser, submitOfficialAttempt } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    const user = await requireUser(request, ["student"]);
    const { responses } = await request.json();
    if (!Array.isArray(responses) || responses.some((item) => !Number.isInteger(item?.questionId) || typeof item?.response !== "string")) throw new Error("Answers are invalid.");
    await submitOfficialAttempt(params.competitionId, user.uid, responses);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit competition." }, { status: 400 });
  }
}
