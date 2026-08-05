import questions from "@/data/questions.json";
import type { Difficulty, Question } from "@/types";

export const difficulties: Difficulty[] = ["Beginner", "Easy", "Medium", "Hard", "Professional", "Expert"];
export const sessionLengths = [5, 10, 20] as const;

export function getQuestionsByDifficulty(difficulty: Difficulty) {
  return (questions as Question[]).filter((question) => question.difficulty === difficulty);
}

export function pickSessionQuestions(difficulty: Difficulty, count: number) {
  const pool = getQuestionsByDifficulty(difficulty);
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}
