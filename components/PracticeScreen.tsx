"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { formatTime, getAnswerAccuracy, isCorrectAnswer, pointsByDifficulty, timeLimitByDifficulty } from "@/utils/scoring";
import type { AnswerRecord, Difficulty, Question } from "@/types";

interface PracticeScreenProps {
  difficulty: Difficulty;
  questions: Question[];
  onFinish: (answers: AnswerRecord[]) => void;
}

export function PracticeScreen({ difficulty, questions, onFinish }: PracticeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [plays, setPlays] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [feedback, setFeedback] = useState<AnswerRecord | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionElapsedSeconds, setQuestionElapsedSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const { isSpeaking, isPaused, speak, pause, resume } = useSpeechSynthesis();

  const question = questions[currentIndex];
  const timeLimit = timeLimitByDifficulty[difficulty];
  const timeRemaining = Math.max(0, timeLimit - questionElapsedSeconds);
  const progress = useMemo(
    () => Math.round(((feedback ? currentIndex + 1 : currentIndex) / questions.length) * 100),
    [currentIndex, feedback, questions.length]
  );

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (feedback) return;
    const timer = window.setInterval(() => setQuestionElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [currentIndex, feedback]);

  useEffect(() => {
    setResponse("");
    setPlays(0);
    setFeedback(null);
    setQuestionElapsedSeconds(0);
  }, [currentIndex]);

  function playAudio() {
    if (plays >= 3 || isSpeaking || feedback) return;
    setPlays((value) => value + 1);
    speak(question.sentence);
  }

  const submitAnswer = useCallback(() => {
    if (feedback || !question) return;
    const correct = isCorrectAnswer(response, question.sentence);
    const accuracy = getAnswerAccuracy(response, question.sentence);
    const points = correct ? pointsByDifficulty[difficulty] : 0;
    const record: AnswerRecord = {
      questionId: question.id,
      sentence: question.sentence,
      response,
      correct,
      accuracy,
      points,
      responseTimeSeconds: questionElapsedSeconds,
      replaysUsed: Math.max(0, plays - 1)
    };
    setScore((value) => value + points);
    const nextAnswers = [...answers, record];
    setAnswers(nextAnswers);
    setFeedback(record);

    window.setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        onFinish(nextAnswers);
      } else {
        setCurrentIndex((value) => value + 1);
      }
    }, 2000);
  }, [answers, currentIndex, difficulty, feedback, onFinish, plays, question, questionElapsedSeconds, questions.length, response]);

  useEffect(() => {
    if (timeRemaining === 0 && !feedback) submitAnswer();
  }, [timeRemaining, feedback, submitAnswer]);

  if (!question) {
    return null;
  }

  return (
    <section className="mx-auto grid w-full max-w-4xl flex-1 content-center pb-10">
      <div className="animate-fade-in overflow-hidden rounded-[1.75rem] border border-primary-100 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between bg-primary-600 px-5 py-3 text-sm font-black text-white sm:px-8"><span>⚡ LIVE PRACTICE ARENA</span><span className="text-gold-400">{question.sentence.split(" ").length} words</span></div>
        <div className="p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-600 dark:text-gold-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{difficulty} arena</h1>
          </div>
          <div className="flex gap-2"><div className="rounded-md bg-primary-50 px-4 py-2 text-lg font-black text-primary-700 dark:bg-slate-900 dark:text-gold-400">{formatTime(elapsedSeconds)}</div><div className={`rounded-md px-4 py-2 text-lg font-black ${timeRemaining <= 10 ? "bg-red-100 text-red-700" : "bg-gold-100 text-[#527d18]"}`}>{formatTime(timeRemaining)}</div><div className="rounded-md bg-gold-100 px-4 py-2 text-lg font-black text-[#527d18]">{score} XP</div></div>
        </div>

        <div className="mb-7 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-gold-400 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={playAudio}
            disabled={isSpeaking || plays >= 3 || Boolean(feedback)}
            className="min-h-14 rounded-xl bg-primary-600 px-6 py-3 text-lg font-black text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700"
          >
            {isSpeaking ? "Playing..." : "▶ Play sentence"}
          </button>
          {isSpeaking && <button type="button" onClick={isPaused ? resume : pause} className="min-h-14 rounded-xl border border-primary-200 bg-white px-5 py-3 text-lg font-black text-primary-700 transition hover:bg-primary-50 dark:bg-slate-900 dark:text-gold-400">{isPaused ? "Resume audio" : "Pause audio"}</button>}
          <span className="text-base font-bold text-slate-600 dark:text-slate-300">
            Replays used: {Math.max(0, plays - 1)} / 2
          </span>
        </div>

        <label className="mb-5 grid gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          Type what you hear
          <textarea
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            disabled={Boolean(feedback)}
            placeholder="Start typing the sentence here..."
            className="min-h-40 resize-y rounded-xl border border-primary-100 bg-primary-50 p-4 text-xl leading-8 text-slate-950 shadow-inner transition focus:border-primary-600 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            autoFocus
          />
          <span className="text-right text-sm font-bold text-slate-400">{response.length} characters · {formatTime(timeRemaining)} remaining</span>
        </label>

        <button
          type="button"
          onClick={submitAnswer}
          disabled={!response.trim() || Boolean(feedback)}
          className="min-h-14 w-full rounded-xl bg-gold-500 px-6 py-3 text-xl font-black text-primary-700 shadow-sm transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700"
        >
          Submit
        </button>

        {feedback && (
          <div aria-live="polite" className="mt-6 animate-fade-in rounded-xl border border-primary-100 bg-primary-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className={`text-2xl font-black ${feedback.correct ? "text-green-600" : "text-red-600"}`}>
              {feedback.correct ? "Correct" : "Incorrect"}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">{feedback.correct ? `+${feedback.points} XP • Perfect spelling` : `${feedback.accuracy}% character match`}</p>
            <p className="mt-2 text-lg text-slate-700 dark:text-slate-200">Correct answer: {feedback.sentence}</p>
          </div>
        )}
        </div></div>
    </section>
  );
}
