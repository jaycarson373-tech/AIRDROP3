"use client";

import { useEffect, useMemo, useState } from "react";

const EPOCH_MS = 5 * 60 * 1000;

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RewardRoundPanel() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const state = useMemo(() => {
    const currentEpochStart = Math.floor(now / EPOCH_MS) * EPOCH_MS;
    const nextEpochStart = currentEpochStart + EPOCH_MS;
    const elapsed = now - currentEpochStart;

    return {
      countdown: formatCountdown(nextEpochStart - now),
      progress: (elapsed / EPOCH_MS) * 100
    };
  }, [now]);

  return (
    <div className="round-panel" aria-live="polite">
      <div className="round-label">Epoch 1</div>
      <div className="round-ring" aria-hidden="true">
        <span />
      </div>
      <strong>{state.countdown}</strong>
      <p>Countdown resets every 5 minutes until launch.</p>
      <div className="round-progress" aria-hidden="true">
        <span style={{ width: `${Math.min(100, Math.max(0, state.progress))}%` }} />
      </div>
    </div>
  );
}
