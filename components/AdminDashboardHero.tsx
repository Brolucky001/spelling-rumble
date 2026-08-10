"use client";

import { FormEvent, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

const defaults = { title: "Run a fair, connected competition.", description: "This foundation will host competition configuration, sentence libraries, rankings, reports, and system notices." };

async function request(method: "GET" | "PUT", body?: unknown) {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/admin/dashboard-copy", { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json() as { title?: string; description?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? "Unable to update dashboard content.");
  return { title: data.title ?? defaults.title, description: data.description ?? defaults.description };
}

export function AdminDashboardHero() {
  const [copy, setCopy] = useState(defaults); const [editing, setEditing] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { void request("GET").then(setCopy).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load dashboard content.")); }, []);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); try { setCopy(await request("PUT", copy)); setEditing(false); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save dashboard content."); } finally { setBusy(false); } }
  return <div className="rounded-[2rem] bg-primary-600 p-7 text-white shadow-soft sm:p-10"><p className="text-sm font-black tracking-widest text-gold-400">ADMINISTRATION</p>{editing ? <form onSubmit={save} className="mt-3 grid gap-3"><label className="grid gap-1 font-bold">Heading<input required value={copy.title} onChange={(event) => setCopy({ ...copy, title: event.target.value })} className="rounded-lg p-3 text-slate-950" /></label><label className="grid gap-1 font-bold">Description<textarea required value={copy.description} onChange={(event) => setCopy({ ...copy, description: event.target.value })} className="min-h-24 rounded-lg p-3 text-slate-950" /></label><div className="flex gap-2"><button disabled={busy} className="rounded-lg bg-gold-400 px-4 py-2 font-black text-primary-800">{busy ? "Saving…" : "Save changes"}</button><button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-white/50 px-4 py-2 font-black">Cancel</button></div></form> : <><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{copy.title}</h1><p className="mt-4 max-w-2xl text-lg text-white/80">{copy.description}</p><button type="button" onClick={() => setEditing(true)} className="mt-5 rounded-lg border border-white/50 px-4 py-2 text-sm font-black">Edit dashboard message</button></>}{error && <p role="alert" className="mt-3 rounded bg-red-100 p-2 text-sm font-bold text-red-800">{error}</p>}</div>;
}
