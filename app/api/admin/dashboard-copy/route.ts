import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

export const runtime = "nodejs";

const defaults = { title: "Run a fair, connected competition.", description: "This foundation will host competition configuration, sentence libraries, rankings, reports, and system notices." };

export async function GET(request: Request) {
  try {
    await requireUser(request, ["administrator"]);
    const data = (await getAdminDb().doc("settings/administratorDashboard").get()).data();
    return NextResponse.json({ title: data?.title ?? defaults.title, description: data?.description ?? defaults.description });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load dashboard content." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser(request, ["administrator"]);
    const { title, description } = await request.json();
    if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 120 || typeof description !== "string" || description.trim().length < 10 || description.trim().length > 600) throw new Error("Use a title of 3–120 characters and a description of 10–600 characters.");
    await getAdminDb().doc("settings/administratorDashboard").set({ title: title.trim(), description: description.trim(), updatedBy: user.uid, updatedAt: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ title: title.trim(), description: description.trim() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save dashboard content." }, { status: 400 });
  }
}
