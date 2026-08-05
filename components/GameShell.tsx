"use client";

import { useEffect, useMemo, useState } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { PracticeScreen } from "@/components/PracticeScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { ThemeToggle } from "@/components/ThemeToggle";
import { pickSessionQuestions } from "@/utils/questions";
import type { AnswerRecord, Difficulty, Question, SessionResult } from "@/types";

type Screen = "home" | "practice" | "results";

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

  useEffect(() => {
    setResults(readResults());
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = window.localStorage.getItem("spelling-rumble-theme");
    setDarkMode(savedTheme ? savedTheme === "dark" : prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("spelling-rumble-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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

  function finishPractice(answers: AnswerRecord[]) {
    const correctAnswers = answers.filter((answer) => answer.correct).length;
    const totalQuestions = answers.length;
    const completionTimeSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const accuracy = Math.round(answers.reduce((sum, answer) => sum + answer.accuracy, 0) / totalQuestions);
    const score = answers.reduce((sum, answer) => sum + answer.points, 0);
    const result: SessionResult = {
      id: crypto.randomUUID(),
      studentName: studentName.trim(),
      difficulty,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      accuracy,
      completionTimeSeconds,
      score,
      xp: score,
      date: new Date().toISOString(),
      answers
    };
    setLatestResult(result);
    persistResults([result, ...results]);
    setScreen("results");
  }

  function deleteHistory() {
    persistResults([]);
  }

  return (
    <main className="min-h-screen text-slate-900 transition-colors dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <button type="button" onClick={() => setScreen("home")} className="flex items-center gap-3 text-left">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-600 text-xl text-gold-400 shadow-lg shadow-primary-600/20">✦</span>
            <span><span className="block text-xl font-black leading-none tracking-tight text-primary-600 dark:text-white">Spelling Rumble</span><span className="mt-1 block text-[10px] font-black tracking-[.16em] text-slate-400">LISTEN • TYPE • WIN</span></span>
          </button>
          <div className="flex items-center gap-3"><span className="hidden rounded-full bg-gold-100 px-3 py-1.5 text-xs font-black text-[#527d18] sm:block">⚡ Daily streak: 3</span><ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode((value) => !value)} /></div>
        </header>

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
      </div>
    </main>
  );
}
