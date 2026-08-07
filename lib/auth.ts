import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { PortalRole } from "@/types";
import type { SessionResult } from "@/types";

export interface UserProfile { displayName: string; email: string; role: PortalRole; }

export async function signIn(email: string, password: string) { await signInWithEmailAndPassword(auth, email, password); }

export async function signUp(displayName: string, email: string, password: string, role: Extract<PortalRole, "student" | "teacher" | "school"> = "student") {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await setDoc(doc(db, "users", credential.user.uid), { displayName, email: credential.user.email, role, createdAt: serverTimestamp() });
  if (role === "school") {
    await setDoc(doc(db, "schools", credential.user.uid), { name: displayName, ownerId: credential.user.uid, status: "pending", createdAt: serverTimestamp() });
  }
}

export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(user: User): Promise<UserProfile> {
  const snapshot = await getDoc(doc(db, "users", user.uid));
  const data = snapshot.data();
  return { displayName: data?.displayName ?? user.displayName ?? "Student", email: user.email ?? "", role: data?.role === "teacher" || data?.role === "school" || data?.role === "administrator" ? data.role : "student" };
}

export async function signOutUser() { await signOut(auth); }

export async function savePracticeResult(userId: string, result: SessionResult) {
  await setDoc(doc(db, "users", userId, "practiceResults", result.id), { ...result, userId, createdAt: serverTimestamp() });
}

export async function getPracticeResults(userId: string): Promise<SessionResult[]> {
  const snapshot = await getDocs(query(collection(db, "users", userId, "practiceResults"), orderBy("date", "desc")));
  return snapshot.docs.map((item) => item.data() as SessionResult);
}
