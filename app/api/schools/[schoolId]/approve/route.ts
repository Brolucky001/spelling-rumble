import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { schoolId: string } }) {
  try {
    await requireUser(request, ["administrator"]);
    const school = getAdminDb().doc(`schools/${params.schoolId}`);
    if (!(await school.get()).exists) throw new Error("School was not found.");
    await school.update({ status: "approved" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to approve school." }, { status: 400 });
  }
}
