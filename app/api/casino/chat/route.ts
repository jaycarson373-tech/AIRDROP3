import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRow = {
  id: string | number;
  author: string;
  body: string;
  created_at: string;
};

function enabled() {
  return ["1", "true", "yes", "on"].includes((process.env.CASINO_CHAT_ENABLED ?? "false").toLowerCase());
}

function config() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const salt = process.env.CASINO_CHAT_RATE_LIMIT_SALT;
  return url && key ? { url: url.replace(/\/$/, ""), key, salt, serviceRole: Boolean(serviceKey) } : null;
}

async function databaseRequest(path: string, init?: RequestInit) {
  const database = config();
  if (!database) throw new Error("Casino chat database is not configured");
  return fetch(`${database.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: database.key,
      Authorization: `Bearer ${database.key}`,
      ...init?.headers
    },
    cache: "no-store"
  });
}

function publicRow(row: ChatRow) {
  return { id: String(row.id), author: row.author, body: row.body, createdAt: row.created_at };
}

export async function GET() {
  if (!enabled()) {
    return NextResponse.json({ enabled: false, canPost: false, messages: [] });
  }
  try {
    const response = await databaseRequest(
      "casino_chat_messages?select=id,author,body,created_at&moderation_status=eq.approved&order=created_at.desc&limit=60"
    );
    if (!response.ok) throw new Error(`Casino chat read failed (${response.status})`);
    const rows = (await response.json()) as ChatRow[];
    return NextResponse.json({
      enabled: true,
      canPost: Boolean(config()?.salt && config()?.serviceRole),
      messages: rows.reverse().map(publicRow)
    });
  } catch (error) {
    console.warn("casino chat unavailable", error);
    return NextResponse.json({ enabled: false, canPost: false, messages: [] });
  }
}

function clientFingerprint(request: NextRequest, salt: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const agent = request.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(salt).update("\0").update(forwarded).update("\0").update(agent).digest("hex");
}

function cleanAuthor(value: unknown) {
  const author = String(value ?? "").trim().slice(0, 24);
  if (!/^[A-Za-z0-9_-]{2,24}$/.test(author)) throw new Error("Use 2–24 letters, numbers, dashes, or underscores");
  return author;
}

function cleanBody(value: unknown) {
  const body = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!body || body.length > 240) throw new Error("Messages must be 1–240 characters");
  if (/(https?:\/\/|www\.|t\.me\/)/i.test(body)) throw new Error("Links are disabled in live chat");
  return body;
}

export async function POST(request: NextRequest) {
  if (!enabled()) return NextResponse.json({ error: "Live chat is not enabled" }, { status: 403 });
  const database = config();
  if (!database?.salt || !database.serviceRole) {
    return NextResponse.json({ error: "Live chat posting is not configured" }, { status: 503 });
  }

  try {
    const input = (await request.json()) as { author?: unknown; body?: unknown };
    const author = cleanAuthor(input.author);
    const body = cleanBody(input.body);
    const authorHash = clientFingerprint(request, database.salt);
    const recentResponse = await databaseRequest(
      `casino_chat_messages?select=created_at&author_hash=eq.${authorHash}&order=created_at.desc&limit=1`
    );
    if (!recentResponse.ok) throw new Error(`Casino chat rate check failed (${recentResponse.status})`);
    const recent = (await recentResponse.json()) as Array<{ created_at: string }>;
    if (recent[0] && Date.now() - Date.parse(recent[0].created_at) < 5_000) {
      return NextResponse.json({ error: "Please wait five seconds before posting again" }, { status: 429 });
    }

    const insertResponse = await databaseRequest("casino_chat_messages?select=id,author,body,created_at", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        author,
        body,
        author_hash: authorHash,
        moderation_status: "approved"
      })
    });
    if (!insertResponse.ok) throw new Error(`Casino chat write failed (${insertResponse.status})`);
    const rows = (await insertResponse.json()) as ChatRow[];
    return NextResponse.json({ message: publicRow(rows[0]) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Message could not be posted";
    const clientError = /Use 2|Messages must|Links are/.test(message);
    return NextResponse.json({ error: message }, { status: clientError ? 400 : 503 });
  }
}
