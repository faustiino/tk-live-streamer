import { useEffect, useState, useRef } from "react";
import { getLiveConnection } from "./LiveConnection";

// esse é o status da LIVE, vindo do gateway/core
export type LiveStatus = "live" | "reconnecting" | "offline";

export interface MetricsState {
  viewerCount: number;
  likesTotal: number;
  diamondsTotal: number;
  sharesTotal: number;
  followersGained: number;

  lastGift?: {
    user: string;
    giftName: string;
    quantity: number;
  };

  status: {
    state: LiveStatus;
    reason?: string;
    ts: number | null;
  };

  chatFeed: Array<{
    user: string;
    message: string;
    ts: number;
  }>;
}

const INITIAL_METRICS: MetricsState = {
  viewerCount: 0,
  likesTotal: 0,
  diamondsTotal: 0,
  sharesTotal: 0,
  followersGained: 0,
  status: {
    state: "offline",
    ts: null,
  },
  chatFeed: [],
};

export function useLiveMetrics() {
  const [data, setData] = useState<MetricsState>(INITIAL_METRICS);

  // manter histórico de chat sem recriar array toda hora
  const chatRef = useRef<MetricsState["chatFeed"]>([]);

  useEffect(() => {
    const conn = getLiveConnection();

    const off = conn.on((msg: any) => {
      if (!msg || !msg.t) return;

      setData((curr) => {
        switch (msg.t) {
          case "metrics": {
            const p = msg.payload || {};
            return {
              ...curr,
              viewerCount: p.viewerCount ?? curr.viewerCount,
              likesTotal: p.likesTotal ?? curr.likesTotal,
              diamondsTotal: p.diamondsTotal ?? curr.diamondsTotal,
              sharesTotal: p.sharesTotal ?? curr.sharesTotal,
              followersGained:
                p.followersGained ?? curr.followersGained,
              lastGift: p.lastGift ?? curr.lastGift,
            };
          }

          case "status": {
            return {
              ...curr,
              status: {
                state: pState(msg.payload?.state) ?? curr.status.state,
                reason: msg.payload?.reason,
                ts: msg.payload?.ts ?? Date.now(),
              },
            };
          }

          case "chat": {
            const nextChat = [
              {
                user: msg.payload?.user ?? "unknown",
                message: msg.payload?.message ?? "",
                ts: msg.payload?.ts ?? Date.now(),
              },
              ...chatRef.current,
            ].slice(0, 50); // últimas 50 msgs

            chatRef.current = nextChat;

            return {
              ...curr,
              chatFeed: nextChat,
            };
          }

          default:
            return curr;
        }
      });
    });

    return () => {
      off();
    };
  }, []);

  return data;
}

// segurança extra pra não quebrar tipagem caso backend envie algo inesperado
function pState(state: any): LiveStatus | undefined {
  if (state === "live" || state === "reconnecting" || state === "offline") {
    return state;
  }
  return undefined;
}
