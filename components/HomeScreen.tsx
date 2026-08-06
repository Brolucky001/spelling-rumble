import { difficulties, sessionLengths } from "@/utils/questions";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ProgressPanel } from "@/components/ProgressPanel";
import type { Difficulty, SessionResult } from "@/types";

interface HomeScreenProps {
  studentName: string; difficulty: Difficulty; sessionLength: number; leaderboard: SessionResult[]; results: SessionResult[];
  onStudentNameChange: (value: string) => void; onDifficultyChange: (value: Difficulty) => void;
  onSessionLengthChange: (value: number) => void; onStart: () => void; onDeleteHistory: () => void;
}

const levels: Record<Difficulty, { label: string; words: string; color: string }> = {
  Beginner: { label: "Level 1", words: "3–6 words", color: "bg-[#EAF8D5] text-[#4C7E14]" },
  Easy: { label: "Level 2", words: "5–8 words", color: "bg-[#FFF1D9] text-[#B86C00]" },
  Medium: { label: "Level 3", words: "8–12 words", color: "bg-[#F8E2EC] text-primary-600" },
  Hard: { label: "Level 4", words: "12–16 words", color: "bg-[#E7E9FF] text-[#4C49B5]" },
  Professional: { label: "Level 5", words: "14–18 words", color: "bg-[#FCE8D9] text-[#A4460A]" },
  Expert: { label: "Level 6", words: "16+ words", color: "bg-[#EEE7F7] text-[#7147A3]" }
};

export function HomeScreen({ studentName, difficulty, sessionLength, results, onDeleteHistory, onStudentNameChange, onDifficultyChange, onSessionLengthChange, onStart }: HomeScreenProps) {
  const total = results.length;
  const accuracy = total ? Math.round(results.reduce((sum, result) => sum + result.accuracy, 0) / total) : 0;
  return <div className="animate-fade-in pb-10">
    <section className="relative overflow-hidden rounded-[2rem] bg-primary-600 px-6 py-9 text-white shadow-soft sm:px-10 sm:py-12">
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[28px] border-white/10" />
      <div className="absolute bottom-[-110px] right-40 h-56 w-56 rounded-full bg-gold-500/25 blur-xl" />
      <div className="relative grid items-center gap-9 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur"><span className="h-2 w-2 rounded-full bg-gold-400" />THE SMART WAY TO SPELL</div>
          <h1 className="max-w-xl text-5xl font-black leading-[.98] tracking-tight sm:text-7xl">Listen. Type.<br /><span className="text-gold-400">Rumble.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-7 text-white/80">Turn every sentence into a win. Build your listening, spelling and punctuation skills one challenge at a time.</p>
          <div className="mt-8 flex flex-wrap gap-5 text-sm font-bold text-white/80"><span>◉ AI-powered practice</span><span>◈ 6 skill levels</span><span>♕ Daily rewards</span></div>
        </div>
        <div className="floaty relative mx-auto w-full max-w-sm rounded-[1.75rem] border border-white/20 bg-white/[.12] p-5 backdrop-blur-md">
          <div className="flex items-center justify-between"><span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-black text-primary-700">DAILY CHALLENGE</span><span className="text-sm font-bold">🔥 3 day streak</span></div>
          <div className="mt-7 rounded-2xl bg-white p-5 text-slate-900 shadow-xl"><p className="text-xs font-black tracking-widest text-primary-600">TODAY’S MISSION</p><p className="mt-2 text-xl font-black">Spell 10 sentences<br />without a mistake.</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[40%] rounded-full bg-gold-500" /></div><p className="mt-2 text-xs font-bold text-slate-500">4 of 10 complete</p></div>
        </div>
      </div>
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <div className="rounded-[1.75rem] border border-primary-100 bg-white p-6 shadow-soft sm:p-8 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-black tracking-widest text-primary-600">START A SESSION</p><h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Ready to make some noise?</h2></div><span className="rounded-full bg-gold-100 px-3 py-1 text-sm font-bold text-[#4d7815]">Free practice</span></div>
        <div className="mt-7 grid gap-5">
          <label className="grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">WHAT SHOULD WE CALL YOU?<input value={studentName} onChange={(e) => onStudentNameChange(e.target.value)} className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-lg font-bold text-slate-900 outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:bg-slate-900 dark:text-white" placeholder="Enter your name" /></label>
          <div><p className="mb-3 text-sm font-black text-slate-700 dark:text-slate-200">PICK YOUR ARENA</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{difficulties.map((item) => <button key={item} type="button" onClick={() => onDifficultyChange(item)} className={`rounded-xl border p-3 text-left transition ${difficulty === item ? "border-primary-600 bg-primary-50 ring-2 ring-primary-100 dark:bg-primary-900/30" : "border-slate-200 hover:border-primary-200 dark:border-slate-600"}`}><span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${levels[item].color}`}>{levels[item].label}</span><span className="mt-2 block font-black text-slate-900 dark:text-white">{item}</span><span className="text-xs font-semibold text-slate-500">{levels[item].words}</span></button>)}</div></div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><div><p className="font-black">Session length</p><p className="text-sm text-slate-500">Choose your challenge</p></div><div className="flex rounded-lg bg-white p-1 shadow-sm dark:bg-slate-800">{sessionLengths.map((item) => <button key={item} type="button" onClick={() => onSessionLengthChange(item)} className={`rounded-md px-3 py-2 text-sm font-black ${sessionLength === item ? "bg-primary-600 text-white" : "text-slate-500"}`}>{item}</button>)}</div></div>
          <button type="button" disabled={!studentName.trim()} onClick={onStart} className="h-15 min-h-14 rounded-xl bg-primary-600 px-6 text-lg font-black text-white shadow-lg shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300">Start rumbling <span className="ml-2">→</span></button>
        </div>
      </div>
      <aside className="grid gap-6"><div className="rounded-[1.75rem] bg-[#1D1620] p-6 text-white shadow-soft"><p className="text-xs font-black tracking-widest text-gold-400">YOUR PROGRESS</p><div className="mt-5 grid grid-cols-2 gap-5"><Metric value={total.toString()} label="Games played" /><Metric value={`${accuracy}%`} label="Avg. accuracy" /><Metric value="0" label="Current XP" /><Metric value="—" label="Global rank" /></div><div className="mt-6 rounded-xl bg-white/10 p-4"><div className="flex justify-between text-sm font-bold"><span>Next badge</span><span className="text-gold-400">First Win</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[15%] rounded-full bg-gold-500" /></div></div></div><div className="rounded-[1.75rem] border border-primary-100 bg-primary-50 p-6 dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-black text-primary-600">HOW IT WORKS</p><ol className="mt-4 grid gap-4 text-sm font-bold text-slate-700 dark:text-slate-200"><li><span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">1</span>Listen closely to the sentence</li><li><span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">2</span>Type exactly what you hear</li><li><span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">3</span>Earn XP, streaks and badges</li></ol></div></aside>
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <ProgressPanel results={results} />
      <HistoryPanel results={results} onDeleteHistory={onDeleteHistory} />
    </section>
  </div>;
}
function Metric({ value, label }: { value: string; label: string }) { return <div><p className="text-2xl font-black text-gold-400">{value}</p><p className="mt-1 text-xs font-semibold text-white/55">{label}</p></div>; }
