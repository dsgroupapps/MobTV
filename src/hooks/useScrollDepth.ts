import { useEffect, useRef } from "react";

const THRESHOLDS = [25, 50, 75, 100] as const;

/** Chama `onThreshold` uma única vez por marco de profundidade de scroll (25/50/75/100%) atingido na página. */
export function useScrollDepth(onThreshold: (percent: number) => void) {
  const reached = useRef<Set<number>>(new Set());
  const callbackRef = useRef(onThreshold);
  callbackRef.current = onThreshold;

  useEffect(() => {
    function handleScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
      for (const threshold of THRESHOLDS) {
        if (percent >= threshold && !reached.current.has(threshold)) {
          reached.current.add(threshold);
          callbackRef.current(threshold);
        }
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}
