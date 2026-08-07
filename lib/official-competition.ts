import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import questions from "@/data/questions.json";
import { normalizeAnswer, pointsByDifficulty } from "@/utils/scoring";
import type { Difficulty, PortalRole, Question } from "@/types";

export interface CompetitionConfig { title: string; difficulty: Difficulty; startsAt: string; endsAt: string; questionIds: number[]; maxReplays: number; timeLimitSeconds: number; registrationFee?: number; eligibleStudentIds?: string[]; eligibleSchoolIds?: string[]; }

export async function requireUser(request: Request, roles?: PortalRole[]) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("Authentication is required.");
  const db = getAdminDb();
  const token = await getAdminAuth().verifyIdToken(authorization.slice(7));
  if (!token.email_verified) throw new Error("Confirm your email address before accessing official competition services.");
  const profile = await db.doc(`users/${token.uid}`).get();
  const role = profile.data()?.role as PortalRole | undefined;
  if (!role || (roles && !roles.includes(role))) throw new Error("You do not have permission to perform this action.");
  return { uid: token.uid, role, profile: profile.data() ?? {} };
}

export function getQuestionSet(ids: number[]) {
  const pool = questions as Question[];
  const selected = ids.map((id) => pool.find((question) => question.id === id)).filter(Boolean) as Question[];
  if (selected.length !== ids.length) throw new Error("One or more configured questions do not exist.");
  return selected;
}

export function assertCompetitionConfig(value: unknown): CompetitionConfig {
  const config = value as CompetitionConfig;
  if (!config?.title?.trim() || !config.questionIds?.length || !pointsByDifficulty[config.difficulty] || !config.startsAt || !config.endsAt) throw new Error("Competition configuration is incomplete.");
  if (new Date(config.startsAt) >= new Date(config.endsAt) || config.maxReplays < 0 || config.timeLimitSeconds < 10 || (config.registrationFee ?? 0) < 0) throw new Error("Competition timing, fee, or replay settings are invalid.");
  getQuestionSet(config.questionIds);
  return config;
}

function isEligible(competition: DocumentData, uid: string, schoolId?: string) {
  const students = competition.eligibleStudentIds as string[] | undefined;
  const schools = competition.eligibleSchoolIds as string[] | undefined;
  return students?.includes(uid) || (schoolId && schools?.includes(schoolId));
}

export async function startOfficialAttempt(competitionId: string, uid: string, profile: DocumentData) {
  const db = getAdminDb();
  const competitionRef = db.doc(`competitions/${competitionId}`);
  const attemptRef = competitionRef.collection("attempts").doc(uid);
  const competition = (await competitionRef.get()).data();
  if (!competition) throw new Error("Competition was not found.");
  const now = Date.now();
  if (competition.status !== "active" || now < new Date(competition.startsAt).getTime() || now > new Date(competition.endsAt).getTime()) throw new Error("This competition is not currently active.");
  if (!isEligible(competition, uid, profile.schoolId)) throw new Error("You are not eligible for this competition.");
  const existing = await attemptRef.get();
  if (existing.exists) {
    const data = existing.data()!;
    if (data.status !== "active") throw new Error("You have already submitted this competition.");
    return { questions: getQuestionSet(data.questionIds).map(({ id, sentence }) => ({ id, sentence })), expiresAt: data.expiresAt.toDate().toISOString(), maxReplays: competition.maxReplays };
  }
  const questionIds = competition.questionIds as number[];
  const expiresAt = Timestamp.fromMillis(Math.min(now + competition.timeLimitSeconds * 1000, new Date(competition.endsAt).getTime()));
  await attemptRef.create({ userId: uid, questionIds, replayCounts: {}, status: "active", startedAt: FieldValue.serverTimestamp(), expiresAt });
  return { questions: getQuestionSet(questionIds).map(({ id, sentence }) => ({ id, sentence })), expiresAt: expiresAt.toDate().toISOString(), maxReplays: competition.maxReplays };
}

export async function recordOfficialReplay(competitionId: string, uid: string, questionId: number) {
  const db = getAdminDb();
  const competitionRef = db.doc(`competitions/${competitionId}`);
  const attemptRef = competitionRef.collection("attempts").doc(uid);
  await db.runTransaction(async (transaction) => {
    const [competitionSnapshot, attemptSnapshot] = await Promise.all([transaction.get(competitionRef), transaction.get(attemptRef)]);
    const competition = competitionSnapshot.data(); const attempt = attemptSnapshot.data();
    if (!competition || !attempt || attempt.status !== "active" || Date.now() > attempt.expiresAt.toMillis()) throw new Error("This attempt is no longer active.");
    if (!(attempt.questionIds as number[]).includes(questionId)) throw new Error("That question is not assigned to this attempt.");
    const count = Number(attempt.replayCounts?.[questionId] ?? 0);
    if (count >= competition.maxReplays) throw new Error("Replay limit reached.");
    transaction.update(attemptRef, { [`replayCounts.${questionId}`]: count + 1 });
  });
}

export async function submitOfficialAttempt(competitionId: string, uid: string, responses: { questionId: number; response: string }[]) {
  const db = getAdminDb();
  const competitionRef = db.doc(`competitions/${competitionId}`);
  const attemptRef = competitionRef.collection("attempts").doc(uid);
  const resultRef = competitionRef.collection("results").doc(uid);
  await db.runTransaction(async (transaction) => {
    const [competitionSnapshot, attemptSnapshot, userSnapshot] = await Promise.all([transaction.get(competitionRef), transaction.get(attemptRef), transaction.get(db.doc(`users/${uid}`))]);
    const competition = competitionSnapshot.data(); const attempt = attemptSnapshot.data(); const profile = userSnapshot.data();
    if (!competition || !attempt || !profile || attempt.status !== "active" || Date.now() > attempt.expiresAt.toMillis()) throw new Error("This attempt cannot be submitted.");
    const assigned = attempt.questionIds as number[];
    if (responses.length !== assigned.length || responses.some((item) => !assigned.includes(item.questionId))) throw new Error("Submitted answers do not match the assigned questions.");
    const answerById = new Map(responses.map((item) => [item.questionId, item.response]));
    const reviewed = getQuestionSet(assigned).map((question) => ({ questionId: question.id, correct: normalizeAnswer(answerById.get(question.id) ?? "") === normalizeAnswer(question.sentence) }));
    const correctAnswers = reviewed.filter((item) => item.correct).length;
    const score = correctAnswers * pointsByDifficulty[competition.difficulty as Difficulty];
    const result = { userId: uid, studentName: profile.displayName ?? "Student", schoolId: profile.schoolId ?? null, score, correctAnswers, totalQuestions: assigned.length, accuracy: Math.round((correctAnswers / assigned.length) * 100), submittedAt: FieldValue.serverTimestamp(), status: "final" };
    transaction.create(resultRef, result);
    transaction.update(attemptRef, { status: "submitted", submittedAt: FieldValue.serverTimestamp() });
    transaction.set(db.doc(`leaderboards/${competitionId}/students/${uid}`), result);
    if (profile.schoolId) transaction.set(db.doc(`leaderboards/${competitionId}/schools/${profile.schoolId}`), { schoolId: profile.schoolId, totalScore: FieldValue.increment(score), participants: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}
