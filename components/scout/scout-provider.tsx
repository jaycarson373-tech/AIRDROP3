"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LoadState, ScoutStats } from "./types";

type ScoutContextValue = {
  launchState: "prelaunch" | "live";
  stats: ScoutStats;
  state: LoadState;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
};

const emptyStats: ScoutStats = {
  currentEpoch: 0,
  totalEpochs: 0,
  lastRewardAirdropped: 0,
  totalRewardAirdropped: 0,
  latestEligibleHolders: 0,
  averageMultiplier: null,
  nextDropTime: null,
  totalSolValueAirdropped: 0,
  roundHistory: [],
  recentRewards: [],
  rewardBreakdown: []
};

const ScoutContext = createContext<ScoutContextValue | null>(null);

async function getStats() {
  const response = await fetch("/api/stats", { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as ScoutStats & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export function ScoutProvider({
  children,
  launchState
}: {
  children: React.ReactNode;
  launchState: "prelaunch" | "live";
}) {
  const [stats, setStats] = useState(emptyStats);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      const nextStats = await getStats();
      setStats(nextStats);
      setState(nextStats.totalEpochs ? "loaded" : "empty");
      setError(null);
      setLastUpdated(new Date());
    } catch (nextError) {
      setState((current) => current === "loaded" || current === "empty" || current === "stale" ? "stale" : "error");
      setError(nextError instanceof Error ? nextError.message : "GOAT data connection failed");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const value = useMemo<ScoutContextValue>(
    () => ({ launchState, stats, state, error, lastUpdated, refresh }),
    [error, launchState, lastUpdated, refresh, state, stats]
  );

  return <ScoutContext.Provider value={value}>{children}</ScoutContext.Provider>;
}

export function useScout() {
  const value = useContext(ScoutContext);
  if (!value) throw new Error("useScout must be used inside ScoutProvider");
  return value;
}
