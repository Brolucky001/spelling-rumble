import { formatTime } from "@/utils/scoring";
import type { SessionResult } from "@/types";

interface HistoryPanelProps {
  results: SessionResult[];
  onDeleteHistory: () => void;
}

export function HistoryPanel({ results, onDeleteHistory }: HistoryPanelProps) {
  return (
    <section className="rounded-lg border border-primary-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Practice History</h2>
        <button
          type="button"
          onClick={onDeleteHistory}
          disabled={results.length === 0}
          className="min-h-10 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-red-900 dark:bg-slate-900 dark:hover:bg-red-950 dark:disabled:border-slate-700"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 grid max-h-[360px] gap-3 overflow-y-auto pr-1">
        {results.map((result) => (
          <article
            key={result.id}
            className="rounded-lg border border-primary-100 bg-primary-50 p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950 dark:text-white">{result.studentName}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {result.difficulty} · {new Date(result.date).toLocaleString()}
                </p>
              </div>
              <div className="text-right font-black text-primary-700 dark:text-gold-400">{result.accuracy}%</div>
            </div>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
              Score {result.score}/{result.totalQuestions} · Time {formatTime(result.completionTimeSeconds)}
            </p>
          </article>
        ))}
      </div>

      {results.length === 0 && (
        <p className="mt-4 rounded-md bg-primary-50 p-4 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Previous sessions will be saved on this device.
        </p>
      )}
    </section>
  );
}
