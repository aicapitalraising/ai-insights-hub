import { StuckSyncsBanner } from './StuckSyncsBanner';
import { ClientSyncCards } from './ClientSyncCards';
import { WebhookCoveragePanel } from './WebhookCoveragePanel';

export function SyncOverviewTab() {
  return (
    <div className="space-y-6">
      <StuckSyncsBanner />
      <div>
        <h2 className="text-lg font-semibold mb-3">Client Sync Status</h2>
        <ClientSyncCards />
      </div>
      <WebhookCoveragePanel />
    </div>
  );
}
