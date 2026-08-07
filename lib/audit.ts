import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
export async function recordAudit(actorId: string, action: string, target: string, metadata: Record<string, unknown> = {}) { await getAdminDb().collection("auditLogs").add({ actorId, action, target, metadata, createdAt: FieldValue.serverTimestamp() }); }
