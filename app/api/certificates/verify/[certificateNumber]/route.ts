import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: { certificateNumber: string } }) { const matches = await getAdminDb().collection("certificates").where("certificateNumber", "==", params.certificateNumber).limit(1).get(); if (matches.empty) return NextResponse.json({ valid: false }, { status: 404 }); const certificate = matches.docs[0].data(); return NextResponse.json({ valid: certificate.status === "issued", certificateNumber: certificate.certificateNumber, studentName: certificate.studentName, award: certificate.award, competitionId: certificate.competitionId }); }
