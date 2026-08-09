import { FieldPath, type Query } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

const pageSize = 25;
type DirectoryKind = "schools" | "students";

function decodeCursor(value: string | null) { try { return value ? JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { name: string; id: string } : null; } catch { return null; } }
function encodeCursor(name: string, id: string) { return Buffer.from(JSON.stringify({ name, id })).toString("base64url"); }

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireUser(request, ["administrator"]);
    const params = new URL(request.url).searchParams;
    const kind = params.get("kind") as DirectoryKind;
    if (kind !== "schools" && kind !== "students") throw new Error("Choose schools or students.");
    const search = (params.get("search") ?? "").trim().toLowerCase();
    const cursor = decodeCursor(params.get("cursor"));
    const db = getAdminDb();
    const collection = kind === "schools" ? db.collection("schools") : db.collection("users");

    if (search && !search.includes("@")) {
      const direct = await collection.doc(search).get();
      if (direct.exists && (kind === "schools" || direct.data()?.role === "student")) return NextResponse.json({ items: [toItem(kind, direct.id, direct.data()!)], nextCursor: null });
    }

    let query: Query = collection;
    if (kind === "students") query = query.where("role", "==", "student");
    if (kind === "students" && params.get("schoolId")) query = query.where("schoolId", "==", params.get("schoolId"));
    if (search.includes("@") && kind === "students") query = query.where("searchEmail", "==", search);
    else if (search) query = query.where("searchName", ">=", search).where("searchName", "<", `${search}\uf8ff`);
    query = query.orderBy("searchName").orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor.name, cursor.id);
    const snapshot = await query.limit(pageSize + 1).get();
    const docs = snapshot.docs.slice(0, pageSize);
    const last = docs.at(-1);
    return NextResponse.json({ items: docs.map((item) => toItem(kind, item.id, item.data())), nextCursor: snapshot.size > pageSize && last ? encodeCursor(String(last.data().searchName ?? ""), last.id) : null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to search competition assignments." }, { status: 400 });
  }
}

function toItem(kind: DirectoryKind, id: string, data: Record<string, unknown>) {
  return kind === "schools" ? { id, label: String(data.name ?? id), detail: `${String(data.status ?? "pending")} · School ID: ${id}` } : { id, label: String(data.displayName ?? "Student"), detail: `${String(data.email ?? "No email")} · User ID: ${id}${data.schoolId ? ` · School ID: ${String(data.schoolId)}` : ""}` };
}
