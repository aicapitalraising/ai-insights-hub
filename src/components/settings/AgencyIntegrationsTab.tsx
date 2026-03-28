import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Eye, EyeOff, ExternalLink, CheckCircle2, XCircle, RefreshCw, Plug,
} from 'lucide-react';

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  docsUrl: string;
  description: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'meta',
    name: 'Meta Ads',
    icon: '📘',
    color: 'hsl(var(--primary))',
    description: 'Connect Facebook & Instagram ad accounts for automated spend tracking, lead sync, and creative performance data.',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis/',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'EAAx...', secret: true },
      { key: 'ad_account_id', label: 'Ad Account ID', placeholder: 'act_123456789' },
    ],
  },
  {
    id: 'google',
    name: 'Google Ads',
    icon: '🔍',
    color: '#4285F4',
    description: 'Connect Google Ads accounts for search, display, and YouTube campaign tracking.',
    docsUrl: 'https://developers.google.com/google-ads/api/docs/start',
    fields: [
      { key: 'client_id', label: 'OAuth Client ID', placeholder: '123456789.apps.googleusercontent.com' },
      { key: 'client_secret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-...', secret: true },
      { key: 'developer_token', label: 'Developer Token', placeholder: 'AbCdEf...', secret: true },
      { key: 'customer_id', label: 'Customer ID (MCC)', placeholder: '123-456-7890' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    icon: '💼',
    color: '#0A66C2',
    description: 'Connect LinkedIn Campaign Manager for B2B ad tracking and audience insights.',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'AQV...', secret: true },
      { key: 'ad_account_id', label: 'Ad Account ID', placeholder: '508123456' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    icon: '🎵',
    color: '#000000',
    description: 'Connect TikTok Ads Manager for short-form video ad performance and audience data.',
    docsUrl: 'https://business-api.tiktok.com/portal/docs',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'Your TikTok access token...', secret: true },
      { key: 'advertiser_id', label: 'Advertiser ID', placeholder: '7123456789' },
    ],
  },
];

function useIntegrationStatuses() {
  return useQuery({
    queryKey: ['integration-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_status')
        .select('*');
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        integration_name: string;
        status: string | null;
        last_sync_at: string | null;
        error_message: string | null;
        config: Record<string, any> | null;
      }>;
    },
  });
}

export function AgencyIntegrationsTab() {
  const { data: statuses = [], isLoading } = useIntegrationStatuses();
  const queryClient = useQueryClient();
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const saveMutation = useMutation({
    mutationFn: async ({ platformId, config }: { platformId: string; config: Record<string, string> }) => {
      const existing = statuses.find((s) => s.integration_name === platformId);
      if (existing) {
        const { error } = await supabase
          .from('integration_status')
          .update({
            config: config as any,
            status: 'connected',
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integration_status')
          .insert({
            integration_name: platformId,
            config: config as any,
            status: 'connected',
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { platformId }) => {
      queryClient.invalidateQueries({ queryKey: ['integration-statuses'] });
      toast.success(`${PLATFORMS.find((p) => p.id === platformId)?.name} connected successfully`);
      setExpandedPlatform(null);
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err as Error).message);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platformId: string) => {
      const existing = statuses.find((s) => s.integration_name === platformId);
      if (existing) {
        const { error } = await supabase
          .from('integration_status')
          .update({ status: 'disconnected', config: {} as any, error_message: null, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, platformId) => {
      queryClient.invalidateQueries({ queryKey: ['integration-statuses'] });
      toast.success(`${PLATFORMS.find((p) => p.id === platformId)?.name} disconnected`);
    },
  });

  const getStatus = (platformId: string) => {
    const s = statuses.find((st) => st.integration_name === platformId);
    return s?.status || 'disconnected';
  };

  const getLastSync = (platformId: string) => {
    const s = statuses.find((st) => st.integration_name === platformId);
    return s?.last_sync_at;
  };

  const handleSave = (platform: PlatformConfig) => {
    const values = formValues[platform.id] || {};
    const hasValues = platform.fields.some((f) => values[f.key]?.trim());
    if (!hasValues) {
      toast.error('Please fill in at least one field');
      return;
    }
    saveMutation.mutate({ platformId: platform.id, config: values });
  };

  const toggleFieldVisibility = (key: string) => {
    setVisibleFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = (platformId: string, fieldKey: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [platformId]: { ...(prev[platformId] || {}), [fieldKey]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Plug className="h-5 w-5" />
          Ad Platform Integrations
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your advertising platforms to automatically sync spend, leads, and performance data.
        </p>
      </div>

      <div className="grid gap-4">
        {PLATFORMS.map((platform) => {
          const status = getStatus(platform.id);
          const isConnected = status === 'connected';
          const isExpanded = expandedPlatform === platform.id;
          const lastSync = getLastSync(platform.id);

          return (
            <Card key={platform.id} className="border-2 border-border overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lastSync && isConnected && (
                    <span className="text-xs text-muted-foreground">
                      Last sync: {new Date(lastSync).toLocaleDateString()}
                    </span>
                  )}
                  <Badge
                    variant={isConnected ? 'default' : 'secondary'}
                    className={isConnected ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {isConnected ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Disconnected</>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Expanded Config */}
              {isExpanded && (
                <div className="border-t border-border p-4 bg-muted/30 space-y-4">
                  {platform.fields.map((field) => {
                    const fieldId = `${platform.id}-${field.key}`;
                    const isVisible = visibleFields[fieldId];
                    return (
                      <div key={field.key} className="space-y-1">
                        <Label htmlFor={fieldId} className="text-sm">{field.label}</Label>
                        <div className="relative">
                          <Input
                            id={fieldId}
                            type={field.secret && !isVisible ? 'password' : 'text'}
                            value={formValues[platform.id]?.[field.key] || ''}
                            onChange={(e) => updateField(platform.id, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="font-mono text-sm pr-10"
                          />
                          {field.secret && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => toggleFieldVisibility(fieldId)}
                            >
                              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={platform.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      API Documentation
                    </a>
                    <div className="flex gap-2">
                      {isConnected && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectMutation.mutate(platform.id)}
                          disabled={disconnectMutation.isPending}
                        >
                          Disconnect
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleSave(platform)}
                        disabled={saveMutation.isPending}
                      >
                        {saveMutation.isPending ? 'Saving...' : isConnected ? 'Update' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Composio Section */}
      <Card className="border-2 border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🧩</span>
          <div>
            <h3 className="font-semibold">Composio (Advanced)</h3>
            <p className="text-xs text-muted-foreground">
              For AI agent tool calling across 1000+ apps. Managed in Agency Settings → Integrations.
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            <a href="https://docs.composio.dev/docs" target="_blank" rel="noreferrer" className="flex items-center gap-1">
              Docs <ExternalLink className="h-3 w-3" />
            </a>
          </Badge>
        </div>
      </Card>
    </div>
  );
}
