import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: { schoolId: string } }) { try { const user = await requireUser(request, ["school", "administrator"]); if (user.role === "school" && user.uid !== params.schoolId) throw new Error("You can only view your school directory."); const users = await getAdminDb().collection("users").where("schoolId", "==", params.schoolId).get(); return NextResponse.json(users.docs.map((item) => ({ id: item.id, displayName: item.data().displayName, email: item.data().email, role: item.data().role }))); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load directory." }, { status: 400 }); } }
