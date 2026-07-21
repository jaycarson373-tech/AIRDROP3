"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  LoadState,
  ScoutHoldersPayload,
  ScoutSignalsPayload,
  ScoutStats,
  ScoutWalletPayload
} from "./types";

type SolanaProvider = {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }>;
};

declare global {
  interface Window {
    solana?: SolanaProvider;
  }
}

type ScoutContextValue = {
  signals: ScoutSignalsPayload;
  stats: ScoutStats;
  holders: ScoutHoldersPayload;
  wallet: ScoutWalletPayload | null;
  state: LoadState;
  error: string | null;
  lastUpdated: Date | null;
  accessToken: string;
  accessBusy: boolean;
  accessError: string | null;
  refresh: () => Promise<void>;
  unlockScout: () => Promise<void>;
  clearAccess: () => void;
  lookupWallet: (address: string) => Promise<ScoutWalletPayload | null>;
};

const emptySignals: ScoutSignalsPayload = {
  access: "public",
  publicDelaySeconds: 60,
  active: null,
  signals: [],
  events: []
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
  recentRewards: []
};

const emptyHolders: ScoutHoldersPayload = {
  topHolders: [],
  totalSupply: 0,
  uniqueHolders: 0
};

const ScoutContext = createContext<ScoutContextValue | null>(null);

async function json<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function base64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

export function ScoutProvider({ children }: { children: React.ReactNode }) {
  const [signals, setSignals] = useState(emptySignals);
  const [stats, setStats] = useState(emptyStats);
  const [holders, setHolders] = useState(emptyHolders);
  const [wallet, setWallet] = useState<ScoutWalletPayload | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    setAccessToken(window.localStorage.getItem("scout_access_token") ?? "");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      const [nextSignals, nextStats, nextHolders] = await Promise.all([
        json<ScoutSignalsPayload>("/api/scout/signals?limit=60", { headers }),
        json<ScoutStats>("/api/stats"),
        json<ScoutHoldersPayload>("/api/holders")
      ]);
      setSignals(nextSignals);
      setStats(nextStats);
      setHolders(nextHolders);
      setState(nextSignals.active || nextSignals.signals.length || nextStats.totalEpochs ? "loaded" : "empty");
      setError(null);
      setLastUpdated(new Date());
    } catch (nextError) {
      setState((current) =>
        current === "loaded" || current === "empty" || current === "stale" ? "stale" : "error"
      );
      setError(nextError instanceof Error ? nextError.message : "Runner data is unavailable");
    }
  }, [accessToken]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const lookupWallet = useCallback(async (address: string) => {
    try {
      const result = await json<ScoutWalletPayload>(`/api/wallet?address=${encodeURIComponent(address)}`);
      setWallet(result);
      return result;
    } catch (nextError) {
      setAccessError(nextError instanceof Error ? nextError.message : "Wallet lookup failed");
      return null;
    }
  }, []);

  const unlockScout = useCallback(async () => {
    setAccessBusy(true);
    setAccessError(null);
    try {
      if (!window.solana) throw new Error("A Solana wallet extension is required");
      const connection = await window.solana.connect();
      const address = connection.publicKey.toString();
      await lookupWallet(address);
      const challenge = await json<{ id: string; message: string }>("/api/scout/access/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address })
      });
      const signed = await window.solana.signMessage(new TextEncoder().encode(challenge.message), "utf8");
      const session = await json<{ token: string }>("/api/scout/access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          wallet: address,
          signature: base64(signed.signature)
        })
      });
      window.localStorage.setItem("scout_access_token", session.token);
      setAccessToken(session.token);
    } catch (nextError) {
      setAccessError(nextError instanceof Error ? nextError.message : "Runner access could not be verified");
    } finally {
      setAccessBusy(false);
    }
  }, [lookupWallet]);

  const clearAccess = useCallback(() => {
    window.localStorage.removeItem("scout_access_token");
    setAccessToken("");
    setWallet(null);
  }, []);

  const value = useMemo<ScoutContextValue>(
    () => ({
      signals,
      stats,
      holders,
      wallet,
      state,
      error,
      lastUpdated,
      accessToken,
      accessBusy,
      accessError,
      refresh,
      unlockScout,
      clearAccess,
      lookupWallet
    }),
    [
      accessBusy,
      accessError,
      accessToken,
      clearAccess,
      error,
      holders,
      lastUpdated,
      lookupWallet,
      refresh,
      signals,
      state,
      stats,
      unlockScout,
      wallet
    ]
  );

  return <ScoutContext.Provider value={value}>{children}</ScoutContext.Provider>;
}

export function useScout() {
  const value = useContext(ScoutContext);
  if (!value) throw new Error("useScout must be used inside ScoutProvider");
  return value;
}
