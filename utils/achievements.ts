import type { SessionResult } from "../types";

export type Achievement = { id: string; label: string; description: string; unlocked: boolean; progress: number; target: number };

export function getAchievements(results: SessionResult[]): Achievement[] {
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const perfectSessions = results.filter((result) => result.accuracy === 100).length;
  const totalCorrect = results.reduce((sum, result) => sum + result.correctAnswers, 0);
  return [
    { id: "first-session", label: "First Step", description: "Complete one practice session.", unlocked: results.length >= 1, progress: Math.min(results.length, 1), target: 1 },
    { id: "first-win", label: "First Win", description: "Answer at least one sentence correctly in a session.", unlocked: results.some((result) => result.correctAnswers > 0), progress: results.some((result) => result.correctAnswers > 0) ? 1 : 0, target: 1 },
    { id: "perfect-session", label: "Perfect Listener", description: "Complete a session with 100% accuracy.", unlocked: perfectSessions >= 1, progress: Math.min(perfectSessions, 1), target: 1 },
    { id: "score-100", label: "Century Score", description: "Earn a total practice score of 100.", unlocked: totalScore >= 100, progress: Math.min(totalScore, 100), target: 100 },
    { id: "correct-25", label: "Word Champion", description: "Answer 25 sentences correctly.", unlocked: totalCorrect >= 25, progress: Math.min(totalCorrect, 25), target: 25 }
  ];
}
