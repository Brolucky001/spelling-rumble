/** Counts consecutive calendar days with at least one completed practice session. */
export function getDailyPracticeStreak(results: Array<{ date: string }>, now = new Date()) {
  const completedDays = new Set(
    results.flatMap((result) => {
      const date = new Date(result.date);
      return Number.isNaN(date.getTime()) ? [] : [toLocalDayKey(date)];
    })
  );
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!completedDays.has(toLocalDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (completedDays.has(toLocalDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toLocalDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
