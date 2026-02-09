// src/live/LiveConnection.ts
type LiveEventHandler = (msg: any) => void;

export class LiveConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<LiveEventHandler> = new Set();
  private reconnectTimer: number | null = null;
  private manuallyClosed = false;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.addEventListener("open", () => {
      // opcional: você pode mandar um hello com o username/roomId
      // this.ws?.send(JSON.stringify({ t: "hello", room: "paulodo.job" }));
    });

    this.ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        this.dispatch(data);
      } catch (err) {
        console.error("WS parse error", err, event.data);
      }
    });

    this.ws.addEventListener("close", () => {
      this.ws = null;
      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    });

    this.ws.addEventListener("error", (err) => {
      console.error("WS error", err);
      // força close pra cair no fluxo de reconnect
      this.ws?.close();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer != null) return;
    // tenta religar em ~2s
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  on(handler: LiveEventHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private dispatch(msg: any) {
    for (const h of this.handlers) {
      h(msg);
    }
  }

  close() {
    this.manuallyClosed = true;
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

// Singleton básico pra app toda
let _conn: LiveConnection | null = null;

export function getLiveConnection() {
  if (!_conn) {
    // ajuste essa URL pro endpoint real do gateway
    _conn = new LiveConnection("ws://localhost:8787"); 
    _conn.connect();
  }
  return _conn;
}
