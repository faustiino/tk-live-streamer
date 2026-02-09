import type { LiveStatus } from "../live/useLiveMetrics";
import type { ConnectionStatus } from "@tk-live/ui"; 
// se @tk-live/ui não exporta ConnectionStatus na raiz ainda, exporta lá no index.ts do ui

export function mapLiveToConnectionStatus(state: LiveStatus): ConnectionStatus {
  switch (state) {
    case "live":
      return "connected";
    case "reconnecting":
      return "reconnecting";
    case "offline":
    default:
      return "disconnected";
  }
}
