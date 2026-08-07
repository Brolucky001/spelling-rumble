import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request, ["student"]);
    const results = await getAdminDb().collectionGroup("results").where("userId", "==", user.uid).get();
    const items = results.docs.map((result) => ({ id: result.id, competitionId: result.ref.parent.parent?.id, ...(result.data() as { score?: number }) }));
    return NextResponse.json(items.sort((a, b) => Number(b.score) - Number(a.score)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load results." }, { status: 400 });
  }
}
