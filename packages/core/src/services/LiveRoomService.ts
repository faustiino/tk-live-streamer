export type UnixMs = number;
export type RoomId = string;
export type LiveEventType =
  | "connected"
  | "connecting"
  | "disconnected"
  | "reconnecting"
  | "streamEnd"
  | "message"
  | "like"
  | "gift"
  | "roomUser"
  | "raw"
  | "subscribe"
  | "follow"
  | "member"
  | "share"
  | "superFan"
  | "error";

export interface LiveEvent<T = unknown> {
  t: LiveEventType;   // tipo do evento
  ts: UnixMs;         // timestamp epoch em ms
  payload: T;         // payload normalizado (ou bruto para 'raw')
}

export interface ConnectionOptions {
  /** Identificador único do criador no TikTok (ex.: "marcellomartinsb") */
  uniqueId: string;
  /** Futuras opções (proxy, token, etc.) */
  wsUrl?: string;       // inerte por ora (mantido p/ compat do core)
  token?: string;       // reservado
}

export interface LiveRoomService {
  connect(opts: ConnectionOptions): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onEvent(handler: (evt: LiveEvent) => void): void;
}

/** Implementação fake p/ testes offline/CI e para desenvolver UI sem live */
export class NoopLiveRoomService implements LiveRoomService {
  private connected = false;
  private handler: ((evt: LiveEvent) => void) | null = null;

  onEvent(handler: (evt: LiveEvent) => void): void {
    this.handler = handler;
  }

  private emit(evt: LiveEvent) {
    this.handler?.(evt);
  }

  async connect(opts: ConnectionOptions): Promise<void> {
    this.connected = true;
    // dispara um hello
    this.emit({
      t: "connected",
      ts: Date.now(),
      payload: { uniqueId: opts.uniqueId }
    });
    // exemplo de mensagens geradas
    setTimeout(() => this.emit({
      t: "message",
      ts: Date.now(),
      payload: { user: "demo", text: "Olá do Noop!" }
    }), 25);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.connected = false;
    this.emit({ t: "disconnected", ts: Date.now(), payload: {} });
  }

  isConnected(): boolean {
    return this.connected;
  }
}
