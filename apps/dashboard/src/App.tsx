import { MetricCard, ChatMessage, ConnectionBar, LiveBadge } from "@tk-live/ui";
import { useLiveMetrics } from "./live/useLiveMetrics";
import { mapLiveToConnectionStatus } from "./utils/mapStatus";


export function Dashboard() {
  const metrics = useLiveMetrics();

  return (
    <div>
      <ConnectionBar status={mapLiveToConnectionStatus(metrics.status.state)} />
      <div className="grid grid-cols-5 gap-4 mt-4">
        <MetricCard label="Viewers" value={metrics.viewerCount} />
        <MetricCard label="Likes" value={metrics.likesTotal} />
        <MetricCard label="Diamonds" value={metrics.diamondsTotal} />
        <MetricCard label="Shares" value={metrics.sharesTotal} />
        <MetricCard label="Followers" value={metrics.followersGained} />
      </div>
      <LiveBadge status={metrics.status.state}  />
      <div className="mt-6">
        {metrics.chatFeed.map((msg) => (
          <ChatMessage key={msg.ts} username={msg.user} text={msg.message} />
        ))}
      </div>
    </div>
  );
}