import React from "react";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface ConnectionBarProps {
  status: ConnectionStatus;
  reason?: string; // opcional, tipo "rate limited", "network lost", etc.
  className?: string;
}

function statusToUI(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return {
        label: "Conectado ao gateway",
        bg: "bg-emerald-600/90",
        dot: "bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
      };
    case "reconnecting":
      return {
        label: "Tentando reconectar…",
        bg: "bg-amber-500/90",
        dot: "bg-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
      };
    case "disconnected":
      return {
        label: "Desconectado",
        bg: "bg-rose-600/90",
        dot: "bg-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
      };
    default:
      return {
        label: "Status desconhecido",
        bg: "bg-slate-600/90",
        dot: "bg-slate-200 shadow-[0_0_8px_rgba(226,232,240,0.9)]"
      };
  }
}

/**
 * Barra fixa de status de conexão do WebSocket/gateway.
 * Ideal pra colocar no topo do dashboard.
 */
export const ConnectionBar: React.FC<ConnectionBarProps> = ({
  status,
  reason,
  className = ""
}) => {
  const ui = statusToUI(status);

  return (
    <div
      className={[
        "w-full text-[12px] text-white font-medium tracking-wide flex items-center justify-center gap-2 px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.4)]",
        ui.bg,
        className
      ].join(" ")}
      style={{
        lineHeight: 1.2,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
      }}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={[
            "block h-2 w-2 rounded-full border border-white/40",
            ui.dot
          ].join(" ")}
        />
      </span>

      <span>{ui.label}</span>

      {reason ? (
        <span className="text-white/60 font-normal">
          ({reason})
        </span>
      ) : null}
    </div>
  );
};
