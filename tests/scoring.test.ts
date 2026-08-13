import { describe, expect, it } from "vitest";
import { getAnswerAccuracy, getPerformanceMessage, getWordsPerMinute, isCorrectAnswer, normalizeAnswer } from "../utils/scoring";
import { pickSessionQuestions } from "../utils/questions";
import { getAchievements } from "../utils/achievements";
import { getDailyPracticeStreak } from "../utils/streak";

describe("scoring engine", () => {
  it("normalizes surrounding and repeated whitespace", () => expect(normalizeAnswer("  A   good  sentence. ")).toBe("A good sentence."));
  it("requires spelling, punctuation, and capitalization to match", () => { expect(isCorrectAnswer("The dog runs.", "The dog runs.")).toBe(true); expect(isCorrectAnswer("the dog runs.", "The dog runs.")).toBe(false); });
  it("calculates character accuracy and typing speed safely", () => { expect(getAnswerAccuracy("cat", "cat")).toBe(100); expect(getAnswerAccuracy("", "cat")).toBe(0); expect(getWordsPerMinute(20, 60)).toBe(20); expect(getWordsPerMinute(0, 0)).toBe(0); });
  it("returns a learner-friendly performance message", () => { expect(getPerformanceMessage(95)).toBe("Outstanding!"); expect(getPerformanceMessage(45)).toBe("Keep practising."); });
  it("always includes a question sentence in Beginner practice sessions", () => { expect(pickSessionQuestions("Beginner", 5).some((question) => question.sentence.endsWith("?"))).toBe(true); });
  it("unlocks practice badges from saved result progress", () => { const result = { id: "one", studentName: "Ada", difficulty: "Beginner" as const, totalQuestions: 5, correctAnswers: 5, incorrectAnswers: 0, accuracy: 100, completionTimeSeconds: 30, wordsPerMinute: 10, score: 50, xp: 50, date: "2026-08-13", answers: [] }; expect(getAchievements([result]).filter((badge) => badge.unlocked).map((badge) => badge.id)).toEqual(["first-session", "first-win", "perfect-session"]); });
  it("calculates a consecutive daily practice streak without double-counting a day", () => {
    const now = new Date(2026, 7, 13, 12);
    expect(getDailyPracticeStreak([{ date: "2026-08-13T08:00:00" }, { date: "2026-08-12T08:00:00" }, { date: "2026-08-12T18:00:00" }, { date: "2026-08-10T08:00:00" }], now)).toBe(2);
    expect(getDailyPracticeStreak([{ date: "2026-08-11T08:00:00" }], now)).toBe(0);
  });
});
