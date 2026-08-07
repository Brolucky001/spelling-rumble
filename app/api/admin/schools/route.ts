import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";
export const runtime = "nodejs";
export async function GET(request: Request) { try { await requireUser(request, ["administrator"]); const schools = await getAdminDb().collection("schools").get(); return NextResponse.json(schools.docs.map((school) => ({ id: school.id, ...school.data() }))); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load schools." }, { status: 400 }); } }
