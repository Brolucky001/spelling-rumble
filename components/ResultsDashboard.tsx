"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { PortalRole } from "@/types";

interface ResultsDashboardProps { role: PortalRole; userId: string; }

async function get(path: string) { const token = await auth.currentUser?.getIdToken(); const response = await fetch(path, { headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to load dashboard."); return data; }

export function ResultsDashboard({ role, userId }: ResultsDashboardProps) {
  const [data, setData] = useState<Record<string, unknown> | unknown[] | null>(null); const [error, setError] = useState("");
  useEffect(() => { if (role === "teacher") return; const path = role === "student" ? "/api/results/me" : role === "school" ? `/api/schools/${userId}/report` : "/api/admin/overview"; void get(path).then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load dashboard.")); }, [role, userId]);
  if (role === "teacher") return <p className="mt-6 rounded-xl bg-primary-50 p-4 text-sm font-bold text-primary-700 dark:bg-slate-900 dark:text-gold-400">Your school administrator can assign you to a school. Assigned school reporting is the next teacher-dashboard enhancement.</p>;
  if (error) return <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>;
  if (!data) return <p className="mt-6 text-sm font-bold text-slate-500">Loading trusted dashboard data...</p>;
  if (Array.isArray(data)) return <section className="mt-6"><h2 className="text-2xl font-black">Official results</h2>{data.length ? <div className="mt-3 grid gap-3">{data.map((result) => { const item = result as { id: string; score: number; accuracy: number; totalQuestions: number; maximumScore?: number }; const maximumScore = item.maximumScore ?? item.score; return <div key={item.id} className="rounded-xl bg-primary-50 p-4 dark:bg-slate-900"><dl className="grid gap-1 text-sm sm:grid-cols-3 sm:gap-4"><div><dt className="font-bold text-slate-500">Question</dt><dd className="text-lg font-black">{item.totalQuestions}</dd></div><div><dt className="font-bold text-slate-500">Score</dt><dd className="text-lg font-black text-primary-700 dark:text-gold-400">{item.score}/{maximumScore}</dd></div><div><dt className="font-bold text-slate-500">Accuracy</dt><dd className="text-lg font-black">{item.accuracy}%</dd></div></dl></div>; })}</div> : <p className="mt-3 text-slate-500">No official results yet.</p>}</section>;
  return <section className="mt-6 grid gap-3 sm:grid-cols-3">{Object.entries(data).filter(([, value]) => typeof value === "number").map(([label, value]) => <div key={label} className="rounded-xl bg-primary-50 p-4 dark:bg-slate-900"><p className="text-2xl font-black text-primary-700 dark:text-gold-400">{String(value)}</p><p className="text-sm font-bold capitalize text-slate-500">{label.replace(/([A-Z])/g, " $1")}</p></div>)}</section>;
}
