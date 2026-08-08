import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { assertCompetitionConfig, requireUser } from "@/lib/official-competition";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

function asIso(value: unknown) {
  return value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function" ? value.toDate().toISOString() : null;
}

export async function GET(request: Request) {
  try {
    await requireUser(request, ["administrator"]);
    const db = getAdminDb();
    const competitions = await db.collection("competitions").get();
    const items = await Promise.all(competitions.docs.map(async (competition) => {
      const [results, attempts] = await Promise.all([competition.ref.collection("results").get(), competition.ref.collection("attempts").get()]);
      return {
        id: competition.id,
        ...competition.data(),
        createdAt: asIso(competition.data().createdAt),
        results: results.docs.map((result) => ({ id: result.id, ...result.data(), submittedAt: asIso(result.data().submittedAt) })),
        integrityAttempts: attempts.docs.filter((attempt) => Number(attempt.data().integrityEventCount ?? 0) > 0).map((attempt) => ({ userId: attempt.id, status: attempt.data().status, integrityEventCount: Number(attempt.data().integrityEventCount ?? 0), lastIntegrityEvent: attempt.data().lastIntegrityEvent ?? null, lastIntegrityEventAt: asIso(attempt.data().lastIntegrityEventAt) }))
      };
    }));
    return NextResponse.json(items.sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""))));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load competitions." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request, ["administrator"]);
    const { competitionId, ...config } = assertCompetitionConfig(await request.json());
    const db = getAdminDb();
    const competition = competitionId ? db.collection("competitions").doc(competitionId) : db.collection("competitions").doc();
    await competition.create({ ...config, status: "scheduled", createdAt: FieldValue.serverTimestamp() });
    await recordAudit(user.uid, "competition.created", competition.id, { title: config.title });
    return NextResponse.json({ id: competition.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create competition." }, { status: 400 });
  }
}
