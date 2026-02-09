import { TikTokLiveConnection } from "tiktok-live-connector";
import { ControlEvent, WebcastEvent } from "tiktok-live-connector/dist/types/events.js";
import type { LiveEvent, LiveRoomService, ConnectionOptions } from "./LiveRoomService.js";

type ReconnectOptions = {
  enable?: boolean;
  maxRetries?: number;         // -1 = infinito
  initialDelayMs?: number;     // backoff base
  maxDelayMs?: number;         // teto do backoff
  jitterRatio?: number;        // 0..1
  inactivityMs?: number;       // sem eventos por X ms => reconectar
};

export class TikTokConnectorService implements LiveRoomService {
  private connection?: TikTokLiveConnection;
  private handler: ((evt: LiveEvent) => void) | null = null;
  private connected = false;
  private connecting = false;
  private closedByUser = false;
  private buffer: LiveEvent[] = [];
  private uniqueId:string = ''
  private listenersAttached = false;
  private seen = new Map<string, number>();
  private dedupWindowMs = 4000; // 4s

   // reconexão
  private reconnectOpts: Required<ReconnectOptions> = {
    enable: true,
    maxRetries: -1,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    jitterRatio: 0.2,
    inactivityMs: 30000,
  };
  private retryCount = 0;

   // watchdog
  private lastEventTs = 0;
  private watchdogTimer?: ReturnType<typeof setInterval>;

  private isDuplicate(evt: LiveEvent): boolean {
    // gere uma chave estável por tipo de evento
    const p: any = evt.payload || {};
    let key = evt.t;

    // tente usar um ID único se existir
    if (p.msgId || p.id || p.eventId) key += `#${p.msgId || p.id || p.eventId}`;
    else if (p.user?.userId || p.user?.uniqueId) key += `#${p.user?.userId || p.user?.uniqueId}`;

    // para chat, inclua o texto (previne duplicar duas falas iguais do mesmo user)
    if (evt.t === "message" && p.comment) key += `#${p.comment}`;

    const now = Date.now();
    const last = this.seen.get(key);
    // limpeza básica do mapa
    if (this.seen.size > 2000) {
      const cutoff = now - this.dedupWindowMs;
      for (const [k, ts] of this.seen) if (ts < cutoff) this.seen.delete(k);
    }

    if (last && now - last < this.dedupWindowMs) return true;
    this.seen.set(key, now);
    return false;
  }
  

  onEvent(handler: (event: LiveEvent) => void): void { 
    this.handler = handler; 
  }

  private emit(evt: LiveEvent) {
    const isStatus = evt.t === "connecting" || evt.t === "connected" || evt.t === "disconnected" || evt.t === "reconnecting";
    if (!isStatus) this.lastEventTs = Date.now();

    if (!this.connected && !isStatus) {
      this.buffer.push(evt);
      return;
    }

    // 🔒 anti-duplicata (apenas para eventos "de dados")
    if (!isStatus && this.isDuplicate(evt)) return;

    this.handler?.(evt);
  }

  private flushBuffer() {
    if (!this.connected || this.buffer.length === 0){
      return;
    } 
    for (const e of this.buffer) {
      this.handler?.(e);
    }
    this.buffer.length = 0;
  }

  isConnected(): boolean { 
    return this.connected; 
  }

  async connect(params: ConnectionOptions & { reconnect?: ReconnectOptions }): Promise<void> {
    try{
      if (this.connected || this.connecting) return;

      // aplica overrides de reconexão, se vierem
      this.reconnectOpts = { ...this.reconnectOpts, ...(params.reconnect ?? {}) };

      this.closedByUser = false;
      this.retryCount = 0;
      await this.openOnce(params);

        // const { uniqueId } = params;
        // this.connecting = true;

        // this.emit({ t: "connecting", ts: Date.now(), payload: { uniqueId } });

        // this.connection = new TikTokLiveConnection(uniqueId);        

        // await this.connection.connect();

        // this.connected = true;
        // this.connecting = false;
        // this.emit({ t: "connected", ts: Date.now(), payload: { uniqueId } });
        // this.flushBuffer();

    }catch (error){
      console.log("Não foi possível se conectar: ", error)
    }
  }

