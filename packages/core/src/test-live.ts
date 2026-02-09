import { TikTokConnectorService } from "./services/TikTokConnectorService.js";

async function main() {
  const service = new TikTokConnectorService();

  // logs amigáveis
  service.onEvent((e:any) => {
    const t = new Date(e.ts).toLocaleTimeString();
    switch (e.t) {
      case "connecting":
        console.log(`[${t}] 🔌 Conectando...`, e.payload);
        break;
      case "connected":
        console.log(`[${t}] ✅ Conectado!`, e.payload);
        break;
      case "reconnecting":
        console.log(`[${t}] ♻️  Reconnecting`, e.payload);
        break;
      case "disconnected":
        console.log(`[${t}] ❌ Disconnected`, e.payload);
        break;
      case "error":
        console.log(`[${t}] ⚠️  Error`, e.payload);
        break;
      case "message":
        console.log(`[${t}] 💬 ${e.payload?.user?.nickname} (${e.payload?.user?.uniqueId}): ${e.payload?.comment}`);
        break;
      case "gift":
        console.log(`[${t}] 🎁 ${e.payload?.user?.nickname} -> ${e.payload?.giftDetails?.giftName}`);
        break;
      case "like":
        console.log(`[${t}] ❤️ ${e.payload?.user?.nickname} +${e.payload?.likeCount}`);
        break;
      case "follow":
        console.log(`[${t}] ➡️  ${e.payload?.user?.nickname} seguiu`);
        break;
      case "share":
        console.log(`[${t}] 📧 ${e.payload?.user?.nickname} compartilhou`);
        break;
      case "member":
        console.log(`[${t}] 🙋 ${e.payload?.user?.nickname} entrou`);
        break;
      default:
        // outros tipos que você emite (roomUser, superFan, etc.)
        console.log(`[${t}] 📦 ${e.t}`, e.payload);
    }
  });

  await service.connect({
    uniqueId: "willjrmusic", // troque por quem estiver AO VIVO
    reconnect: {
      enable: true,
      inactivityMs: 30000,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      jitterRatio: 0.2,
      maxRetries: -1, // infinito
    },
  });
}

main().catch(err => console.error(err));
