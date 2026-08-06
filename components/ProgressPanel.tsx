import type { Difficulty, SessionResult } from "@/types";

interface ProgressPanelProps {
  results: SessionResult[];
}

const difficultyOrder: Difficulty[] = ["Beginner", "Easy", "Medium", "Hard", "Professional", "Expert"];

export function ProgressPanel({ results }: ProgressPanelProps) {
  const totalXp = results.reduce((sum, result) => sum + result.xp, 0);
  const averageAccuracy = results.length
    ? Math.round(results.reduce((sum, result) => sum + result.accuracy, 0) / results.length)
    : 0;
  const bestScore = results.reduce((best, result) => Math.max(best, result.score), 0);
  const highestDifficulty = [...difficultyOrder]
    .reverse()
    .find((difficulty) => results.some((result) => result.difficulty === difficulty));

  return (
    <section className="rounded-[1.75rem] border border-primary-100 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-black tracking-widest text-primary-600">YOUR PRACTICE PROGRESS</p>
          <h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Every round counts.</h2>
        </div>
        <span className="rounded-full bg-gold-100 px-3 py-1 text-sm font-black text-[#527d18]">Local practice data</span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total XP" value={totalXp.toLocaleString()} />
        <Metric label="Best score" value={bestScore.toString()} />
        <Metric label="Average accuracy" value={`${averageAccuracy}%`} />
        <Metric label="Highest arena" value={highestDifficulty ?? "Not started"} />
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm font-bold text-slate-600 dark:text-slate-300">
          <span>Accuracy goal</span><span>{averageAccuracy}% / 90%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${Math.min(100, (averageAccuracy / 90) * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-primary-50 p-4 dark:bg-slate-900"><p className="text-2xl font-black text-primary-700 dark:text-gold-400">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p></div>;
}
