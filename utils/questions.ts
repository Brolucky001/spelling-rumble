import questions from "../data/questions.json";
import type { Difficulty, Question } from "../types";

export const difficulties: Difficulty[] = ["Beginner", "Easy", "Medium", "Hard", "Professional", "Expert"];
export const sessionLengths = [5, 10, 20] as const;

export function getQuestionsByDifficulty(difficulty: Difficulty) {
  return (questions as Question[]).filter((question) => question.difficulty === difficulty);
}

export function pickSessionQuestions(difficulty: Difficulty, count: number) {
  const pool = getQuestionsByDifficulty(difficulty);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  if (difficulty !== "Beginner" || count < 1) return shuffled.slice(0, count);

  // Every Beginner practice session includes one interrogative sentence so
  // learners consistently practise question marks from the first level.
  const questionSentence = shuffled.find((question) => question.sentence.trim().endsWith("?"));
  if (!questionSentence) return shuffled.slice(0, count);
  return [questionSentence, ...shuffled.filter((question) => question.id !== questionSentence.id)].slice(0, count);
}
