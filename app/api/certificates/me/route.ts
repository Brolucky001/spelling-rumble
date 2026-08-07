import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";
export async function GET(request: Request) { try { const user = await requireUser(request); const items = await getAdminDb().collection("certificates").where("userId", "==", user.uid).get(); return NextResponse.json(items.docs.map((item) => ({ id: item.id, ...item.data() }))); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load certificates." }, { status: 400 }); } }
