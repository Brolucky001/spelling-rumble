"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { Difficulty, PortalRole } from "@/types";

interface OfficialCompetitionPanelProps { role: PortalRole; }
type AssignedQuestion = { id: number; sentence: string };

async function api<T>(path: string, body?: unknown): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to continue.");
  let response: Response;
  try {
    response = await fetch(path, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Cannot reach the app server. Restart the app with npm.cmd run dev, or redeploy the Vercel app after adding its server environment variables.");
  }
  const text = await response.text();
  let data: unknown = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: "The server returned an unexpected response." }; }
  if (!response.ok) throw new Error(typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Request failed.");
  return data as T;
}

export function OfficialCompetitionPanel({ role }: OfficialCompetitionPanelProps) {
  const [competitionId, setCompetitionId] = useState("");
  const [questions, setQuestions] = useState<AssignedQuestion[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [proctoringEnabled, setProctoringEnabled] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [notice, setNotice] = useState("");
  const { speak, isPaused, pause, resume } = useSpeechSynthesis();
  const [playingQuestionId, setPlayingQuestionId] = useState<number | null>(null);
  const [replayCounts, setReplayCounts] = useState<Record<number, number>>({});
  const [maxReplays, setMaxReplays] = useState(0);

  async function start() {
    const id = competitionId.trim();
    if (!id) {
      setNotice("Enter the competition ID supplied by your school or administrator before starting.");
      return;
    }
    try {
      setNotice("");
      const data = await api<{ questions: AssignedQuestion[]; expiresAt: string; proctoringEnabled: boolean; maxReplays: number }>("/api/competitions/" + encodeURIComponent(id) + "/start", {});
      setCompetitionId(id); setQuestions(data.questions); setExpiresAt(data.expiresAt); setProctoringEnabled(data.proctoringEnabled); setMaxReplays(data.maxReplays); setReplayCounts({});
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to start."); }
  }
  async function replay(questionId: number, sentence: string) {
    const id = competitionId.trim();
    try {
      const data = await api<{ replayCount: number }>("/api/competitions/" + encodeURIComponent(id) + "/replay", { questionId });
      setReplayCounts((current) => ({ ...current, [questionId]: data.replayCount }));
      setPlayingQuestionId(questionId);
      speak(sentence, () => setPlayingQuestionId(null));
    } catch (error) { setNotice(error instanceof Error ? error.message : "Replay unavailable."); }
  }
  async function submit() {
    const id = competitionId.trim();
    try {
      await api("/api/competitions/" + encodeURIComponent(id) + "/submit", { responses: questions.map((question) => ({ questionId: question.id, response: responses[question.id] ?? "" })) });
      setQuestions([]); setExpiresAt(null); setPlayingQuestionId(null); setNotice("Official result submitted. Rankings update from the trusted server.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Submission failed."); }
  }

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setSecondsRemaining(Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    update(); const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  if (role === "administrator") return <AdminCompetitionForm onCreated={(id) => { setCompetitionId(id); setNotice(`Competition created: ${id}`); }} notice={notice} />;
  return <section className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-primary-100 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-black tracking-widest text-primary-600">OFFICIAL COMPETITION</p><h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Trusted competition arena</h1><label className="mt-6 grid gap-2 font-bold">Competition ID<input value={competitionId} disabled={questions.length > 0} onChange={(event) => setCompetitionId(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-950 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-900 dark:text-white" /></label>{!questions.length && <button type="button" onClick={() => void start()} className="mt-4 rounded-lg bg-primary-600 px-5 py-3 font-black text-white">Start official attempt</button>}{questions.length > 0 && <><p className="mt-4 rounded-lg bg-red-50 p-3 font-black text-red-800">Official timer: {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")} remaining</p>{proctoringEnabled && <IntegrityMonitor competitionId={competitionId} />}</>}{questions.map((question, index) => <OfficialQuestionCard key={question.id} question={question} index={index} response={responses[question.id] ?? ""} playing={playingQuestionId === question.id} replayCount={replayCounts[question.id] ?? 0} maxReplays={maxReplays} onReplay={() => void replay(question.id, question.sentence)} onPauseResume={playingQuestionId === question.id ? () => isPaused ? resume() : pause() : undefined} paused={playingQuestionId === question.id && isPaused} onResponse={(value) => setResponses({ ...responses, [question.id]: value })} />)}{questions.length > 0 && <button type="button" disabled={!secondsRemaining} onClick={() => void submit()} className="mt-5 rounded-lg bg-gold-500 px-5 py-3 font-black text-primary-700 disabled:bg-slate-300">Submit official answers</button>}<Rankings competitionId={competitionId} />{notice && <p role="status" className="mt-4 rounded-lg bg-primary-50 p-3 font-bold text-primary-700 dark:bg-slate-900 dark:text-gold-400">{notice}</p>}</section>;
}

function OfficialQuestionCard({ question, index, response, playing, replayCount, maxReplays, onReplay, onPauseResume, paused, onResponse }: { question: AssignedQuestion; index: number; response: string; playing: boolean; replayCount: number; maxReplays: number; onReplay: () => void; onPauseResume?: () => void; paused: boolean; onResponse: (value: string) => void }) {
  const noReplaysLeft = replayCount >= maxReplays;
  return <div className="mt-5 rounded-xl bg-primary-50 p-4 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">Question {index + 1}</p><p className="text-xs font-bold text-slate-500">Replay {replayCount} of {maxReplays}</p></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={playing || noReplaysLeft} onClick={onReplay} className="rounded-lg border border-primary-200 px-4 py-2 font-black text-primary-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gold-400">{playing ? "Playing..." : noReplaysLeft ? "No replays left" : "Play sentence"}</button>{playing && onPauseResume && <button type="button" onClick={onPauseResume} className="rounded-lg border border-primary-200 bg-white px-4 py-2 font-black text-primary-700 dark:bg-slate-800 dark:text-gold-400">{paused ? "Resume audio" : "Pause audio"}</button>}</div><textarea value={response} onChange={(event) => onResponse(event.target.value)} className="mt-3 min-h-24 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-950 dark:bg-slate-800 dark:text-white" placeholder="Type exactly what you hear" /></div>;
}

function IntegrityMonitor({ competitionId }: { competitionId: string }) {
  const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null); const fullscreenSeen = useRef(false); const [status, setStatus] = useState("Requesting camera accessâ€¦");
  useEffect(() => {
    let active = true;
    const report = (event: string) => { void api(`/api/competitions/${encodeURIComponent(competitionId)}/integrity`, { event }).catch(() => undefined); };
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera unavailable");
        const nextStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!active) { nextStream.getTracks().forEach((track) => track.stop()); return; }
        stream.current = nextStream; if (video.current) video.current.srcObject = nextStream; setStatus("Camera check active. Video stays on this device and is not recorded."); report("camera_started");
      } catch { setStatus("Camera access was not granted or is unavailable. This is recorded as an integrity flag."); report("camera_unavailable"); }
    };
    const onVisibility = () => { if (document.hidden) report("visibility_hidden"); };
    const onBlur = () => report("window_blur");
    const onFullscreen = () => { if (document.fullscreenElement) fullscreenSeen.current = true; else if (fullscreenSeen.current) report("fullscreen_exit"); };
    void startCamera(); document.addEventListener("visibilitychange", onVisibility); window.addEventListener("blur", onBlur); document.addEventListener("fullscreenchange", onFullscreen);
    return () => { active = false; document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("blur", onBlur); document.removeEventListener("fullscreenchange", onFullscreen); stream.current?.getTracks().forEach((track) => track.stop()); };
  }, [competitionId]);
  async function enterFullscreen() { try { await document.documentElement.requestFullscreen(); } catch { setStatus("Fullscreen could not be enabled. Continue only if your competition rules allow it."); } }
  return <section className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><h2 className="font-black">Competition integrity check</h2><p className="mt-1">Camera, focus changes, and fullscreen exits are recorded as review flags. They are not proof of cheating. Video is never uploaded or recorded.</p><div className="mt-3 flex flex-wrap items-start gap-3"><video ref={video} autoPlay muted playsInline className="h-24 w-32 rounded-lg bg-slate-900 object-cover" /><div><p className="font-bold">{status}</p><button type="button" onClick={() => void enterFullscreen()} className="mt-2 rounded border border-amber-600 px-3 py-2 font-black">Enter fullscreen</button></div></div></section>;
}

type CompetitionDirectory = { schools: { id: string; name: string; status: string }[]; students: { id: string; displayName: string; email: string; schoolId: string | null }[]; };
type CompetitionHistory = { id: string; title: string; status: string; startsAt: string; endsAt: string; results: { id: string; studentName?: string; userId?: string; score?: number; accuracy?: number; submittedAt?: string | null; answers?: { questionId: number; response?: string; correct: boolean }[] }[]; integrityAttempts: { userId: string; status: string; integrityEventCount: number; lastIntegrityEvent: string | null; lastIntegrityEventAt: string | null }[]; };

function AdminCompetitionForm({ onCreated, notice }: { onCreated: (id: string) => void; notice: string }) {
  const [title, setTitle] = useState(""); const [customId, setCustomId] = useState(""); const [difficulty, setDifficulty] = useState<Difficulty>("Beginner"); const [questionIds, setQuestionIds] = useState(""); const [registrationFee, setRegistrationFee] = useState("0"); const [startsAt, setStartsAt] = useState(""); const [endsAt, setEndsAt] = useState(""); const [maxReplays, setMaxReplays] = useState("2"); const [timeLimitMinutes, setTimeLimitMinutes] = useState("10"); const [proctoringEnabled, setProctoringEnabled] = useState(false); const [directory, setDirectory] = useState<CompetitionDirectory>({ schools: [], students: [] }); const [history, setHistory] = useState<CompetitionHistory[]>([]); const [selectedSchools, setSelectedSchools] = useState<string[]>([]); const [selectedStudents, setSelectedStudents] = useState<string[]>([]); const [error, setError] = useState("");
  async function load() { try { setHistory(await api<CompetitionHistory[]>("/api/competitions")); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load competition administration data."); } }
  useEffect(() => { void load(); }, []);
  function toggle(id: string, values: string[], setValues: (next: string[]) => void) { setValues(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); try { const data = await api<{ id: string }>("/api/competitions", { competitionId: customId.trim() || undefined, title, difficulty, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), questionIds: questionIds.split(",").map(Number).filter(Number.isInteger), registrationFee: Number(registrationFee), maxReplays: Number(maxReplays), timeLimitSeconds: Math.round(Number(timeLimitMinutes) * 60), proctoringEnabled, eligibleStudentIds: selectedStudents, eligibleSchoolIds: selectedSchools }); onCreated(data.id); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create competition."); } }
  async function publish(id: string) { try { await api(`/api/competitions/${encodeURIComponent(id)}/publish`, {}); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to publish competition."); } }
  return <section className="mx-auto w-full max-w-5xl rounded-[1.75rem] border border-primary-100 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-black tracking-widest text-primary-600">COMPETITION ADMINISTRATION</p><h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Create an official competition</h1><form onSubmit={submit} className="mt-6 grid gap-4"><input value={customId} onChange={(event) => setCustomId(event.target.value)} className="rounded-lg border p-3 text-slate-950" placeholder="Custom competition ID (optional, e.g. 2026-finals)" /><input required value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border p-3 text-slate-950" placeholder="Competition title" /><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="rounded-lg border p-3 text-slate-950">{(["Beginner","Easy","Medium","Hard","Professional","Expert"] as Difficulty[]).map((item) => <option key={item}>{item}</option>)}</select><input required value={questionIds} onChange={(event) => setQuestionIds(event.target.value)} className="rounded-lg border p-3 text-slate-950" placeholder="Question IDs, e.g. 1,2,3,4,5" /><label className="font-bold">Registration fee (NGN)<input min="0" type="number" value={registrationFee} onChange={(event) => setRegistrationFee(event.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-950" /></label><label className="font-bold">Starts at<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-950" /></label><label className="font-bold">Ends at<input required type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-950" /></label><label className="font-bold">Maximum replays per question<input required min="0" step="1" type="number" value={maxReplays} onChange={(event) => setMaxReplays(event.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-950" /></label><label className="font-bold">Official time limit (minutes)<input required min="1" type="number" value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(event.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-950" /></label><label className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><input type="checkbox" checked={proctoringEnabled} onChange={(event) => setProctoringEnabled(event.target.checked)} /><span><strong>Enable competition integrity monitoring</strong><span className="block">Requests camera access, displays a timer, and records focus/fullscreen flags for review. Video is not recorded or uploaded.</span></span></label><PagedAssignmentList title="Eligible schools" description="School IDs are shown below. Selecting a school allows its assigned students to participate." rows={directory.schools.map((school) => ({ id: school.id, label: school.name, detail: `${school.status} Â· ${school.id}` }))} selected={selectedSchools} onToggle={(id) => toggle(id, selectedSchools, setSelectedSchools)} /><PagedAssignmentList title="Eligible students" description="Student user IDs are shown below. Select individual students when needed." rows={directory.students.map((student) => ({ id: student.id, label: student.displayName, detail: `${student.email || "No email"} Â· User ID: ${student.id}${student.schoolId ? ` Â· School ID: ${student.schoolId}` : ""}` }))} selected={selectedStudents} onToggle={(id) => toggle(id, selectedStudents, setSelectedStudents)} /><button className="rounded-lg bg-primary-600 px-5 py-3 font-black text-white">Create competition</button></form>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}{notice && <p role="status" className="mt-3 text-primary-700">{notice}</p>}<section className="mt-8 border-t pt-6"><div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">Past competitions, responses, and integrity flags</h2><button type="button" onClick={() => void load()} className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-black text-primary-700">Refresh</button></div><div className="mt-4 grid gap-4">{history.map((competition) => <article key={competition.id} className="rounded-xl bg-primary-50 p-4 dark:bg-slate-900"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{competition.title}</h3><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-primary-700">{competition.status}</span><code className="text-xs">ID: {competition.id}</code>{competition.status === "scheduled" && <button type="button" onClick={() => void publish(competition.id)} className="rounded border border-primary-300 px-2 py-1 text-xs font-black text-primary-700">Publish</button>}</div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{competition.results.length} final response{competition.results.length === 1 ? "" : "s"}</p><div className="mt-3 grid gap-2">{competition.results.map((result) => <details key={result.id} className="rounded-lg bg-white p-3 dark:bg-slate-800"><summary className="cursor-pointer font-bold">{result.studentName ?? result.userId ?? "Student"} â€” {result.score ?? 0} points, {result.accuracy ?? 0}%</summary>{result.answers ? <ul className="mt-2 grid gap-1 text-sm">{result.answers.map((answer) => <li key={answer.questionId}>Question {answer.questionId}: â€œ{answer.response ?? ""}â€ â€” {answer.correct ? "correct" : "incorrect"}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Response text was not stored for this earlier submission.</p>}</details>)}</div>{competition.integrityAttempts.length > 0 && <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><strong>Integrity flags for review</strong>{competition.integrityAttempts.map((attempt) => <p key={attempt.userId} className="mt-1 break-all">User ID {attempt.userId}: {attempt.integrityEventCount} flag(s), latest: {attempt.lastIntegrityEvent ?? "unknown"}</p>)}</div>}</article>)}{!history.length && <p className="text-sm text-slate-500">No competitions have been created yet.</p>}</div></section></section>;
}

function AssignmentList({ title, description, rows, selected, onToggle }: { title: string; description: string; rows: { id: string; label: string; detail: string }[]; selected: string[]; onToggle: (id: string) => void }) { return <fieldset className="rounded-xl border border-primary-100 p-4"><legend className="px-1 font-black">{title}</legend><p className="text-sm text-slate-500">{description}</p><div className="mt-3 grid max-h-52 gap-2 overflow-y-auto">{rows.map((row) => <label key={row.id} className="flex gap-3 rounded-lg bg-primary-50 p-3 text-sm dark:bg-slate-900"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => onToggle(row.id)} /><span><strong>{row.label}</strong><span className="block break-all text-xs text-slate-500">{row.detail}</span></span></label>)}{!rows.length && <p className="text-sm text-slate-500">None found.</p>}</div></fieldset>; }

function PagedAssignmentList({ title, description, rows: _rows, selected, onToggle }: { title: string; description: string; rows: { id: string; label: string; detail: string }[]; selected: string[]; onToggle: (id: string) => void }) {
  const kind = title.toLowerCase().includes("school") ? "schools" : "students";
  const [search, setSearch] = useState(""); const [items, setItems] = useState<{ id: string; label: string; detail: string }[]>([]); const [cursor, setCursor] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [selectedItems, setSelectedItems] = useState<Record<string, { id: string; label: string; detail: string }>>({});
  const query = search.trim(); const canSearch = query.length >= 3 || /^(STU|SCH|TCH|ADM)-/i.test(query);
  async function loadPage(reset: boolean) {
    if (!canSearch) return;
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ kind, search: query, ...(!reset && cursor ? { cursor } : {}) });
      const data = await api<{ items: { id: string; label: string; detail: string }[]; nextCursor: string | null }>("/api/admin/competition-directory?" + params);
      setItems((current) => reset ? data.items : [...current, ...data.items]); setCursor(data.nextCursor);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to search the directory."); } finally { setLoading(false); }
  }
  useEffect(() => {
    if (!canSearch) { setItems([]); setCursor(null); setError(""); setLoading(false); return; }
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ kind, search: query });
      setLoading(true); setError("");
      void api<{ items: { id: string; label: string; detail: string }[]; nextCursor: string | null }>("/api/admin/competition-directory?" + params).then((data) => { setItems(data.items); setCursor(data.nextCursor); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to search the directory.")).finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [canSearch, kind, query]);
  function add(row: { id: string; label: string; detail: string }) { if (!selected.includes(row.id)) onToggle(row.id); setSelectedItems((current) => ({ ...current, [row.id]: row })); setSearch(""); }
  function remove(id: string) { if (selected.includes(id)) onToggle(id); setSelectedItems((current) => { const next = { ...current }; delete next[id]; return next; }); }
  return <fieldset className="rounded-xl border border-primary-100 p-4"><legend className="px-1 font-black">{title}</legend><p className="text-sm text-slate-500">{description}</p><input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-3 w-full rounded-lg border p-3 text-slate-950" placeholder={kind === "schools" ? "Type the first 3 letters of a school name" : "Type the first 3 letters of a student name or email"} /><p className="mt-2 text-xs text-slate-500">Search begins after 3 letters. You can also enter a public ID.</p>{Object.values(selectedItems).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{Object.values(selectedItems).map((row) => <span key={row.id} className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-800"><span>{row.label}</span><button type="button" onClick={() => remove(row.id)} aria-label={"Remove " + row.label} className="rounded-full px-1 text-primary-800 hover:bg-primary-200">&times;</button></span>)}</div>}<div className="mt-3 grid max-h-64 gap-2 overflow-y-auto">{canSearch && items.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg bg-primary-50 p-3 text-sm dark:bg-slate-900"><span><strong>{row.label}</strong><span className="block break-all text-xs text-slate-500">{row.detail}</span></span><button type="button" disabled={selected.includes(row.id)} onClick={() => add(row)} className="shrink-0 rounded border border-primary-300 px-3 py-1.5 text-xs font-black text-primary-700 disabled:cursor-not-allowed disabled:opacity-60">{selected.includes(row.id) ? "Added" : "Add"}</button></div>)}{!canSearch && <p className="text-sm text-slate-500">Type at least 3 letters to find matching records.</p>}{canSearch && !loading && !items.length && <p className="text-sm text-slate-500">No matching records.</p>}</div>{cursor && <button type="button" disabled={loading} onClick={() => void loadPage(false)} className="mt-3 rounded border border-primary-200 px-3 py-2 text-sm font-black text-primary-700">Load more</button>}{loading && <p className="mt-2 text-sm text-slate-500">Loading...</p>}{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<p className="mt-3 text-xs font-bold text-slate-500">{selected.length} selected</p></fieldset>;
}

function Rankings({ competitionId }: { competitionId: string }) {
  const [data, setData] = useState<{ students: { rank: number; studentName: string; score: number }[]; schools: { rank: number; name: string; totalScore: number }[] } | null>(null); const [error, setError] = useState("");
  async function load() { try { setData(await api(`/api/rankings/${competitionId}`)); setError(""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load rankings."); } }
  return <div className="mt-7 border-t border-primary-100 pt-5"><button type="button" disabled={!competitionId} onClick={() => void load()} className="rounded-lg border border-primary-200 px-4 py-2 font-black text-primary-700 dark:text-gold-400">Load trusted rankings</button>{error && <p className="mt-2 text-sm text-red-700">{error}</p>}{data && <div className="mt-4 grid gap-4 sm:grid-cols-2"><RankingList title="Students" rows={data.students.map((row) => `#${row.rank} ${row.studentName} â€” ${row.score} XP`)} /><RankingList title="Schools" rows={data.schools.map((row) => `#${row.rank} ${row.name} â€” ${row.totalScore} XP`)} /></div>}</div>;
}
function RankingList({ title, rows }: { title: string; rows: string[] }) { return <div><h2 className="font-black">{title}</h2>{rows.length ? <ol className="mt-2 grid gap-1 text-sm">{rows.map((row) => <li key={row}>{row}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">No final results yet.</p>}</div>; }

