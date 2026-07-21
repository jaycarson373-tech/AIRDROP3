"use client";

import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

export function StatusBadge({
  label,
  tone = "live"
}: {
  label: string;
  tone?: "live" | "queued" | "muted" | "risk";
}) {
  return (
    <span className={`scout-status scout-status--${tone}`}>
      <span className="scout-status__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
export function Metric({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="scout-metric">
      <span className="scout-label">{label}</span>
      <strong>{value}</strong>
      {detail ? <span className="scout-metric__detail">{detail}</span> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="scout-empty">
      <span className="scout-empty__mark" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="scout-error" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <span>{message}</span>
      {retry ? (
        <button className="scout-icon-button" type="button" onClick={retry} aria-label="Retry">
          <RefreshCw size={16} />
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="scout-skeleton" aria-label="Loading">
      <LoaderCircle className="scout-spin" size={18} />
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} style={{ width: `${92 - index * 9}%` }} />
      ))}
    </div>
  );
}
