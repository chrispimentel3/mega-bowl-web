"use client";

import { useHeadshot } from "./HeadshotsProvider";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function PlayerAvatar({ player, size = 32 }: { player: string; size?: number }) {
  const url = useHeadshot(player);
  const style = { width: size, height: size };

  if (!url) {
    return (
      <span
        style={style}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink/10 text-[0.6rem] font-bold text-muted"
      >
        {initials(player)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={player}
      style={style}
      className="inline-block shrink-0 rounded-full object-cover"
    />
  );
}
