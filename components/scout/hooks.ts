"use client";

import { useEffect, useMemo, useState } from "react";
import { scoutPublicConfig } from "../../lib/scout-public";

export function useCountdown(target: string | null | undefined) {
  const targetMs = useMemo(() => Date.parse(target ?? ""), [target]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  if (!Number.isFinite(targetMs)) return { label: "SYNCING", seconds: null, progress: 0, processing: false };
  const remainingMs = targetMs - now;
  if (remainingMs <= 0) return { label: "PROCESSING", seconds: 0, progress: 1, processing: true };
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const epochMs = scoutPublicConfig.epochMinutes * 60_000;
  return {
    label: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    seconds: totalSeconds,
    progress: Math.min(1, Math.max(0, 1 - remainingMs / epochMs)),
    processing: false
  };
}
