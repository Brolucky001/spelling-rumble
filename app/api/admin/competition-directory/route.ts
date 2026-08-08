import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireUser(request, ["administrator"]);
    const db = getAdminDb();
    const [schools, users] = await Promise.all([db.collection("schools").get(), db.collection("users").where("role", "==", "student").get()]);
    return NextResponse.json({
      schools: schools.docs.map((school) => ({ id: school.id, name: school.data().name ?? school.id, status: school.data().status ?? "pending" })),
      students: users.docs.map((student) => ({ id: student.id, displayName: student.data().displayName ?? "Student", email: student.data().email ?? "", schoolId: student.data().schoolId ?? null }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load competition assignments." }, { status: 400 });
  }
}
