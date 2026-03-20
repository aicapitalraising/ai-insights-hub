import { useState, useMemo } from 'react';
import { RefreshCw, Loader2, Trophy, FileText, Wand2, Eye, Play, Image as ImageIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { fetchAllRows } from '@/lib/fetchAllRows';
import { useCreativeBriefs, useUpdateBriefStatus, CreativeBrief } from '@/hooks/useCreativeBriefs';
import { BriefDetailDialog } from '@/components/briefs/BriefDetailDialog';
import { useSyncMetaAds } from '@/hooks/useMetaAds';
import { toast } from 'sonner';
import { format } from 'date-fns';

function fmt$(val: number | null) {
  if (!val) return '$0';
  return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusDot({ status }: { status: string | null }) {
  const s = (status || '').toUpperCase();
  const color = s === 'ACTIVE' ? 'bg-green-500' : s === 'PAUSED' ? 'bg-yellow-500' : 'bg-muted-foreground/40';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

interface AdminAdsManagerTabProps {
  platform?: 'meta' | 'google' | 'all';
}

export function AdminAdsManagerTab({ platform = 'all' }: AdminAdsManagerTabProps) {
  const { data: clients = [] } = useClients();
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [selectedBrief, setSelectedBrief] = useState<CreativeBrief | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<string>('campaigns');
  const syncMeta = useSyncMetaAds();

  // Fetch all campaigns across clients
  const { data: allCampaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['admin-all-campaigns', clientFilter],
    queryFn: async () => {
      return await fetchAllRows((sb) => {
        let q = sb.from('meta_campaigns').select('*').order('spend', { ascending: false });
        if (clientFilter !== 'all') q = q.eq('client_id', clientFilter);
        return q;
      });
    },
  });

  // Fetch all ads across clients
  const { data: allAds = [], isLoading: adsLoading } = useQuery({
    queryKey: ['admin-all-ads', clientFilter],
    queryFn: async () => {
      return await fetchAllRows((sb) => {
        let q = sb.from('meta_ads').select('*').order('spend', { ascending: false });
        if (clientFilter !== 'all') q = q.eq('client_id', clientFilter);
        return q;
      });
    },
  });

  // Fetch all briefs
  const { data: briefs = [], isLoading: briefsLoading } = useCreativeBriefs(
    clientFilter !== 'all' ? clientFilter : undefined
  );
  const updateStatus = useUpdateBriefStatus();

  // Winning ads: top performers across all clients
  const winningAds = useMemo(() => {
    return allAds
      .filter((a: any) => Number(a.spend) > 50)
      .map((a: any) => {
        const spend = Number(a.spend) || 0;
        const leads = Number(a.attributed_leads) || 0;
        const calls = Number(a.attributed_calls) || 0;
        const funded = Number(a.attributed_funded) || 0;
        const fundedDollars = Number(a.attributed_funded_dollars) || 0;
        const roas = spend > 0 ? fundedDollars / spend : 0;
        const cpl = leads > 0 ? spend / leads : Infinity;
        return { ...a, _leads: leads, _calls: calls, _funded: funded, _roas: roas, _cpl: cpl, _spend: spend, _fundedDollars: fundedDollars };
      })
      .filter((a: any) => a._leads > 0 || a._calls > 0 || a._funded > 0)
      .sort((a: any, b: any) => (b._funded || 0) - (a._funded || 0) || (b._leads || 0) - (a._leads || 0))
      .slice(0, 20);
  }, [allAds]);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [clients]);

  const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'default',
    in_production: 'secondary',
    completed: 'outline',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold">
            {platform === 'meta' ? 'Meta Ads Manager' : platform === 'google' ? 'Google Ads Manager' : 'Ads Manager'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Agency-wide view of campaigns, winning ads, and creative briefs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{allCampaigns.length}</p>
          <p className="text-xs text-muted-foreground">Campaigns</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{allAds.length}</p>
          <p className="text-xs text-muted-foreground">Total Ads</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{winningAds.length}</p>
          <p className="text-xs text-muted-foreground">Proven Winners</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{briefs.filter(b => b.status === 'pending').length}</p>
          <p className="text-xs text-muted-foreground">Pending Briefs</p>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="winning" className="gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            Proven Winners
          </TabsTrigger>
          <TabsTrigger value="briefs" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Creative Briefs ({briefs.length})
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaignsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
          ) : allCampaigns.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">No campaigns found. Sync Meta Ads from a client's settings.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">CPM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCampaigns.slice(0, 50).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-medium">{clientMap[c.client_id] || 'Unknown'}</TableCell>
                      <TableCell className="font-medium text-sm max-w-[300px] truncate">{c.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <StatusDot status={c.status} />
                          <span className="text-xs capitalize">{(c.status || '').toLowerCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{fmt$(c.daily_budget || c.lifetime_budget)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmt$(c.spend)}</TableCell>
                      <TableCell className="text-right text-sm">{Number(c.impressions || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{Number(c.clicks || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{c.ctr ? `${Number(c.ctr).toFixed(2)}%` : '-'}</TableCell>
                      <TableCell className="text-right text-sm">{fmt$(c.cpm)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Winning Ads Tab */}
        <TabsContent value="winning" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Top performing ads across all clients ranked by attributed results
            </p>
            <Button variant="outline" size="sm" disabled className="gap-1.5">
              <Wand2 className="h-3.5 w-3.5" />
              Generate Variations from Winners
            </Button>
          </div>

          {winningAds.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No proven winners yet</p>
              <p className="text-sm text-muted-foreground mt-1">Run attribution on client ads to identify top performers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {winningAds.map((ad: any, idx: number) => {
                const creativeUrl = ad.full_image_url || ad.image_url || ad.thumbnail_url;
                const isVideo = ad.media_type === 'video';
                return (
                  <Card key={ad.id} className={`relative overflow-hidden ${idx < 3 ? 'ring-1 ring-chart-4/40' : ''}`}>
                    {idx < 3 && (
                      <Badge className="absolute top-2 right-2 z-10 bg-chart-4 text-chart-4-foreground text-[10px]">
                        #{idx + 1}
                      </Badge>
                    )}
                    {creativeUrl ? (
                      <div className="relative aspect-video overflow-hidden border-b border-border">
                        <img src={creativeUrl} alt="" className="w-full h-full object-cover" />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                            <Play className="h-6 w-6 text-foreground" fill="currentColor" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center border-b border-border">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">{clientMap[ad.client_id] || 'Unknown'}</p>
                      <p className="text-sm font-medium line-clamp-2 leading-tight">{ad.name}</p>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className="bg-muted/50 rounded p-1.5">
                          <p className="text-xs font-bold">{ad._leads}</p>
                          <p className="text-[10px] text-muted-foreground">Leads</p>
                        </div>
                        <div className="bg-muted/50 rounded p-1.5">
                          <p className="text-xs font-bold">{ad._calls}</p>
                          <p className="text-[10px] text-muted-foreground">Calls</p>
                        </div>
                        <div className="bg-muted/50 rounded p-1.5">
                          <p className="text-xs font-bold">{ad._funded}</p>
                          <p className="text-[10px] text-muted-foreground">Funded</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{fmt$(ad._spend)} spent</span>
                        {ad._roas > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{ad._roas.toFixed(1)}x ROAS</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Creative Briefs Tab */}
        <TabsContent value="briefs" className="space-y-4">
          {briefsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading briefs...</div>
          ) : briefs.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No creative briefs found</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {briefs.map((brief) => (
                    <TableRow key={brief.id}>
                      <TableCell className="font-medium">{brief.client_name || clientMap[brief.client_id]}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {brief.source === 'weekly_auto' ? 'Auto' : brief.source || 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={brief.status}
                          onValueChange={(val) => updateStatus.mutate({ id: brief.id, status: val })}
                        >
                          <SelectTrigger className="w-[130px] h-7 text-xs">
                            <Badge variant={STATUS_COLORS[brief.status] || 'default'} className="text-xs capitalize">
                              {brief.status.replace('_', ' ')}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_production">In Production</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(brief.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBrief(brief)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BriefDetailDialog
        brief={selectedBrief}
        open={!!selectedBrief}
        onOpenChange={(open) => !open && setSelectedBrief(null)}
      />
    </div>
  );
}
