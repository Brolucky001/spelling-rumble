"use client";

import { FormEvent, useState } from "react";
import { requestPasswordReset, resendEmailConfirmation } from "@/lib/auth";
import type { PortalRole } from "@/types";

interface AuthPanelProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (name: string, email: string, password: string, role: Extract<PortalRole, "student" | "teacher" | "school">) => Promise<void>;
}

export function AuthPanel({ onSignIn, onSignUp }: AuthPanelProps) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [role, setRole] = useState<Extract<PortalRole, "student" | "teacher" | "school">>("student");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "signIn") await onSignIn(email, password);
      else {
        await onSignUp(name, email, password, role);
        setNotice("Your account is ready. We sent a confirmation link to your email—open it before using official competition features.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not complete that request.");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email address first, then select Forgot password.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setNotice("If an account exists for that address, a password-reset link has been sent.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not send the password-reset email.");
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    setError("");
    setBusy(true);
    try {
      await resendEmailConfirmation();
      setNotice("A new confirmation link has been sent to your email address.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not resend the confirmation email.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mx-auto w-full max-w-md rounded-[1.75rem] border border-primary-100 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-black tracking-widest text-primary-600">YOUR ACCOUNT</p><h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{mode === "signIn" ? "Welcome back" : "Start your journey"}</h1><form onSubmit={submit} className="mt-6 grid gap-4">{mode === "signUp" && <><label className="grid gap-1 text-sm font-bold">Name or school name<input required value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-950 dark:bg-slate-900 dark:text-white" /></label><label className="grid gap-1 text-sm font-bold">Account type<select value={role} onChange={(event) => setRole(event.target.value as Extract<PortalRole, "student" | "teacher" | "school">)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-950 dark:bg-slate-900 dark:text-white"><option value="student">Student</option><option value="teacher">Teacher</option><option value="school">School</option></select></label></>}<label className="grid gap-1 text-sm font-bold">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-950 dark:bg-slate-900 dark:text-white" /></label><label className="grid gap-1 text-sm font-bold">Password<span className="relative"><input required minLength={6} type={passwordVisible ? "text" : "password"} autoComplete={mode === "signIn" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 pr-16 text-slate-950 dark:bg-slate-900 dark:text-white" /><button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} className="absolute inset-y-0 right-0 px-3 text-xs font-black text-primary-700 dark:text-gold-400">{passwordVisible ? "Hide" : "Show"}</button></span></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}{notice && <p role="status" className="rounded-lg bg-primary-50 p-3 text-sm font-bold text-primary-800 dark:bg-slate-900 dark:text-gold-300">{notice}</p>}<button disabled={busy} className="min-h-12 rounded-lg bg-primary-600 px-4 py-3 font-black text-white disabled:bg-slate-400">{busy ? "Please wait..." : mode === "signIn" ? "Sign in" : `Create ${role} account`}</button></form>{mode === "signIn" && <button type="button" disabled={busy} onClick={() => void forgotPassword()} className="mt-4 text-sm font-black text-primary-700 dark:text-gold-400">Forgot password?</button>}{mode === "signUp" && <button type="button" disabled={busy} onClick={() => void resendConfirmation()} className="mt-4 text-sm font-black text-primary-700 dark:text-gold-400">Resend confirmation email</button>}<button type="button" onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setError(""); setNotice(""); setPasswordVisible(false); }} className="mt-4 block text-sm font-black text-primary-700 dark:text-gold-400">{mode === "signIn" ? "Need an account? Sign up" : "Already registered? Sign in"}</button></section>;
}
