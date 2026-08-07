import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { schoolId: string } }) {
  try {
    const user = await requireUser(request, ["school", "administrator"]);
    if (user.role === "school" && user.uid !== params.schoolId) throw new Error("You can only view your own school report.");
    const results = (await getAdminDb().collectionGroup("results").where("schoolId", "==", params.schoolId).get()).docs.map((result) => result.data());
    const totalScore = results.reduce((sum, result) => sum + Number(result.score ?? 0), 0);
    return NextResponse.json({ participants: new Set(results.map((result) => result.userId)).size, totalScore, averageAccuracy: results.length ? Math.round(results.reduce((sum, result) => sum + Number(result.accuracy ?? 0), 0) / results.length) : 0, results: results.sort((a, b) => Number(b.score) - Number(a.score)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load school report." }, { status: 400 });
  }
}
