import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RoundRow = {
  round_id: string;
  round_sequence: string | number;
  game: string;
  status: string;
  eligible_count: number;
  started_at: string;
  playback_started_at: string | null;
  playback_ends_at: string | null;
  results_hash: string | null;
  randomness_provider: string | null;
  randomness_account: string | null;
  randomness_commit_tx_sig: string | null;
  randomness_reveal_tx_sig: string | null;
  randomness_verified_at: string | null;
  settlement_tx_sig: string | null;
  settled_at: string | null;
};

type ResultRow = {
  wallet: string;
  sequence_index: number;
  game: string;
  score: string | number;
  tie_break: string;
  summary: string;
  outcome: Record<string, string | number | boolean>;
  result_hash: string;
  scheduled_at: string;
};

function config() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

async function query<T>(path: string, extraHeaders?: HeadersInit) {
  const database = config();
  if (!database) throw new Error("Casino database is not configured");
  const response = await fetch(`${database.url}/rest/v1/${path}`, {
    headers: {
      apikey: database.key,
      Authorization: `Bearer ${database.key}`,
      ...extraHeaders
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Casino database request failed (${response.status})`);
  return (await response.json()) as T;
}

async function completedResults(roundId: string, nowIso: string) {
  const rows: ResultRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const page = await query<ResultRow[]>(
      `casino_game_results?select=wallet,sequence_index,game,score,tie_break,summary,outcome,result_hash,scheduled_at&round_id=eq.${encodeURIComponent(
        roundId
      )}&scheduled_at=lte.${encodeURIComponent(nowIso)}&order=sequence_index.asc`,
      { Range: `${offset}-${offset + pageSize - 1}` }
    );
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function compareScore(a: ResultRow, b: ResultRow) {
  const aScore = BigInt(a.score);
  const bScore = BigInt(b.score);
  if (aScore !== bScore) return aScore > bScore ? -1 : 1;
  return a.tie_break.localeCompare(b.tie_break) || a.wallet.localeCompare(b.wallet);
}

function publicResult(result: ResultRow) {
  return {
    wallet: result.wallet,
    playIndex: result.sequence_index,
    score: String(result.score),
    summary: result.summary,
    outcome: result.outcome,
    resultHash: result.result_hash,
    scheduledAt: result.scheduled_at
  };
}

function emptyPayload(status: "offline" | "waiting_for_round" = "waiting_for_round") {
  return {
    status,
    round: null,
    completedCount: 0,
    currentPlay: null,
    latestPlays: [],
    leaderboard: []
  };
}

export async function GET() {
  if (!config()) {
    return NextResponse.json(emptyPayload("offline"), { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const rounds = await query<RoundRow[]>(
      "casino_public_rounds?select=round_id,round_sequence,game,status,eligible_count,started_at,playback_started_at,playback_ends_at,results_hash,randomness_provider,randomness_account,randomness_commit_tx_sig,randomness_reveal_tx_sig,randomness_verified_at,settlement_tx_sig,settled_at&order=started_at.desc&limit=1"
    );
    const round = rounds[0];
    if (!round) return NextResponse.json(emptyPayload(), { headers: { "Cache-Control": "no-store" } });

    const proofVerified = Boolean(
      round.randomness_provider === "switchboard" &&
        round.randomness_account &&
        round.randomness_commit_tx_sig &&
        round.randomness_reveal_tx_sig &&
        round.randomness_verified_at
    );
    let results: ResultRow[] = [];
    let currentRows: ResultRow[] = [];
    if (proofVerified && round.results_hash) {
      [results, currentRows] = await Promise.all([
        completedResults(round.round_id, new Date().toISOString()),
        query<ResultRow[]>(
          `casino_public_current_play?select=wallet,sequence_index,game,score,tie_break,summary,outcome,result_hash,scheduled_at&round_id=eq.${encodeURIComponent(
            round.round_id
          )}&limit=1`
        )
      ]);
    }

    const now = Date.now();
    const completed = results;
    const currentQueue = currentRows[0] ?? null;
    const currentResult = currentRows[0] ?? null;
    const previousCompletion =
      completed.at(-1)?.scheduled_at ?? round.playback_started_at ?? round.randomness_verified_at ?? round.started_at;
    const playbackEnd = Date.parse(round.playback_ends_at ?? "");
    let status = "awaiting_proof";
    if (round.status === "settled") status = "settled";
    else if (round.status === "failed") status = "failed";
    else if (round.status === "skipped") status = "skipped";
    else if (proofVerified && round.results_hash && Number.isFinite(playbackEnd) && now >= playbackEnd) {
      status = "awaiting_settlement";
    } else if (proofVerified && round.results_hash) {
      status = "playing";
    }

    return NextResponse.json(
      {
        status,
        round: {
          roundId: round.round_id,
          roundNumber: Number(round.round_sequence),
          game: round.game,
          eligibleCount: round.eligible_count,
          startedAt: round.started_at,
          playbackStartedAt: round.playback_started_at,
          playbackEndsAt: round.playback_ends_at,
          resultsHash: round.results_hash,
          proofVerified,
          randomnessAccount: proofVerified ? round.randomness_account : null,
          settlementTxSig: round.settlement_tx_sig,
          settledAt: round.settled_at
        },
        completedCount: completed.length,
        currentPlay: currentQueue
          ? {
              wallet: currentQueue.wallet,
              playIndex: currentQueue.sequence_index,
              score: currentResult ? String(currentResult.score) : "",
              summary: currentResult?.summary ?? "SIMULATION IN PROGRESS",
              outcome: currentResult?.outcome ?? {},
              resultHash: currentResult?.result_hash ?? "",
              scheduledAt: currentQueue.scheduled_at,
              startedAt: previousCompletion
            }
          : null,
        latestPlays: completed.slice(-8).reverse().map(publicResult),
        leaderboard: [...completed].sort(compareScore).slice(0, 3).map(publicResult)
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.warn("casino live feed unavailable", error);
    return NextResponse.json(emptyPayload("offline"), { headers: { "Cache-Control": "no-store" } });
  }
}
