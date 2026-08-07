import { describe, expect, it } from "vitest";
import { getAnswerAccuracy, getPerformanceMessage, getWordsPerMinute, isCorrectAnswer, normalizeAnswer } from "../utils/scoring";

describe("scoring engine", () => {
  it("normalizes surrounding and repeated whitespace", () => expect(normalizeAnswer("  A   good  sentence. ")).toBe("A good sentence."));
  it("requires spelling, punctuation, and capitalization to match", () => { expect(isCorrectAnswer("The dog runs.", "The dog runs.")).toBe(true); expect(isCorrectAnswer("the dog runs.", "The dog runs.")).toBe(false); });
  it("calculates character accuracy and typing speed safely", () => { expect(getAnswerAccuracy("cat", "cat")).toBe(100); expect(getAnswerAccuracy("", "cat")).toBe(0); expect(getWordsPerMinute(20, 60)).toBe(20); expect(getWordsPerMinute(0, 0)).toBe(0); });
  it("returns a learner-friendly performance message", () => { expect(getPerformanceMessage(95)).toBe("Outstanding!"); expect(getPerformanceMessage(45)).toBe("Keep practising."); });
});
