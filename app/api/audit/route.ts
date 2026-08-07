import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";
export const runtime = "nodejs";
export async function GET(request: Request) { try { await requireUser(request, ["administrator"]); const logs = await getAdminDb().collection("auditLogs").orderBy("createdAt", "desc").limit(50).get(); return NextResponse.json(logs.docs.map((log) => ({ id: log.id, ...log.data() }))); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load audit logs." }, { status: 400 }); } }
