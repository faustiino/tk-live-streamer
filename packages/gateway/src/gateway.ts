import express from "express";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import pino from "pino";
import client from "prom-client";
import http from "http";
import { TikTokConnectorService } from "@tk-live/core";

const log = pino({ level: "info" });
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/live" });

const service = new TikTokConnectorService();

// ===== METRICS =====
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const eventsCounter = new client.Counter({
  name: "tiktok_events_total",
  help: "Total de eventos emitidos",
  labelNames: ["type"],
});
const reconnectCounter = new client.Counter({
  name: "tiktok_reconnects_total",
  help: "Total de reconexões",
  labelNames: ["reason"],
});
register.registerMetric(eventsCounter);
register.registerMetric(reconnectCounter);

// ===== STATE =====
let currentUniqueId: string | undefined;
const sockets = new Set<WebSocket>();

// ===== WS BROADCAST =====
function broadcast(obj: any) {
  const payload = JSON.stringify(obj);
  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}

wss.on("connection", (ws) => {
  sockets.add(ws);
  ws.on("close", () => sockets.delete(ws));
  // opcional: status inicial
  ws.send(JSON.stringify({ t: "status", ts: Date.now(), payload: {
    connected: service.isConnected(), uniqueId: currentUniqueId
  }}));
});

// ===== SERVICE EVENTS =====
service.onEvent((e) => {
  console.log(e)
  eventsCounter.inc({ type: e.t });
  if (e.t === "reconnecting") {
    const p = e.payload as { reason?: string };
    reconnectCounter.inc({ reason: p.reason || "unknown" });
  }
  // log.debug({ e }, "live-event");
  log.info({ t: e.t, payload: e.payload, ts: e.ts }, "live-event");
  broadcast(e);
});

// ===== HTTP ROUTES =====
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/status", (_req, res) => {
  res.json({ connected: service.isConnected(), uniqueId: currentUniqueId });
});

app.post("/connect", async (req, res) => {
  try {
    const uniqueId = (req.query.uniqueId as string)?.trim();
    if (!uniqueId) return res.status(400).json({ error: "missing uniqueId" });
    currentUniqueId = uniqueId;

    await service.connect({
      uniqueId,
      reconnect: {
        enable: true,
        maxRetries: -1,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        jitterRatio: 0.2,
        inactivityMs: 30000,
      },
    });

    res.json({ ok: true, uniqueId });
  } catch (err: any) {
    log.error({ err }, "connect-failed");
    res.status(500).json({ error: err?.message || "connect_failed" });
  }
});

app.post("/disconnect", async (_req, res) => {
  try {
    await service.disconnect();
    currentUniqueId = undefined;
    res.json({ ok: true });
  } catch (err: any) {
    log.error({ err }, "disconnect-failed");
    res.status(500).json({ error: err?.message || "disconnect_failed" });
  }
});

// ===== START =====
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
server.listen(PORT, () => {
  log.info({ PORT }, "Gateway running");
});
