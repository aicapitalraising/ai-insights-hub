import { useState } from 'react';
import { Copy, Check, Link, Key, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Client } from '@/hooks/useClients';
import { ClientSettings } from '@/hooks/useClientSettings';

interface ApiInfoTabProps {
  client: Client;
  settings: ClientSettings | null | undefined;
}

interface InfoRowProps {
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
  isSensitive?: boolean;
}

function InfoRow({ label, value, isLink, isSensitive }: InfoRowProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const displayValue = value || '—';
  const hasValue = !!value;

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedValue = isSensitive && !revealed && value
    ? `${value.slice(0, 8)}${'•'.repeat(Math.min(value.length - 8, 20))}`
    : displayValue;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 group transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-sm font-mono truncate mt-0.5 ${hasValue ? 'text-foreground' : 'text-muted-foreground/50'}`}>
          {maskedValue}
        </p>
      </div>
      <div className="flex items-center gap-1 ml-2 shrink-0">
        {isSensitive && hasValue && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setRevealed(!revealed)}
          >
            <Key className="h-3.5 w-3.5" />
          </Button>
        )}
        {isLink && hasValue && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => window.open(value!, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
        {hasValue && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-chart-2" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1 px-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

export function ApiInfoTab({ client, settings }: ApiInfoTabProps) {
  const [allCopied, setAllCopied] = useState(false);

  const publicDashboardUrl = client.slug
    ? `${window.location.origin}/p/${client.slug}`
    : client.public_token
    ? `${window.location.origin}/p/${client.public_token}`
    : null;

  const businessManagerUrl = client.business_manager_url || null;

  const metaAdAccountId = client.meta_ad_account_id || null;
  const metaAdsManagerUrl = metaAdAccountId
    ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${metaAdAccountId}`
    : null;

  const adsLibraryUrl = (settings as any)?.ads_library_url || null;

  const allInfo: { label: string; value: string | null | undefined }[] = [
    { label: 'Client Name', value: client.name },
    { label: 'Client ID', value: client.id },
    { label: 'Status', value: client.status },
    { label: 'Industry', value: client.industry },
    { label: 'Slug', value: client.slug },
    { label: 'Public Token', value: client.public_token },
    { label: 'Public Dashboard URL', value: publicDashboardUrl },
    { label: 'Meta Ad Account ID', value: metaAdAccountId },
    { label: 'Meta Ads Manager URL', value: metaAdsManagerUrl },
    { label: 'Business Manager URL', value: businessManagerUrl },
    { label: 'Ads Library URL', value: adsLibraryUrl },
    { label: 'GHL Location ID', value: client.ghl_location_id },
    { label: 'GHL API Key', value: client.ghl_api_key },
    { label: 'HubSpot Portal ID', value: client.hubspot_portal_id },
    { label: 'HubSpot Access Token', value: client.hubspot_access_token },
    { label: 'Meta Access Token', value: client.meta_access_token },
    { label: 'Logo URL', value: client.logo_url },
    { label: 'Website URL', value: (client as any).website_url },
  ];

  const handleCopyAll = () => {
    const text = allInfo
      .filter(i => i.value)
      .map(i => `${i.label}: ${i.value}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    toast.success('All client info copied to clipboard');
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-3 pt-2">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <Link className="h-4 w-4" />
            Client API & Link Info
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quick-copy all client identifiers, API keys, and links
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
          {allCopied ? <Check className="h-3.5 w-3.5 text-chart-2" /> : <Copy className="h-3.5 w-3.5" />}
          Copy All
        </Button>
      </div>

      <div className="border-2 border-border rounded-lg divide-y divide-border/50">
        <SectionHeader title="General" />
        <InfoRow label="Client Name" value={client.name} />
        <InfoRow label="Client ID" value={client.id} />
        <InfoRow label="Status" value={client.status} />
        <InfoRow label="Industry" value={client.industry} />
        <InfoRow label="Slug" value={client.slug} />

        <SectionHeader title="Public Links" />
        <InfoRow label="Public Token" value={client.public_token} />
        <InfoRow label="Public Dashboard URL" value={publicDashboardUrl} isLink />
        <InfoRow label="Logo URL" value={client.logo_url} isLink />
        <InfoRow label="Website URL" value={(client as any).website_url} isLink />

        <SectionHeader title="Meta / Facebook" />
        <InfoRow label="Ad Account ID" value={metaAdAccountId} />
        <InfoRow label="Ads Manager URL" value={metaAdsManagerUrl} isLink />
        <InfoRow label="Business Manager URL" value={businessManagerUrl} isLink />
        <InfoRow label="Ads Library URL" value={adsLibraryUrl} isLink />
        <InfoRow label="Meta Access Token" value={client.meta_access_token} isSensitive />

        <SectionHeader title="GoHighLevel" />
        <InfoRow label="Location ID" value={client.ghl_location_id} />
        <InfoRow label="API Key" value={client.ghl_api_key} isSensitive />

        <SectionHeader title="HubSpot" />
        <InfoRow label="Portal ID" value={client.hubspot_portal_id} />
        <InfoRow label="Access Token" value={client.hubspot_access_token} isSensitive />
      </div>
    </div>
  );
}
