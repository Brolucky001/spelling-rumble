import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const required = ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"] as const;

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing Firebase Admin configuration: ${missing.join(", ")}`);
  return initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n") }) });
}

export function getAdminAuth() { return getAuth(getAdminApp()); }
export function getAdminDb() { return getFirestore(getAdminApp()); }
