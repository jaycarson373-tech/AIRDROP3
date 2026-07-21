export function formatMoney(value: number | null | undefined, compact = true) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Unavailable";
  const amount = Number(value);
  if (amount === 0) return "$0";
  if (amount > 0 && amount < 0.01) {
    return `$${amount.toLocaleString(undefined, { maximumSignificantDigits: 4 })}`;
  }
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 2
  });
}
export function formatToken(value: number | null | undefined, symbol = "") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Unavailable";
  const formatted = Number(value).toLocaleString(undefined, {
    notation: Math.abs(Number(value)) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 2
  });
  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Unavailable";
  const number = Number(value);
  return `${number > 0 ? "+" : ""}${number.toFixed(1)}%`;
}

export function formatTime(value: string | null | undefined) {
  const time = Date.parse(value ?? "");
  if (!Number.isFinite(time)) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(time);
}

export function relativeTime(value: string | null | undefined) {
  const time = Date.parse(value ?? "");
  if (!Number.isFinite(time)) return "Unavailable";
  const seconds = Math.round((time - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function shortWallet(value: string) {
  return value.length > 13 ? `${value.slice(0, 6)}...${value.slice(-5)}` : value;
}

export function eventSignal(
  value:
    | { mint: string; name: string; symbol: string; status: string }
    | Array<{ mint: string; name: string; symbol: string; status: string }>
    | null
) {
  return Array.isArray(value) ? value[0] ?? null : value;
}
