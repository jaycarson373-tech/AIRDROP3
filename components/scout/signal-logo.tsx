import type { ScoutSignal } from "./types";

const LOCAL_TOKEN_IMAGES: Record<string, string> = {
  XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp: "/brand/apple-logo.svg",
  Xs6B6zawENwAbWVi7w92rjazLuAr5Az59qgWKcNb45x: "/brand/berkshire-logo.svg"
};

function signalImage(signal: ScoutSignal) {
  const localImage = LOCAL_TOKEN_IMAGES[signal.mint];
  if (localImage) return localImage;

  for (const key of ["imageUrl", "image_url", "currentImageUrl"]) {
    const value = signal.metrics?.[key];
    if (typeof value === "string" && (value.startsWith("/") || value.startsWith("https://"))) return value;
  }

  return null;
}

export function SignalLogo({ signal, small = false }: { signal: ScoutSignal; small?: boolean }) {
  const image = signalImage(signal);
  const classes = `scout-token-mark${small ? " scout-token-mark--small" : ""}`;

  return (
    <span className={classes} aria-hidden="true">
      {image ? <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : signal.symbol.slice(0, 2).toUpperCase()}
    </span>
  );
}
