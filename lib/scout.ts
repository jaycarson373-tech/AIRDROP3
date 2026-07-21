import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export type ScoutSignalStatus = "queued" | "active" | "passed" | "rejected" | "archived";

export type ScoutSignal = {
  id: string;
  chain: string;
  mint: string;
  name: string;
  symbol: string;
  source: string;
  source_url: string | null;
  status: ScoutSignalStatus;
  scout_score: number | null;
  price_usd: number | null;
  market_cap_usd: number | null;
  liquidity_usd: number | null;
  volume_24h_usd: number | null;
  holder_count: number | null;
  token_age_seconds: number | null;
  metrics: Record<string, unknown>;
  reasons: string[];
  risk_flags: string[];
  selection_reason: string | null;
  detected_at: string;
  selected_at: string | null;
  public_at: string;
  retired_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseConfig = { url: string; key: string };

export type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | null;
  txns?: Record<string, { buys?: number; sells?: number }>;
  volume?: Record<string, number>;
  priceChange?: Record<string, number> | null;
  liquidity?: { usd?: number } | null;
  marketCap?: number | null;
  fdv?: number | null;
  pairCreatedAt?: number | null;
};

export type SignalInput = {
  mint: string;
  name?: string;
  symbol?: string;
  source?: string;
  sourceChatId?: string | null;
  sourceMessageId?: string | null;
  sourceUrl?: string | null;
  forceActivate?: boolean;
};

