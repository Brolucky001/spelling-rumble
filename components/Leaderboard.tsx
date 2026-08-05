import { formatTime } from "@/utils/scoring";
import type { SessionResult } from "@/types";

interface LeaderboardProps {
  results: SessionResult[];
}

export function Leaderboard({ results }: LeaderboardProps) {
  return (
    <section className="rounded-lg border border-primary-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-2xl font-black text-slate-950 dark:text-white">Top 20 Scores</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-primary-100 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-3 pr-3 font-black">Rank</th>
              <th className="py-3 pr-3 font-black">Student</th>
              <th className="py-3 pr-3 font-black">Difficulty</th>
              <th className="py-3 pr-3 font-black">Score</th>
              <th className="py-3 pr-3 font-black">Accuracy</th>
              <th className="py-3 pr-3 font-black">Time</th>
              <th className="py-3 font-black">Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={result.id} className="border-b border-primary-50 last:border-0 dark:border-slate-700">
                <td className="py-3 pr-3 font-black text-gold-600 dark:text-gold-400">{index + 1}</td>
                <td className="py-3 pr-3 font-bold">{result.studentName}</td>
                <td className="py-3 pr-3">{result.difficulty}</td>
                <td className="py-3 pr-3">
                  {result.score}/{result.totalQuestions}
                </td>
                <td className="py-3 pr-3">{result.accuracy}%</td>
                <td className="py-3 pr-3">{formatTime(result.completionTimeSeconds)}</td>
                <td className="py-3">{new Date(result.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {results.length === 0 && (
        <p className="mt-4 rounded-md bg-primary-50 p-4 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Scores will appear after a practice session.
        </p>
      )}
    </section>
  );
}
