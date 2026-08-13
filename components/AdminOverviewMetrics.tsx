"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type Overview = { schools: number; activeEvents: number; pendingReviews: number };

const emptyOverview: Overview = { schools: 0, activeEvents: 0, pendingReviews: 0 };

export function AdminOverviewMetrics() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json() as Partial<Overview> & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to load administration overview.");
        setOverview({ schools: data.schools ?? 0, activeEvents: data.activeEvents ?? 0, pendingReviews: data.pendingReviews ?? 0 });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load administration overview.");
      }
    }
    void load();
  }, []);

  const cards = [
    { label: "Registered schools", value: overview?.schools ?? emptyOverview.schools },
    { label: "Active events", value: overview?.activeEvents ?? emptyOverview.activeEvents },
    { label: "Pending reviews", value: overview?.pendingReviews ?? emptyOverview.pendingReviews }
  ];

  return <><div className="mt-6 grid gap-4 sm:grid-cols-3">{cards.map((card) => <div key={card.label} className="rounded-2xl border border-primary-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-800"><p className="text-3xl font-black text-primary-700 dark:text-gold-400">{overview ? card.value : "…"}</p><p className="mt-1 text-sm font-bold text-slate-500">{card.label}</p></div>)}</div>{error && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{error}</p>}</>;
}