function supabaseConfig(requireServiceRole = false): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey ?? (!requireServiceRole ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { requireServiceRole?: boolean } = {}
): Promise<T> {
  const config = supabaseConfig(options.requireServiceRole);
  if (!config) throw new Error("Runner database is not configured");
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Runner database request failed (${response.status}): ${detail.slice(0, 400)}`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function scoutDbRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { requireServiceRole?: boolean } = {}
) {
  return supabaseRequest<T>(path, init, options);
}

export function validateSolanaMint(value: string) {
  const mint = value.trim();
  try {
    return new PublicKey(mint).toBase58() === mint ? mint : null;
  } catch {
    return null;
  }
}

export function extractSolanaMint(text: string) {
  const candidates = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g) ?? [];
  for (const candidate of candidates) {
    const mint = validateSolanaMint(candidate);
    if (mint) return mint;
  }
  return null;
}

export function parseTelegramSignal(text: string): SignalInput | null {
  const mint = extractSolanaMint(text);
  if (!mint) return null;
  const name = text.match(/(?:name|token)\s*[:\-]\s*([^\n]+)/i)?.[1]?.trim();
  const symbol = text.match(/(?:ticker|symbol)\s*[:\-]\s*\$?([A-Za-z0-9_]{1,20})/i)?.[1]?.trim();
  return { mint, name, symbol };
}

export async function fetchDexPair(mint: string) {
  const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${encodeURIComponent(mint)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) return null;
  const pairs = (await response.json()) as DexPair[];
  if (!Array.isArray(pairs) || !pairs.length) return null;
  return pairs.sort((a, b) => Number(b.liquidity?.usd ?? 0) - Number(a.liquidity?.usd ?? 0))[0] ?? null;
}

function finite(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function numberEnv(names: string[], fallback: number) {
  const value = Number(firstEnv(...names));
  return Number.isFinite(value) ? value : fallback;
}

export function scoreDexPair(pair: DexPair | null) {
  if (!pair) {
    return {
      score: null,
      reasons: ["Market data is still indexing"],
      riskFlags: ["No indexed liquidity data"],
      metrics: {}
    };
  }

  const liquidity = finite(pair.liquidity?.usd);
  const volume = finite(pair.volume?.h24);
  const change = finite(pair.priceChange?.h1);
  const buys = finite(pair.txns?.h1?.buys);
  const sells = finite(pair.txns?.h1?.sells);
  const ageMinutes = pair.pairCreatedAt ? Math.max(0, (Date.now() - pair.pairCreatedAt) / 60_000) : null;
  let score = 0;
  const reasons: string[] = [];
  const riskFlags: string[] = [];

  score += Math.min(25, Math.log10(Math.max(1, liquidity)) * 5);
  if (liquidity >= 25_000) reasons.push("Healthy indexed liquidity");
  if (liquidity > 0 && liquidity < 5_000) riskFlags.push("Thin liquidity");

  const velocity = liquidity > 0 ? volume / liquidity : 0;
  score += Math.min(25, velocity * 12);
  if (velocity >= 1) reasons.push("Volume is accelerating relative to liquidity");

  const buyShare = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  score += Math.max(0, Math.min(20, buyShare * 25));
  if (buyShare >= 0.6) reasons.push("Buy activity leads recent transactions");

  score += Math.max(0, Math.min(20, 10 + change / 5));
  if (change > 10) reasons.push("Positive one-hour price momentum");
  if (change < -20) riskFlags.push("Sharp one-hour drawdown");

  if (ageMinutes !== null && ageMinutes <= 180) {
    score += 10;
    reasons.push("Early market discovery window");
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    reasons: reasons.slice(0, 4),
    riskFlags,
    metrics: { liquidity, volume24h: volume, change1h: change, buys1h: buys, sells1h: sells, ageMinutes }
  };
}

function pairToken(pair: DexPair | null, mint: string) {
  if (!pair) return null;
  if (pair.baseToken?.address === mint) return pair.baseToken;
  if (pair.quoteToken?.address === mint) return pair.quoteToken;
  return pair.baseToken ?? null;
}

export async function listScoutSignals(options: { premium?: boolean; limit?: number } = {}) {
  const limit = Math.min(100, Math.max(1, options.limit ?? 30));
  const columns = "id,chain,mint,name,symbol,source,source_url,status,scout_score,price_usd,market_cap_usd,liquidity_usd,volume_24h_usd,holder_count,token_age_seconds,metrics,reasons,risk_flags,selection_reason,detected_at,selected_at,public_at,retired_at,created_at,updated_at";
  const visibility = options.premium ? "" : "&public_at=lte.now()";
  return supabaseRequest<ScoutSignal[]>(
    `scout_signals?select=${columns}${visibility}&order=detected_at.desc&limit=${limit}`,
    {},
    { requireServiceRole: options.premium }
  );
}

export async function getActiveScoutSignal(options: { premium?: boolean } = {}) {
  const rows = await supabaseRequest<ScoutSignal[]>(
    `scout_signals?select=*&status=eq.active${options.premium ? "" : "&public_at=lte.now()"}&limit=1`,
    {},
    { requireServiceRole: options.premium }
  );
  return rows[0] ?? null;
}

export async function getScoutSettings() {
  const rows = await supabaseRequest<{ key: string; value: unknown }[]>("scout_settings?select=key,value");
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function updateScoutSettings(values: Record<string, unknown>) {
  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString()
  }));
  if (!rows.length) return [];
  return supabaseRequest<{ key: string; value: unknown }[]>(
    "scout_settings?on_conflict=key",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(rows)
    },
    { requireServiceRole: true }
  );
}

export async function listScoutEvents(limit = 40, premium = false) {
  return supabaseRequest<
    Array<{
      id: number;
      signal_id: string | null;
      event_type: string;
      payload: Record<string, unknown>;
      created_at: string;
      signal: Pick<ScoutSignal, "mint" | "name" | "symbol" | "status"> | Pick<ScoutSignal, "mint" | "name" | "symbol" | "status">[] | null;
    }>
  >(
    `scout_signal_events?select=id,signal_id,event_type,payload,created_at,signal:scout_signals(mint,name,symbol,status)&order=created_at.desc&limit=${Math.min(100, Math.max(1, limit))}`,
    {},
    { requireServiceRole: premium }
  );
}

export async function activateScoutSignal(id: string, reason: string) {
  const result = await supabaseRequest<ScoutSignal | ScoutSignal[]>(
    "rpc/scout_activate_signal",
    { method: "POST", body: JSON.stringify({ target_signal_id: id, reason }) },
    { requireServiceRole: true }
  );
  return Array.isArray(result) ? result[0] : result;
}

export async function ingestScoutSignal(input: SignalInput) {
  const mint = validateSolanaMint(input.mint);
  if (!mint) throw new Error("Invalid Solana mint");
  const pair = await fetchDexPair(mint);
  const scoring = scoreDexPair(pair);
  const token = pairToken(pair, mint);
  const publicDelaySeconds = Math.max(
    0,
    numberEnv(["SCOUT_PUBLIC_DELAY_SECONDS", "NEXT_PUBLIC_SCOUT_PUBLIC_DELAY_SECONDS"], 60)
  );
  const existingRows = await supabaseRequest<ScoutSignal[]>(
    `scout_signals?select=*&mint=eq.${encodeURIComponent(mint)}&limit=1`,
    {},
    { requireServiceRole: true }
  );
  const existing = existingRows[0] ?? null;
  const row = {
    mint,
    chain: "solana",
    name: input.name || token?.name || "Unresolved token",
    symbol: (input.symbol || token?.symbol || "TBD").replace(/^\$/, ""),
    source: input.source ?? "admin",
    source_chat_id: input.sourceChatId ?? null,
    source_message_id: input.sourceMessageId ?? null,
    source_url: input.sourceUrl ?? pair?.url ?? null,
    status: existing?.status ?? "queued",
    scout_score: scoring.score,
    price_usd: pair?.priceUsd ? finite(pair.priceUsd) : null,
    market_cap_usd: pair?.marketCap ?? pair?.fdv ?? null,
    liquidity_usd: pair?.liquidity?.usd ?? null,
    volume_24h_usd: pair?.volume?.h24 ?? null,
    token_age_seconds: pair?.pairCreatedAt ? Math.max(0, Math.floor((Date.now() - pair.pairCreatedAt) / 1000)) : null,
    metrics: scoring.metrics,
    reasons: scoring.reasons,
    risk_flags: scoring.riskFlags,
    public_at: existing?.public_at ?? new Date(Date.now() + publicDelaySeconds * 1000).toISOString(),
    updated_at: new Date().toISOString()
  };

  const rows = await supabaseRequest<ScoutSignal[]>(
    "scout_signals?on_conflict=mint",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row)
    },
    { requireServiceRole: true }
  );
  const signal = rows[0];
  if (!signal) throw new Error("Signal was not persisted");

  const current = await getActiveScoutSignal({ premium: true });
  const minimumScore = numberEnv(["SCOUT_MINIMUM_SCORE", "SCOUT_MIN_SCORE"], 60);
  const switchMargin = numberEnv(["SCOUT_SWITCH_SCORE_MARGIN"], 8);
  const minimumActiveSeconds = numberEnv(
    ["SCOUT_MINIMUM_ACTIVE_SECONDS", "SCOUT_MIN_ACTIVE_SECONDS"],
    300
  );
  const activeAgeSeconds = current?.selected_at ? (Date.now() - Date.parse(current.selected_at)) / 1000 : Infinity;
  const scoreAdvantage = finite(signal.scout_score) - finite(current?.scout_score);
  const minimumLiquidityUsd = numberEnv(
    ["SCOUT_MINIMUM_LIQUIDITY_USD", "SCOUT_MIN_LIQUIDITY_USD"],
    5_000
  );
  const meetsAutomaticFloor =
    finite(signal.scout_score) >= minimumScore &&
    finite(signal.liquidity_usd) >= minimumLiquidityUsd;
  const shouldActivate =
    input.forceActivate ||
    (!current && meetsAutomaticFloor) ||
    (finite(signal.scout_score) >= minimumScore && activeAgeSeconds >= minimumActiveSeconds && scoreAdvantage >= switchMargin);

  if (!shouldActivate) return { signal, activated: false, current };
  const activated = await activateScoutSignal(
    signal.id,
    input.forceActivate ? "Administrator override" : current ? `Score advantage ${scoreAdvantage}` : "First active Runner signal"
  );
  return { signal: activated, activated: true, current };
}

export function scoutAdminAuthorized(request: Request) {
  const expected = firstEnv("SCOUT_ADMIN_SECRET", "SCOUT_ADMIN_TOKEN");
  if (!expected) return false;
  const provided = request.headers.get("x-scout-admin-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === expected;
}

export function tokenHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createAccessToken() {
  return randomBytes(32).toString("base64url");
}

export async function createAccessChallenge(wallet: string) {
  const normalized = validateSolanaMint(wallet);
  if (!normalized) throw new Error("Invalid Solana wallet");
  const nonce = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const message = `Runner access\nWallet: ${normalized}\nNonce: ${nonce}\nExpires: ${expiresAt}`;
  const rows = await supabaseRequest<{ id: string; wallet: string; nonce: string; message: string; expires_at: string }[]>(
    "scout_access_challenges",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ wallet: normalized, nonce, message, expires_at: expiresAt })
    },
    { requireServiceRole: true }
  );
  return rows[0];
}

export async function getAccessChallenge(id: string) {
  const rows = await supabaseRequest<{ id: string; wallet: string; nonce: string; message: string; expires_at: string; used_at: string | null }[]>(
    `scout_access_challenges?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    {},
    { requireServiceRole: true }
  );
  return rows[0] ?? null;
}

