import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";
import { initializeFlutterwave } from "@/lib/payments";
export const runtime = "nodejs";
export async function POST(request: Request) { try { const user = await requireUser(request, ["school"]); const { invoiceId } = await request.json(); if (typeof invoiceId !== "string") throw new Error("An invoice is required."); const invoice = await getAdminDb().doc(`invoices/${invoiceId}`).get(); if (!invoice.exists || invoice.data()?.schoolId !== user.uid || invoice.data()?.status !== "pending") throw new Error("This invoice is not available for payment."); const checkoutUrl = await initializeFlutterwave(invoiceId, Number(invoice.data()?.amount), user.profile.email); return NextResponse.json({ checkoutUrl }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to initialize payment." }, { status: 400 }); } }
