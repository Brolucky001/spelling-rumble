"use client";

import { FormEvent, useState } from "react";
import { auth } from "@/lib/firebase";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { Difficulty, PortalRole } from "@/types";

interface OfficialCompetitionPanelProps { role: PortalRole; }
type AssignedQuestion = { id: number; sentence: string };

async function api(path: string, body?: unknown) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to continue.");
  const response = await fetch(path, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function OfficialCompetitionPanel({ role }: OfficialCompetitionPanelProps) {
  const [competitionId, setCompetitionId] = useState("");
  const [questions, setQuestions] = useState<AssignedQuestion[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState("");
  const { speak, isSpeaking } = useSpeechSynthesis();

  async function start() { try { setNotice(""); const data = await api(`/api/competitions/${competitionId}/start`, {}); setQuestions(data.questions); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to start."); } }
  async function replay(questionId: number, sentence: string) { try { await api(`/api/competitions/${competitionId}/replay`, { questionId }); speak(sentence); } catch (error) { setNotice(error instanceof Error ? error.message : "Replay unavailable."); } }
  async function submit() { try { await api(`/api/competitions/${competitionId}/submit`, { responses: questions.map((question) => ({ questionId: question.id, response: responses[question.id] ?? "" })) }); setQuestions([]); setNotice("Official result submitted. Rankings update from the trusted server."); } catch (error) { setNotice(error instanceof Error ? error.message : "Submission failed."); } }

  if (role === "administrator") return <AdminCompetitionForm onCreated={(id) => { setCompetitionId(id); setNotice(`Competition created: ${id}`); }} notice={notice} />;
  return <section className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-primary-100 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-black tracking-widest text-primary-600">OFFICIAL COMPETITION</p><h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Trusted competition arena</h1><label className="mt-6 grid gap-2 font-bold">Competition ID<input value={competitionId} onChange={(event) => setCompetitionId(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-950 dark:bg-slate-900 dark:text-white" /></label>{!questions.length && <button type="button" onClick={() => void start()} className="mt-4 rounded-lg bg-primary-600 px-5 py-3 font-black text-white">Start official attempt</button>}{questions.map((question, index) => <div key={question.id} className="mt-5 rounded-xl bg-primary-50 p-4 dark:bg-slate-900"><p className="font-black">Question {index + 1}</p><button type="button" disabled={isSpeaking} onClick={() => void replay(question.id, question.sentence)} className="mt-3 rounded-lg border border-primary-200 px-4 py-2 font-black text-primary-700 dark:text-gold-400">{isSpeaking ? "Playing..." : "Play sentence"}</button><textarea value={responses[question.id] ?? ""} onChange={(event) => setResponses({ ...responses, [question.id]: event.target.value })} className="mt-3 min-h-24 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-950 dark:bg-slate-800 dark:text-white" placeholder="Type exactly what you hear" /></div>)}{questions.length > 0 && <button type="button" onClick={() => void submit()} className="mt-5 rounded-lg bg-gold-500 px-5 py-3 font-black text-primary-700">Submit official answers</button>}<Rankings competitionId={competitionId} />{notice && <p role="status" className="mt-4 rounded-lg bg-primary-50 p-3 font-bold text-primary-700 dark:bg-slate-900 dark:text-gold-400">{notice}</p>}</section>;
}

function AdminCompetitionForm({ onCreated, notice }: { onCreated: (id: string) => void; notice: string }) {
  const [title, setTitle] = useState(""); const [difficulty, setDifficulty] = useState<Difficulty>("Beginner"); const [questionIds, setQuestionIds] = useState(""); const [startsAt, setStartsAt] = useState(""); const [endsAt, setEndsAt] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { const data = await api("/api/competitions", { title, difficulty, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), questionIds: questionIds.split(",").map(Number).filter(Number.isInteger), maxReplays: 2, timeLimitSeconds: 600, eligibleStudentIds: [] }); onCreated(data.id); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create competition."); } }
  return <section className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-primary-100 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-black tracking-widest text-primary-600">COMPETITION ADMINISTRATION</p><h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Create an official competition</h1><form onSubmit={submit} className="mt-6 grid gap-4"><input required value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border p-3 text-slate-950" placeholder="Competition title" /><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="rounded-lg border p-3 text-slate-950">{(["Beginner","Easy","Medium","Hard","Professional","Expert"] as Difficulty[]).map((item) => <option key={item}>{item}</option>)}</select><input required value={questionIds} onChange={(event) => setQuestionIds(event.target.value)} className="rounded-lg border p-3 text-slate-950" placeholder="Question IDs, e.g. 1,2,3,4,5" /><label className="font-bold">Starts at<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-950" /></label><label className="font-bold">Ends at<input required type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-950" /></label><button className="rounded-lg bg-primary-600 px-5 py-3 font-black text-white">Create competition</button></form>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}{notice && <p role="status" className="mt-3 text-primary-700">{notice}</p>}<StudentAssignment /></section>;
}

function StudentAssignment() { const [schoolId, setSchoolId] = useState(""); const [studentId, setStudentId] = useState(""); const [message, setMessage] = useState(""); async function assign() { try { await api(`/api/schools/${schoolId}/students`, { studentId }); setMessage("Student assigned to school."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to assign student."); } } return <div className="mt-8 border-t pt-5"><h2 className="font-black">Assign a student to an approved school</h2><div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={schoolId} onChange={(event) => setSchoolId(event.target.value)} className="rounded-lg border p-3 text-slate-950" placeholder="School ID" /><input value={studentId} onChange={(event) => setStudentId(event.target.value)} className="rounded-lg border p-3 text-slate-950" placeholder="Student user ID" /></div><button type="button" onClick={() => void assign()} className="mt-3 rounded-lg border border-primary-200 px-4 py-2 font-black text-primary-700">Assign student</button>{message && <p className="mt-2 text-sm">{message}</p>}</div>; }

function Rankings({ competitionId }: { competitionId: string }) {
  const [data, setData] = useState<{ students: { rank: number; studentName: string; score: number }[]; schools: { rank: number; name: string; totalScore: number }[] } | null>(null); const [error, setError] = useState("");
  async function load() { try { setData(await api(`/api/rankings/${competitionId}`)); setError(""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load rankings."); } }
  return <div className="mt-7 border-t border-primary-100 pt-5"><button type="button" disabled={!competitionId} onClick={() => void load()} className="rounded-lg border border-primary-200 px-4 py-2 font-black text-primary-700 dark:text-gold-400">Load trusted rankings</button>{error && <p className="mt-2 text-sm text-red-700">{error}</p>}{data && <div className="mt-4 grid gap-4 sm:grid-cols-2"><RankingList title="Students" rows={data.students.map((row) => `#${row.rank} ${row.studentName} — ${row.score} XP`)} /><RankingList title="Schools" rows={data.schools.map((row) => `#${row.rank} ${row.name} — ${row.totalScore} XP`)} /></div>}</div>;
}
function RankingList({ title, rows }: { title: string; rows: string[] }) { return <div><h2 className="font-black">{title}</h2>{rows.length ? <ol className="mt-2 grid gap-1 text-sm">{rows.map((row) => <li key={row}>{row}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">No final results yet.</p>}</div>; }
