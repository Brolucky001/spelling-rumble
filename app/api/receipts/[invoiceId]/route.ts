import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: { invoiceId: string } }) { try { const user = await requireUser(request, ["school", "administrator"]); const receipt = await getAdminDb().doc(`receipts/${params.invoiceId}`).get(); if (!receipt.exists || (user.role === "school" && receipt.data()?.schoolId !== user.uid)) throw new Error("Receipt was not found."); return NextResponse.json(receipt.data()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load receipt." }, { status: 400 }); } }
