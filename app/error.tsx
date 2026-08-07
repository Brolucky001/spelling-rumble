"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application error", error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-primary-50 p-6 text-center"><section className="max-w-md rounded-3xl bg-white p-8 shadow-soft"><p className="text-sm font-black tracking-widest text-primary-600">SOMETHING WENT WRONG</p><h1 className="mt-2 text-3xl font-black text-slate-950">Let’s get you back to learning.</h1><p className="mt-3 text-slate-600">Your data has not been intentionally removed. Please try again.</p><button type="button" onClick={reset} className="mt-6 rounded-lg bg-primary-600 px-5 py-3 font-black text-white">Try again</button></section></main>;
}
