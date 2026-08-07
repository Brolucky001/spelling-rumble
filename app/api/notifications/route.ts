import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const notices = await getAdminDb().collection("notifications").orderBy("createdAt", "desc").limit(50).get();
    const items = notices.docs.map((notice) => ({ id: notice.id, ...(notice.data() as { audience?: string }) }));
    return NextResponse.json(items.filter((notice) => notice.audience === "all" || notice.audience === user.role));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load notifications." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request, ["administrator"]);
    const { title, message, audience = "all" } = await request.json();
    if (typeof title !== "string" || !title.trim() || typeof message !== "string" || !message.trim() || !["all", "student", "school", "administrator"].includes(audience)) throw new Error("Notification details are invalid.");
    const notification = await getAdminDb().collection("notifications").add({ title: title.trim(), message: message.trim(), audience, createdBy: user.uid, createdAt: FieldValue.serverTimestamp() });
    await recordAudit(user.uid, "notification.published", notification.id, { audience });
    return NextResponse.json({ id: notification.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to publish notification." }, { status: 400 });
  }
}
