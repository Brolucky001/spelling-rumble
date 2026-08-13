import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";
import { pointsByDifficulty } from "@/utils/scoring";
import type { Difficulty } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request, ["student"]);
    const results = await getAdminDb().collectionGroup("results").where("userId", "==", user.uid).get();
    const items = await Promise.all(results.docs.map(async (result) => {
      const data = result.data() as { score?: number; totalQuestions?: number };
      const competition = await result.ref.parent.parent?.get();
      const difficulty = competition?.data()?.difficulty as Difficulty | undefined;
      const maximumScore = difficulty && pointsByDifficulty[difficulty] && data.totalQuestions ? pointsByDifficulty[difficulty] * data.totalQuestions : data.score ?? 0;
      return { id: result.id, competitionId: result.ref.parent.parent?.id, ...data, maximumScore };
    }));
    return NextResponse.json(items.sort((a, b) => Number(b.score) - Number(a.score)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load results." }, { status: 400 });
  }
}