export async function markChallengeUsed(id: string) {
  await supabaseRequest(
    `scout_access_challenges?id=eq.${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ used_at: new Date().toISOString() }) },
    { requireServiceRole: true }
  );
}

export async function createAccessSession(wallet: string, sourceBalance: number) {
  const token = createAccessToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  await supabaseRequest(
    "scout_access_sessions",
    {
      method: "POST",
      body: JSON.stringify({ wallet, token_hash: tokenHash(token), source_balance: sourceBalance, expires_at: expiresAt })
    },
    { requireServiceRole: true }
  );
  return { token, expiresAt };
}

export async function validateAccessToken(token: string) {
  if (!token) return null;
  const rows = await supabaseRequest<{ wallet: string; source_balance: number; expires_at: string; revoked_at: string | null }[]>(
    `scout_access_sessions?select=wallet,source_balance,expires_at,revoked_at&token_hash=eq.${tokenHash(token)}&expires_at=gt.now()&revoked_at=is.null&limit=1`,
    {},
    { requireServiceRole: true }
  );
  return rows[0] ?? null;
}

export async function insertSignalEvent(signalId: string, eventType: string, payload: Record<string, unknown> = {}) {
  await supabaseRequest(
    "scout_signal_events",
    { method: "POST", body: JSON.stringify({ signal_id: signalId, event_type: eventType, payload }) },
    { requireServiceRole: true }
  );
}

export async function queueTelegramDelivery(signalId: string, destination: "premium" | "public", chatId: string, dueAt: string) {
  await supabaseRequest(
    "scout_delivery_queue?on_conflict=signal_id,destination,chat_id",
    {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify({ signal_id: signalId, destination, chat_id: chatId, due_at: dueAt })
    },
    { requireServiceRole: true }
  );
}

function envList(...names: string[]) {
  return Array.from(
    new Set(
      names.flatMap((name) =>
        (process.env[name] ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
  );
}

export function scoutEnvList(...names: string[]) {
  return envList(...names);
}

export async function queueSignalDeliveries(signal: ScoutSignal) {
  const premiumChats = new Set(
    envList("SCOUT_PREMIUM_CHAT_IDS", "SCOUT_TELEGRAM_PREMIUM_CHAT_IDS")
  );
  const publicChats = new Set(
    envList("SCOUT_PUBLIC_CHAT_IDS", "SCOUT_TELEGRAM_PUBLIC_CHAT_IDS")
  );
  const groups = await supabaseRequest<
    Array<{
      chat_id: string;
      plan: "starter" | "pro" | "enterprise";
      minimum_score: number;
      maximum_market_cap_usd: number | null;
      alert_types: string[];
      is_active: boolean;
    }>
  >(
    "scout_group_configs?select=chat_id,plan,minimum_score,maximum_market_cap_usd,alert_types,is_active&is_active=eq.true",
    {},
    { requireServiceRole: true }
  ).catch(() => []);

  for (const group of groups) {
    const score = Number(signal.scout_score ?? 0);
    const marketCap = Number(signal.market_cap_usd ?? 0);
    if (!group.alert_types.includes("selected") || score < Number(group.minimum_score ?? 0)) continue;
    if (group.maximum_market_cap_usd && marketCap > group.maximum_market_cap_usd) continue;
    if (group.plan === "starter") publicChats.add(group.chat_id);
    else premiumChats.add(group.chat_id);
  }

  await Promise.all([
    ...Array.from(premiumChats).map((chatId) =>
      queueTelegramDelivery(signal.id, "premium", chatId, new Date().toISOString())
    ),
    ...Array.from(publicChats).map((chatId) =>
      queueTelegramDelivery(signal.id, "public", chatId, signal.public_at)
    )
  ]);
}

export async function listWatchlist(owner: string) {
  return supabaseRequest<Array<{ wallet: string; mint: string; created_at: string }>>(
    `scout_watchlists?select=wallet,mint,created_at&wallet=eq.${encodeURIComponent(owner)}&order=created_at.desc`,
    {},
    { requireServiceRole: true }
  );
}

export async function addWatchlistItem(owner: string, mint: string) {
  const normalized = validateSolanaMint(mint);
  if (!normalized) throw new Error("Invalid Solana mint");
  await supabaseRequest(
    "scout_watchlists?on_conflict=wallet,mint",
    {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify({ wallet: owner, mint: normalized })
    },
    { requireServiceRole: true }
  );
  return normalized;
}

export async function removeWatchlistItem(owner: string, mint: string) {
  await supabaseRequest(
    `scout_watchlists?wallet=eq.${encodeURIComponent(owner)}&mint=eq.${encodeURIComponent(mint)}`,
    { method: "DELETE" },
    { requireServiceRole: true }
  );
}

export async function validateScoutApiKey(key: string) {
  if (!key) return null;
  const rows = await supabaseRequest<
    Array<{ id: string; owner_label: string; tier: string; rate_limit_per_minute: number }>
  >(
    `scout_api_keys?select=id,owner_label,tier,rate_limit_per_minute&key_hash=eq.${tokenHash(key)}&is_active=eq.true&limit=1`,
    {},
    { requireServiceRole: true }
  );
  const apiKey = rows[0] ?? null;
  if (apiKey) {
    await supabaseRequest(
      `scout_api_keys?id=eq.${apiKey.id}`,
      { method: "PATCH", body: JSON.stringify({ last_used_at: new Date().toISOString() }) },
      { requireServiceRole: true }
    );
  }
  return apiKey;
}

type DeliveryRow = {
  id: number;
  destination: "premium" | "public";
  chat_id: string;
  attempts: number;
  signal: ScoutSignal | ScoutSignal[] | null;
};

export async function processTelegramQueue(limit = 20) {
  const rows = await supabaseRequest<DeliveryRow[]>(
    `scout_delivery_queue?select=id,destination,chat_id,attempts,signal:scout_signals(*)&status=eq.queued&due_at=lte.now()&order=due_at.asc&limit=${Math.min(50, Math.max(1, limit))}`,
    {},
    { requireServiceRole: true }
  );
  let sent = 0;
  const failures: { id: number; error: string }[] = [];

  for (const row of rows) {
    const signal = Array.isArray(row.signal) ? row.signal[0] : row.signal;
    if (!signal) continue;
    await supabaseRequest(
      `scout_delivery_queue?id=eq.${row.id}`,
      { method: "PATCH", body: JSON.stringify({ status: "sending", attempts: row.attempts + 1 }) },
      { requireServiceRole: true }
    );
    try {
      await sendTelegramMessage(row.chat_id, formatSignalTelegram(signal, row.destination === "premium"));
      await supabaseRequest(
        `scout_delivery_queue?id=eq.${row.id}`,
        { method: "PATCH", body: JSON.stringify({ status: "sent", sent_at: new Date().toISOString(), last_error: null }) },
        { requireServiceRole: true }
      );
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = row.attempts + 1 >= 5 ? "failed" : "queued";
      await supabaseRequest(
        `scout_delivery_queue?id=eq.${row.id}`,
        { method: "PATCH", body: JSON.stringify({ status, last_error: message }) },
        { requireServiceRole: true }
      );
      failures.push({ id: row.id, error: message });
    }
  }

  return { processed: rows.length, sent, failures };
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true })
  });
  if (!response.ok) throw new Error(`Telegram send failed (${response.status})`);
  return response.json();
}

export function formatSignalTelegram(signal: ScoutSignal, premium: boolean) {
  const score = signal.scout_score === null ? "Indexing" : `${signal.scout_score}/100`;
  const marketCap = signal.market_cap_usd ? `$${Math.round(signal.market_cap_usd).toLocaleString()}` : "Indexing";
  const liquidity = signal.liquidity_usd ? `$${Math.round(signal.liquidity_usd).toLocaleString()}` : "Indexing";
  const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const reasons = signal.reasons.length ? signal.reasons.map((reason) => `• ${escape(reason)}`).join("\n") : "• Market data is still indexing";
  return [
    `<b>${premium ? "RUNNER EARLY SIGNAL" : "RUNNER PUBLIC SIGNAL"}</b>`,
    `<b>$${escape(signal.symbol)}</b> · ${escape(signal.name)}`,
    `Momentum Score: <b>${score}</b>`,
    `Market cap: ${marketCap}`,
    `Liquidity: ${liquidity}`,
    "",
    reasons,
    "",
    `<code>${signal.mint}</code>`,
    signal.source_url ? `<a href="${escape(signal.source_url)}">Open market</a>` : ""
  ].filter(Boolean).join("\n");
}