  private setupListeners(uniqueId: string){
    if (!this.connection) return;

    // evita múltiplos registros no mesmo socket
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    // listeners tipados pela v2.x
    this.connection.on(WebcastEvent.CHAT,       (data) => this.emit({ t: "message",     ts: Date.now(), payload: data }));
    this.connection.on(WebcastEvent.GIFT,       (data) => this.emit({ t: "gift",        ts: Date.now(), payload: data }));
    this.connection.on(WebcastEvent.LIKE,       (data) => this.emit({ t: "like",        ts: Date.now(), payload: data }));
    this.connection.on(WebcastEvent.FOLLOW,     (data) => this.emit({ t: "follow",      ts: Date.now(), payload: data }));
    this.connection.on(WebcastEvent.SHARE,      (data) => this.emit({ t: "share",       ts: Date.now(), payload: data }));
    this.connection.on(WebcastEvent.ROOM_USER,  (data) => this.emit({ t: "roomUser",    ts: Date.now(), payload: data }));
    this.connection.on(WebcastEvent.MEMBER,     (data) => this.emit({ t: "member",      ts: Date.now(), payload: data }));
    this.connection.on(WebcastEvent.SUPER_FAN,  (data) => this.emit({ t: "superFan",    ts: Date.now(), payload: data }));

    // Opcional: monitore erros/desconexões emitidos pela lib
    this.connection.on(ControlEvent.ERROR, (err) => {
      this.emit({ t: "error", ts: Date.now(), payload: err });
    });

    this.connection.on(ControlEvent.DISCONNECTED, () => {
      // A lib pode avisar; refletimos no nosso estado
      this.connected = false;
      this.connecting = false;
      this.buffer.length = 0;
      this.emit({ t: "disconnected", ts: Date.now(), payload: {} });
      this.tryScheduleReconnect("ws_disconnected");
    });
  }

  private resetConnectionState() {
    this.connected = false;
    this.connecting = false;
    this.listenersAttached = false;
    this.stopWatchdog();
  }

  private startWatchdog(uniqueId: string) {
    this.stopWatchdog();
    this.lastEventTs = Date.now();
    this.watchdogTimer = setInterval(() => {
      if (this.closedByUser || !this.reconnectOpts.enable) return;
      const idle = Date.now() - this.lastEventTs;
      if (this.connected && idle > this.reconnectOpts.inactivityMs) {
        this.emit({
          t: "error",
          ts: Date.now(),
          payload: { reason: "inactivity_timeout", idleMs: idle },
        });
        this.tryScheduleReconnect("inactivity_timeout");
      }
    }, Math.max(2000, Math.floor(this.reconnectOpts.inactivityMs / 3)));
  }

  private stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = undefined;
    }
  }

  private async openOnce(params: ConnectionOptions): Promise<void> {
    let user = this.uniqueId = params.uniqueId;

    this.connecting = true;
    this.emit({ t: "connecting", ts: Date.now(), payload: {user} });

    this.connection = new TikTokLiveConnection(this.uniqueId);
    this.setupListeners(this.uniqueId);

    try {
      await this.connection.connect(); // handshake
      this.connected = true;
      this.connecting = false;
      this.retryCount = 0;

      this.emit({ t: "connected", ts: Date.now(), payload: {user} });
      this.flushBuffer();
      this.startWatchdog(this.uniqueId);
    } catch (err) {
      this.connecting = false;
      this.emit({ t: "error", ts: Date.now(), payload: { reason: "connect_failed", err } });
      this.tryScheduleReconnect("connect_failed");
    }
  }

  private tryScheduleReconnect(reason: string) {
    if (!this.reconnectOpts.enable || this.closedByUser) return;

    this.resetConnectionState();

    // fecha estado atual
    this.connected = false;
    this.connecting = false;
    this.stopWatchdog();

    if (this.reconnectOpts.maxRetries >= 0 && this.retryCount >= this.reconnectOpts.maxRetries) {
      this.emit({
        t: "disconnected",
        ts: Date.now(),
        payload: { reason: `max_retries_reached:${reason}`, retries: this.retryCount },
      });
      return;
    }

    const delay = this.computeBackoffDelay(this.retryCount);
    this.retryCount++;

    this.emit({
      t: "reconnecting",
      ts: Date.now(),
      payload: { reason, attempt: this.retryCount, delayMs: delay },
    });

    // agenda reconexão
    setTimeout(async () => {
      if (this.closedByUser) return;
      // recria do zero
      try {
        (this.connection as any)?.removeAllListeners?.();
      } catch {}
      this.connection = undefined;
      await this.openOnce({ uniqueId: this.uniqueId });
    }, delay);
  }

  private computeBackoffDelay(attempt: number): number {
    const { initialDelayMs, maxDelayMs, jitterRatio } = this.reconnectOpts;
    const exp = Math.min(maxDelayMs, initialDelayMs * Math.pow(2, attempt));
    const jitter = exp * jitterRatio * Math.random();
    return Math.floor(exp - jitter);
  }

  async disconnect(): Promise<void> {
    try {
      const anyConn = this.connection as any;

      if (anyConn?.disconnect) {
        await anyConn.disconnect();
      } else if (anyConn?.close) {
        await anyConn.close();
      }
    } 
    catch (error) {}
    finally{
      this.connected = false;
      this.connecting = false;
      this.resetConnectionState();
      this.buffer.length = 0;

      // Opcional: remove listeners para evitar vazamentos
      try { 
        (this.connection as any)?.removeAllListeners?.(); 
      } catch {}

      this.emit({ t: "disconnected", ts: Date.now(), payload: {} });
    }
  }

  /** Fecha o WebSocket como se a rede tivesse caído */
  public simulateWsClose() {
    try {
      (this.connection as any)?.close?.(1006, "debug_close"); // 1006 = close anormal
    } catch {}
  }

  public simulateDrop(reason = "debug_simulated_drop") {
    // marca como desconectado e agenda reconexão via backoff
    this.tryScheduleReconnect(reason);
  }
}
