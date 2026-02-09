import React from "react";

export type LiveStatus = "live" | "reconnecting" | "offline";

export interface LiveBadgeProps {
  status: LiveStatus;
  viewerCount?: number; // ex: 1280
  className?: string;
}

function statusToUI(status: LiveStatus) {
  switch (status) {
    case "live":
      return {
        label: "AO VIVO",
        bg: "bg-red-600",
        pulse: true
      };
    case "reconnecting":
      return {
        label: "RECONEXÃO…",
        bg: "bg-yellow-500",
        pulse: true
      };
    case "offline":
      return {
        label: "OFFLINE",
        bg: "bg-zinc-500",
        pulse: false
      };
    default:
      return {
        label: "DESCONHECIDO",
        bg: "bg-zinc-700",
        pulse: false
      };
  }
}

// formata 1200 -> "1.2k"
function formatViewers(count: number | undefined): string | null {
  if (typeof count !== "number") return null;
  if (count >= 1000) {
    const k = (count / 1000).toFixed(1);
    return k.endsWith(".0") ? k.slice(0, -2) + "k" : k + "k";
  }
  return String(count);
}

/**
 * Badge de status da live do streamer.
 *
 * Exemplo visual:
 *  ● AO VIVO • 1.2k
 */
export const LiveBadge: React.FC<LiveBadgeProps> = ({
  status,
  viewerCount,
  className = ""
}) => {
  const { label, bg, pulse } = statusToUI(status);
  const formattedViewers = formatViewers(viewerCount);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white select-none",
        bg,
        className
      ].join(" ")}
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
      }}
    >
      {/* bolinha de status */}
      <span
        className={[
          // 👇 relative aqui garante que o brilho fique preso dentro da bolinha,
          // e não vaze pro topo da tela
          "relative flex h-2 w-2 items-center justify-center",
          pulse ? "animate-ping-once-and-loop" : ""
        ].join(" ")}
      >
        <span
          className={[
            "block h-2 w-2 rounded-full border border-white/70 bg-white/90",
            "shadow-[0_0_4px_rgba(255,255,255,0.8)]"
          ].join(" ")}
        />
      </span>

      {/* texto principal: AO VIVO / RECONEXÃO / OFFLINE */}
      <span className="uppercase tracking-wide">{label}</span>

      {/* • 1.2k */}
      {formattedViewers && (
        <>
          <span className="opacity-60">•</span>
          <span>{formattedViewers}</span>
        </>
      )}
    </span>
  );
};
