import { Leaderboard } from "@/components/Leaderboard";
import { ScoreCircle } from "@/components/ScoreCircle";
import { formatTime, getPerformanceMessage } from "@/utils/scoring";
import type { SessionResult } from "@/types";

interface ResultsScreenProps {
  result: SessionResult;
  leaderboard: SessionResult[];
  onRestart: () => void;
  onHome: () => void;
}

export function ResultsScreen({ result, leaderboard, onRestart, onHome }: ResultsScreenProps) {
  return (
    <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="animate-fade-in rounded-lg border border-primary-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-800 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <ScoreCircle value={result.accuracy} />
          <div>
            <p className="text-base font-bold uppercase tracking-[0.12em] text-gold-600 dark:text-gold-400">
              Results
            </p>
            <h1 className="mt-1 text-4xl font-black text-slate-950 dark:text-white">
              {getPerformanceMessage(result.accuracy)}
            </h1>
            <p className="mt-3 text-lg text-slate-700 dark:text-slate-200">
              {result.studentName} completed {result.totalQuestions} {result.difficulty} questions.
            </p>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResultStat label="Correct" value={result.correctAnswers.toString()} />
          <ResultStat label="Incorrect" value={result.incorrectAnswers.toString()} />
          <ResultStat label="Accuracy" value={`${result.accuracy}%`} />
          <ResultStat label="XP earned" value={result.xp.toString()} />
          <ResultStat label="Time" value={formatTime(result.completionTimeSeconds)} />
          <ResultStat label="Difficulty" value={result.difficulty} />
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="min-h-12 rounded-md bg-primary-600 px-5 py-3 font-black text-white transition hover:bg-primary-700"
          >
            Practice Again
          </button>
          <button
            type="button"
            onClick={onHome}
            className="min-h-12 rounded-md border border-primary-100 bg-white px-5 py-3 font-black text-primary-700 transition hover:bg-primary-50 dark:border-slate-600 dark:bg-slate-900 dark:text-gold-400 dark:hover:bg-slate-700"
          >
            Home
          </button>
        </div>
      </section>

      <Leaderboard results={leaderboard} />
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary-100 bg-primary-50 p-4 dark:border-slate-700 dark:bg-slate-900">
      <dt className="text-sm font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</dd>
    </div>
  );
}
