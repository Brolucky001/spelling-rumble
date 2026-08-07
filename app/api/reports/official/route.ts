import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";
type ReportResult = { id: string; competitionId?: string; userId?: string; schoolId?: string; score?: number; accuracy?: number; [key: string]: unknown };

export async function GET(request: Request) {
  try {
    await requireUser(request, ["administrator"]);
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId"); const schoolId = searchParams.get("schoolId"); const db = getAdminDb();
    let results: ReportResult[] = competitionId ? (await db.collection(`competitions/${competitionId}/results`).get()).docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ReportResult, "id">) })) : (await db.collectionGroup("results").get()).docs.map((item) => ({ id: item.id, competitionId: item.ref.parent.parent?.id, ...(item.data() as Omit<ReportResult, "id">) }));
    if (schoolId) results = results.filter((result) => result.schoolId === schoolId);
    const totalScore = results.reduce((sum, result) => sum + Number(result.score ?? 0), 0);
    return NextResponse.json({ filters: { competitionId, schoolId }, participants: new Set(results.map((result) => result.userId)).size, results: results.length, totalScore, averageScore: results.length ? Math.round(totalScore / results.length) : 0, averageAccuracy: results.length ? Math.round(results.reduce((sum, result) => sum + Number(result.accuracy ?? 0), 0) / results.length) : 0, rows: results.sort((a, b) => Number(b.score) - Number(a.score)) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate report." }, { status: 400 }); }
}
