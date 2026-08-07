import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { schoolId: string } }) {
  try {
    await requireUser(request, ["administrator"]);
    const { studentId } = await request.json();
    if (typeof studentId !== "string" || !studentId) throw new Error("A student ID is required.");
    const db = getAdminDb();
    const [school, student] = await Promise.all([db.doc(`schools/${params.schoolId}`).get(), db.doc(`users/${studentId}`).get()]);
    if (!school.exists || school.data()?.status !== "approved") throw new Error("The school must be approved before students can be assigned.");
    if (!student.exists || student.data()?.role !== "student") throw new Error("That account is not a student.");
    await student.ref.update({ schoolId: params.schoolId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to assign student." }, { status: 400 });
  }
}
