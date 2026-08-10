import { FieldPath, type Query } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/official-competition";

const pageSize = 25;
type DirectoryKind = "schools" | "students";
type DirectoryItem = { id: string; label: string; detail: string };

function decodeCursor(value: string | null) { try { return value ? JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { name: string; id: string } : null; } catch { return null; } }
function encodeCursor(name: string, id: string) { return Buffer.from(JSON.stringify({ name, id })).toString("base64url"); }

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireUser(request, ["administrator"]);
    const params = new URL(request.url).searchParams;
    const kind = params.get("kind") as DirectoryKind;
    if (kind !== "schools" && kind !== "students") throw new Error("Choose schools or students.");
    const rawSearch = (params.get("search") ?? "").trim(); const search = rawSearch.toLowerCase();
    const cursor = decodeCursor(params.get("cursor")); const db = getAdminDb(); const collection = kind === "schools" ? db.collection("schools") : db.collection("users");
    if (rawSearch) {
      const direct = await collection.doc(rawSearch).get();
      if (direct.exists && (kind === "schools" || direct.data()?.role === "student")) return NextResponse.json({ items: [toItem(kind, direct.id, direct.data()!)], nextCursor: null });
      const publicMatch = await collection.where("publicId", "==", rawSearch.toUpperCase()).limit(1).get();
      if (!publicMatch.empty && (kind === "schools" || publicMatch.docs[0].data().role === "student")) return NextResponse.json({ items: [toItem(kind, publicMatch.docs[0].id, publicMatch.docs[0].data())], nextCursor: null });
    }
    if (search) return NextResponse.json({ items: await prefixSearch(kind, search), nextCursor: null });
    let query: Query = collection;
    if (kind === "students") query = query.where("role", "==", "student");
    query = query.orderBy("searchName").orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor.name, cursor.id);
    const snapshot = await query.limit(pageSize + 1).get(); const docs = snapshot.docs.slice(0, pageSize); const last = docs.at(-1);
    return NextResponse.json({ items: docs.map((item) => toItem(kind, item.id, item.data())), nextCursor: snapshot.size > pageSize && last ? encodeCursor(String(last.data().searchName ?? ""), last.id) : null });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to search competition assignments." }, { status: 400 }); }
}

async function prefixSearch(kind: DirectoryKind, search: string): Promise<DirectoryItem[]> {
  const db = getAdminDb(); const collection = kind === "schools" ? db.collection("schools") : db.collection("users");
  const withRole = (query: Query) => kind === "students" ? query.where("role", "==", "student") : query;
  const nameQuery = withRole(collection).where("searchName", ">=", search).where("searchName", "<", `${search}\uf8ff`).orderBy("searchName").limit(pageSize);
  const queries = [nameQuery];
  if (kind === "students") queries.push(withRole(collection).where("searchEmail", ">=", search).where("searchEmail", "<", `${search}\uf8ff`).orderBy("searchEmail").limit(pageSize));
  const snapshots = await Promise.all(queries.map((query) => query.get())); const found = new Map<string, DirectoryItem>();
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((item) => found.set(item.id, toItem(kind, item.id, item.data())));
  return [...found.values()].sort((left, right) => left.label.localeCompare(right.label)).slice(0, pageSize);
}

function toItem(kind: DirectoryKind, id: string, data: Record<string, unknown>): DirectoryItem {
  const publicId = String(data.publicId ?? (kind === "schools" ? `SCH-${id.slice(0, 8).toUpperCase()}` : `STU-${id.slice(0, 8).toUpperCase()}`));
  return kind === "schools" ? { id, label: String(data.name ?? id), detail: `${String(data.status ?? "pending")} · School ID: ${publicId}` } : { id, label: String(data.displayName ?? "Student"), detail: `${String(data.email ?? "No email")} · Student ID: ${publicId}` };
}
