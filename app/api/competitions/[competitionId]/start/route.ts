import { NextResponse } from "next/server";
import { requireUser, startOfficialAttempt } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    const user = await requireUser(request, ["student"]);
    return NextResponse.json(await startOfficialAttempt(params.competitionId, user.uid, user.profile));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start competition." }, { status: 400 });
  }
}
