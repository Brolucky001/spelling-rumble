export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isCorrectAnswer(response: string, sentence: string) {
  return normalizeAnswer(response) === normalizeAnswer(sentence);
}

export function getAnswerAccuracy(response: string, sentence: string) {
  const expected = normalizeAnswer(sentence);
  const actual = normalizeAnswer(response);
  if (!actual) return 0;
  const length = Math.max(expected.length, actual.length);
  let matches = 0;
  for (let index = 0; index < Math.min(expected.length, actual.length); index += 1) {
    if (expected[index] === actual[index]) matches += 1;
  }
  return Math.round((matches / length) * 100);
}

export function getWordsPerMinute(wordsTyped: number, elapsedSeconds: number) {
  if (wordsTyped === 0 || elapsedSeconds === 0) return 0;
  return Math.round((wordsTyped / elapsedSeconds) * 60);
}

export const timeLimitByDifficulty = {
  Beginner: 45,
  Easy: 50,
  Medium: 60,
  Hard: 75,
  Professional: 90,
  Expert: 90
} as const;

export const pointsByDifficulty = { Beginner: 10, Easy: 15, Medium: 25, Hard: 50, Professional: 75, Expert: 100 } as const;

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getPerformanceMessage(accuracy: number) {
  if (accuracy >= 90) return "Outstanding!";
  if (accuracy >= 80) return "Excellent!";
  if (accuracy >= 70) return "Very Good!";
  if (accuracy >= 50) return "Good effort.";
  return "Keep practising.";
}
