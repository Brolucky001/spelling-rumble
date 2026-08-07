"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { HomeScreen } from "@/components/HomeScreen";
import { PracticeScreen } from "@/components/PracticeScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleDashboard } from "@/components/RoleDashboard";
import { AuthPanel } from "@/components/AuthPanel";
import { OfficialCompetitionPanel } from "@/components/OfficialCompetitionPanel";
import { auth } from "@/lib/firebase";
import { getPracticeResults, getUserProfile, savePracticeResult, signIn, signOutUser, signUp } from "@/lib/auth";
import { pickSessionQuestions } from "@/utils/questions";
import { getWordsPerMinute } from "@/utils/scoring";
import type { AnswerRecord, Difficulty, PortalRole, Question, SessionResult } from "@/types";

type Screen = "home" | "practice" | "results" | "dashboard" | "auth" | "official";

const storageKey = "spelling-rumble-results";

function readResults() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as SessionResult[];
  } catch {
    return [];
  }
}

export function GameShell() {
  const [screen, setScreen] = useState<Screen>("home");
  const [studentName, setStudentName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Beginner");
  const [sessionLength, setSessionLength] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [latestResult, setLatestResult] = useState<SessionResult | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [role, setRole] = useState<PortalRole>("student");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setResults(readResults());
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = window.localStorage.getItem("spelling-rumble-theme");
    setDarkMode(savedTheme ? savedTheme === "dark" : prefersDark);
  }, []);

  useEffect(() => { if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js"); }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("spelling-rumble-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser);
    if (!nextUser) return;
    try {
      const profile = await getUserProfile(nextUser);
      setStudentName(profile.displayName);
      setRole(profile.role);
      setResults(await getPracticeResults(nextUser.uid));
    } catch {
      setStudentName(nextUser.displayName ?? "Student");
      setRole("student");
    }
  }), []);

  const leaderboard = useMemo(
    () =>
      [...results]
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
          return a.completionTimeSeconds - b.completionTimeSeconds;
        })
        .slice(0, 20),
    [results]
  );

  function persistResults(nextResults: SessionResult[]) {
    setResults(nextResults);
    window.localStorage.setItem(storageKey, JSON.stringify(nextResults));
  }

  function startPractice() {
    setQuestions(pickSessionQuestions(difficulty, sessionLength));
    setStartedAt(Date.now());
    setLatestResult(null);
    setScreen("practice");
  }

  async function finishPractice(answers: AnswerRecord[]) {
    const correctAnswers = answers.filter((answer) => answer.correct).length;
    const totalQuestions = answers.length;
    const completionTimeSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const accuracy = Math.round(answers.reduce((sum, answer) => sum + answer.accuracy, 0) / totalQuestions);
    const score = answers.reduce((sum, answer) => sum + answer.points, 0);
    const wordsTyped = answers.reduce(
      (sum, answer) => sum + answer.response.trim().split(/\s+/).filter(Boolean).length,
      0
    );
    const result: SessionResult = {
      id: crypto.randomUUID(),
      studentName: studentName.trim(),
      difficulty,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      accuracy,
      completionTimeSeconds,
      wordsPerMinute: getWordsPerMinute(wordsTyped, completionTimeSeconds),
      score,
      xp: score,
      date: new Date().toISOString(),
      answers
    };
    setLatestResult(result);
    persistResults([result, ...results]);
    if (user) {
      try {
        await savePracticeResult(user.uid, result);
      } catch {
        // Practice data remains stored locally if Firestore cannot be reached.
      }
    }
    setScreen("results");
  }

  function deleteHistory() {
    persistResults([]);
  }

  return (
    <main id="app-content" className="min-h-screen text-slate-900 transition-colors dark:text-white">
      <a href="#main-menu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-primary-700">Skip to main menu</a>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <button type="button" onClick={() => setScreen("home")} className="flex items-center gap-3 text-left">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-600 text-xl text-gold-400 shadow-lg shadow-primary-600/20">✦</span>
            <span><span className="block text-xl font-black leading-none tracking-tight text-primary-600 dark:text-white">Spelling Rumble</span><span className="mt-1 block text-[10px] font-black tracking-[.16em] text-slate-400">LISTEN • TYPE • WIN</span></span>
          </button>
          <div className="flex items-center gap-3"><span className="hidden rounded-full bg-gold-100 px-3 py-1.5 text-xs font-black text-[#527d18] sm:block">⚡ Daily streak: 3</span><ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode((value) => !value)} /></div>
        </header>

        <nav id="main-menu" aria-label="Main menu" className="mb-6 rounded-2xl border border-primary-100 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-800">
          <div className="grid gap-2 sm:grid-cols-4">
            <MenuButton active={screen === "home"} label="Home" description="Practice and progress" onClick={() => setScreen("home")} />
            <MenuButton active={screen === "dashboard"} label="Dashboard" description={user ? `${role === "administrator" ? "Admin" : role} workspace` : "Sign in to view"} onClick={() => setScreen(user ? "dashboard" : "auth")} />
            <MenuButton active={screen === "official"} label="Official competition" description={user ? "Trusted arena and rankings" : "Sign in to participate"} onClick={() => setScreen(user ? "official" : "auth")} />
            {user ? <MenuButton label="Sign out" description={user.email ?? "Signed in"} onClick={() => void signOutUser()} /> : <MenuButton active={screen === "auth"} label="Sign in / Register" description="Student or school account" onClick={() => setScreen("auth")} />}
          </div>
        </nav>

        {screen === "home" && (
          <HomeScreen
            difficulty={difficulty}
            leaderboard={leaderboard}
            results={results}
            sessionLength={sessionLength}
            studentName={studentName}
            onDeleteHistory={deleteHistory}
            onDifficultyChange={setDifficulty}
            onSessionLengthChange={setSessionLength}
            onStart={startPractice}
            onStudentNameChange={setStudentName}
          />
        )}

        {screen === "practice" && (
          <PracticeScreen difficulty={difficulty} questions={questions} onFinish={finishPractice} />
        )}

        {screen === "results" && latestResult && (
          <ResultsScreen
            leaderboard={leaderboard}
            result={latestResult}
            onHome={() => setScreen("home")}
            onRestart={startPractice}
          />
        )}
        {screen === "dashboard" && user && <RoleDashboard role={role} results={results} userId={user.uid} onPractice={() => setScreen("home")} onOfficial={() => setScreen("official")} />}
        {screen === "auth" && <AuthPanel onSignIn={async (email, password) => { await signIn(email, password); setScreen("dashboard"); }} onSignUp={async (name, email, password, accountRole) => { await signUp(name, email, password, accountRole); setScreen("dashboard"); }} />}
        {screen === "official" && <OfficialCompetitionPanel role={role} />}
      </div>
    </main>
  );
}

function MenuButton({ active = false, label, description, onClick }: { active?: boolean; label: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-xl px-4 py-3 text-left transition ${active ? "bg-primary-600 text-white shadow-sm" : "bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-slate-900 dark:text-gold-400 dark:hover:bg-slate-700"}`}><span className="block font-black">{label}</span><span className={`mt-1 block text-xs font-semibold ${active ? "text-white/75" : "text-slate-500 dark:text-slate-300"}`}>{description}</span></button>;
}
