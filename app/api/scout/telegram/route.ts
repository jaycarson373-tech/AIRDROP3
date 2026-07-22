import { NextRequest, NextResponse } from "next/server";
import {
  addWatchlistItem,
  formatSignalTelegram,
  getActiveScoutSignal,
  ingestScoutSignal,
  listScoutSignals,
  listWatchlist,
  parseTelegramSignal,
  processTelegramQueue,
  queueSignalDeliveries,
  removeWatchlistItem,
  scoutEnvList,
  sendTelegramMessage
} from "../../../../lib/scout";

export const runtime = "nodejs";

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number; title?: string; type: string };
  from?: { id: number; username?: string };
};

type TelegramUpdate = {
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
};

function telegramAuthorized(request: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  return Boolean(expected && request.headers.get("x-telegram-bot-api-secret-token") === expected);
}

function command(text: string) {
  const match = text.trim().match(/^\/(\w+)(?:@\w+)?(?:\s+([\s\S]+))?$/);
  return match ? { name: match[1].toLowerCase(), args: match[2]?.trim() ?? "" } : null;
}

function watchOwner(message: TelegramMessage) {
  return `telegram:${message.chat.id}:${message.from?.id ?? "channel"}`;
}

function shortSignalList(signals: Awaited<ReturnType<typeof listScoutSignals>>, heading: string) {
  if (!signals.length) return `<b>${heading}</b>\nNo released RI6900 components yet.`;
  return [
    `<b>${heading}</b>`,
    ...signals.slice(0, 8).map((signal, index) => {
      const score = signal.scout_score === null ? "indexing" : `${signal.scout_score}/100`;
      return `${index + 1}. <b>$${signal.symbol}</b> · ${score} · ${signal.status}`;
    })
  ].join("\n");
}

async function runCommand(message: TelegramMessage, name: string, args: string, premium: boolean) {
  const chatId = String(message.chat.id);
  if (name === "runner") {
    const active = await getActiveScoutSignal({ premium });
    return active ? formatSignalTelegram(active, premium) : "<b>RUNNER INDEX 6900</b>\nCalculating the first verified component.";
  }
  if (name === "top") {
    const signals = (await listScoutSignals({ premium, limit: 30 }))
      .sort((a, b) => Number(b.scout_score ?? -1) - Number(a.scout_score ?? -1));
    return shortSignalList(signals, "TOP RI6900 POOLS");
  }
  if (name === "new") {
    return shortSignalList(await listScoutSignals({ premium, limit: 8 }), "NEW RI6900 POOLS");
  }
  if (name === "search") {
    const signals = await listScoutSignals({ premium, limit: 60 });
    const query = args.toLowerCase();
    const matches = signals.filter((signal) => `${signal.name} ${signal.symbol} ${signal.mint}`.toLowerCase().includes(query));
    return shortSignalList(matches, args ? `SEARCH: ${args}` : "SEARCH");
  }
  if (name === "watch") {
    const parsed = parseTelegramSignal(args);
    if (!parsed) return "Usage: <code>/watch MINT</code>";
    await addWatchlistItem(watchOwner(message), parsed.mint);
    return `Watching <code>${parsed.mint}</code>.`;
  }
  if (name === "unwatch") {
    const parsed = parseTelegramSignal(args);
    if (!parsed) return "Usage: <code>/unwatch MINT</code>";
    await removeWatchlistItem(watchOwner(message), parsed.mint);
    return `Removed <code>${parsed.mint}</code> from this watchlist.`;
  }
  if (name === "performance") {
    const signals = (await listScoutSignals({ premium, limit: 20 })).filter((signal) => signal.selected_at);
    return shortSignalList(signals, "RI6900 COMPONENT HISTORY");
  }
  if (name === "help") {
    return [
      "<b>RI6900 COMMANDS</b>",
      "/runner · active signal",
      "/top · highest scores",
      "/new · latest signals",
      "/search QUERY · search signals",
      "/watch MINT · add a watch",
      "/unwatch MINT · remove a watch",
      "/performance · selection history",
      "/scan MINT · authorized signal ingestion"
    ].join("\n");
  }
  if (name === "watchlist") {
    const items = await listWatchlist(watchOwner(message));
    return items.length
      ? `<b>WATCHLIST</b>\n${items.map((item) => `<code>${item.mint}</code>`).join("\n")}`
      : "This watchlist is empty.";
  }
  if (name === "scan") {
    const sourceChats = new Set(
      scoutEnvList("SCOUT_SIGNAL_CHAT_IDS", "SCOUT_TELEGRAM_SOURCE_CHAT_IDS")
    );
    const admins = new Set(scoutEnvList("SCOUT_TELEGRAM_ADMIN_USER_IDS"));
    if (!sourceChats.has(chatId) && !admins.has(String(message.from?.id ?? ""))) return "This command is restricted.";
    const parsed = parseTelegramSignal(args);
    if (!parsed) return "Usage: <code>/scan MINT</code> with optional Name and Ticker lines.";
    const result = await ingestScoutSignal({
      ...parsed,
      source: "telegram",
      sourceChatId: chatId,
      sourceMessageId: String(message.message_id),
      forceActivate: process.env.SCOUT_TELEGRAM_AUTO_ACTIVATE === "true"
    });
    if (result.activated) {
      await queueSignalDeliveries(result.signal);
      await processTelegramQueue(20).catch(() => undefined);
    }
    return `${result.activated ? "Activated" : "Queued"} <b>$${result.signal.symbol}</b> at Momentum Score ${result.signal.scout_score ?? "indexing"}.`;
  }
  return "Unknown command. Use /help.";
}

export async function POST(request: NextRequest) {
  if (!telegramAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const update = (await request.json()) as TelegramUpdate;
    const message = update.channel_post ?? update.message;
    if (!message?.text) return NextResponse.json({ ok: true });
    const chatId = String(message.chat.id);
    const premium = new Set(
      scoutEnvList("SCOUT_PREMIUM_CHAT_IDS", "SCOUT_TELEGRAM_PREMIUM_CHAT_IDS")
    ).has(chatId);
    const parsedCommand = command(message.text);

    if (parsedCommand) {
      const reply = await runCommand(message, parsedCommand.name, parsedCommand.args, premium);
      await sendTelegramMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    const allowedSource = new Set(
      scoutEnvList("SCOUT_SIGNAL_CHAT_IDS", "SCOUT_TELEGRAM_SOURCE_CHAT_IDS")
    ).has(chatId);
    const signal = allowedSource ? parseTelegramSignal(message.text) : null;
    if (signal) {
      const result = await ingestScoutSignal({
        ...signal,
        source: "telegram",
        sourceChatId: chatId,
        sourceMessageId: String(message.message_id),
        forceActivate: process.env.SCOUT_TELEGRAM_AUTO_ACTIVATE === "true"
      });
      if (result.activated) {
        await queueSignalDeliveries(result.signal);
        await processTelegramQueue(20).catch(() => undefined);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Index Telegram webhook failed", error);
    return NextResponse.json({ ok: true });
  }
}
