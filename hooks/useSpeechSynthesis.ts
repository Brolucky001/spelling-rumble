"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const speak = useCallback(
    (sentence: string, onComplete?: () => void) => {
      if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
        return;
      }

      cancel();
      setIsSpeaking(true);
      timeoutRef.current = window.setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(sentence);
        // Prefer Nigerian English where the device supplies it. Browsers expose
        // different voice lists, so English remains a graceful fallback.
        const voices = window.speechSynthesis.getVoices();
        const isNigerianEnglish = (item: SpeechSynthesisVoice) => item.lang.toLowerCase().startsWith("en-ng");
        const soundsMale = (item: SpeechSynthesisVoice) => /male|man|daniel|david|james|guy|microsoft\s+(david|mark)/i.test(item.name);
        const voice = voices.find((item) => isNigerianEnglish(item) && soundsMale(item))
          ?? voices.find(isNigerianEnglish)
          ?? voices.find((item) => item.lang.toLowerCase().startsWith("en-"));
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? "en-NG";
        utterance.rate = 0.5;
        utterance.pitch = 0.85;
        const complete = () => { setIsSpeaking(false); setIsPaused(false); onComplete?.(); };
        utterance.onend = complete;
        utterance.onerror = complete;
        window.speechSynthesis.speak(utterance);
      }, 500);
    },
    [cancel]
  );

  useEffect(() => cancel, [cancel]);

  return { isSpeaking, isPaused, speak, pause, resume, cancel };
}
