import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { competitionId: string } }) {
  try {
    await requireUser(request);
    const db = getAdminDb();
    const board = db.doc(`leaderboards/${params.competitionId}`);
    const [students, schools] = await Promise.all([
      board.collection("students").orderBy("score", "desc").orderBy("accuracy", "desc").limit(20).get(),
      board.collection("schools").orderBy("totalScore", "desc").limit(20).get()
    ]);
    const schoolNames = await Promise.all(schools.docs.map(async (school) => ({ ...school.data(), name: (await db.doc(`schools/${school.id}`).get()).data()?.name ?? "School" })));
    return NextResponse.json({ students: students.docs.map((student, index) => ({ rank: index + 1, ...student.data() })), schools: schoolNames.map((school, index) => ({ rank: index + 1, ...school })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load rankings." }, { status: 400 });
  }
}
