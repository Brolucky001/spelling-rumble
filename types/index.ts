export type Difficulty = "Beginner" | "Easy" | "Medium" | "Hard" | "Professional" | "Expert";

export interface Question {
  id: number;
  difficulty: Difficulty;
  sentence: string;
}

export interface AnswerRecord {
  questionId: number;
  sentence: string;
  response: string;
  correct: boolean;
  accuracy: number;
  points: number;
}

export interface SessionResult {
  id: string;
  studentName: string;
  difficulty: Difficulty;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  completionTimeSeconds: number;
  score: number;
  xp: number;
  date: string;
  answers: AnswerRecord[];
}
