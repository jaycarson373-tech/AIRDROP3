import type { ScoutSignal } from "./types";

const LOCAL_TOKEN_IMAGES: Record<string, string> = {
  J33WbCWN2m1EpoNUP9Ch6cWoV5j6BFJervDfgPk3pump: "/tokens/cricket-the-dog.jpg"
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
