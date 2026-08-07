import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireUser(request, ["administrator"]);
    const db = getAdminDb();
    const [users, schools, competitions, results] = await Promise.all([db.collection("users").get(), db.collection("schools").get(), db.collection("competitions").get(), db.collectionGroup("results").get()]);
    return NextResponse.json({ users: users.size, schools: schools.size, pendingSchools: schools.docs.filter((school) => school.data().status === "pending").length, competitions: competitions.size, officialResults: results.size });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load administration overview." }, { status: 400 });
  }
}
