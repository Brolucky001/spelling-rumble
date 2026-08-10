"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
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
        utterance.rate = 0.9;
        utterance.pitch = 1;
        const complete = () => { setIsSpeaking(false); onComplete?.(); };
        utterance.onend = complete;
        utterance.onerror = complete;
        window.speechSynthesis.speak(utterance);
      }, 500);
    },
    [cancel]
  );

  useEffect(() => cancel, [cancel]);

  return { isSpeaking, speak, cancel };
}
