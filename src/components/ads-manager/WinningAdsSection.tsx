import { useState, useMemo } from 'react';
import { Trophy, Wand2, Loader2, Settings2, Play, Image as ImageIcon, Clock, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useUpdateClientSettings, ClientSettings } from '@/hooks/useClientSettings';
import { useCreateTask } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/db';
import { toast } from 'sonner';

type WinningMetric = 'leads' | 'calls' | 'funded' | 'cpl' | 'cpa' | 'roas';

const METRIC_OPTIONS: { value: WinningMetric; label: string; description: string }[] = [
  { value: 'leads', label: 'Most Leads', description: 'Highest attributed lead count' },
  { value: 'calls', label: 'Most Calls', description: 'Highest attributed call count' },
  { value: 'funded', label: 'Most Funded', description: 'Highest attributed funded investors' },
  { value: 'cpl', label: 'Best CPL', description: 'Lowest cost per lead (min $50 spend)' },
  { value: 'cpa', label: 'Best CPA', description: 'Lowest cost per funded investor (min $50 spend)' },
  { value: 'roas', label: 'Best ROAS', description: 'Highest return on ad spend' },
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function fmt$(val: number | null) {
  if (!val) return '$0';
  return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getWinningScore(ad: any, metric: WinningMetric): number {
  const spend = Number(ad.spend) || 0;
  switch (metric) {
    case 'leads': return Number(ad.attributed_leads) || 0;
    case 'calls': return Number(ad.attributed_calls) || 0;
    case 'funded': return Number(ad.attributed_funded) || 0;
    case 'cpl': {
      const leads = Number(ad.attributed_leads) || 0;
      if (spend < 50 || leads === 0) return Infinity;
      return spend / leads; // Lower is better
    }
    case 'cpa': {
      const funded = Number(ad.attributed_funded) || 0;
      if (spend < 50 || funded === 0) return Infinity;
      return spend / funded; // Lower is better
    }
    case 'roas': {
      const fundedDollars = Number(ad.attributed_funded_dollars) || 0;
      return spend > 0 ? fundedDollars / spend : 0;
    }
    default: return 0;
  }
}

function isLowerBetter(metric: WinningMetric): boolean {
  return metric === 'cpl' || metric === 'cpa';
}

interface WinningAdsSectionProps {
  ads: any[];
  clientId: string;
  clientName: string;
  settings: ClientSettings | null | undefined;
}

export function WinningAdsSection({ ads, clientId, clientName, settings }: WinningAdsSectionProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [localMetric, setLocalMetric] = useState<WinningMetric>(
    (settings as any)?.winning_metric || 'leads'
  );
  const [scheduleType, setScheduleType] = useState<string>(
    (settings as any)?.variation_schedule_type || 'weekly'
  );
  const [scheduleDays, setScheduleDays] = useState<string[]>(
    (settings as any)?.variation_schedule_days || ['monday', 'thursday']
  );
  const [scheduleTime, setScheduleTime] = useState<string>(
    (settings as any)?.variation_schedule_time || '07:00'
  );
  const [autoEnabled, setAutoEnabled] = useState<boolean>(
    (settings as any)?.variation_auto_enabled || false
  );

  const updateSettings = useUpdateClientSettings();
  const createTask = useCreateTask();

  const metric: WinningMetric = (settings as any)?.winning_metric || localMetric;

  const winningAds = useMemo(() => {
    const adsWithSpend = ads.filter((a: any) => Number(a.spend) > 0);
    const scored = adsWithSpend.map(ad => ({
      ...ad,
      _score: getWinningScore(ad, metric),
    }));

    const lowerBetter = isLowerBetter(metric);
    scored.sort((a, b) => lowerBetter
      ? (a._score === Infinity ? 1 : b._score === Infinity ? -1 : a._score - b._score)
      : b._score - a._score
    );

    return scored.filter(a => a._score !== Infinity && a._score > 0).slice(0, 5);
  }, [ads, metric]);

  const handleMetricChange = async (value: string) => {
    setLocalMetric(value as WinningMetric);
    try {
      await updateSettings.mutateAsync({
        client_id: clientId,
        winning_metric: value,
      } as any);
    } catch { /* silent */ }
  };

  const handleSaveSchedule = async () => {
    try {
      await updateSettings.mutateAsync({
        client_id: clientId,
        variation_schedule_type: scheduleType,
        variation_schedule_days: scheduleDays,
        variation_schedule_time: scheduleTime,
        variation_auto_enabled: autoEnabled,
      } as any);
      toast.success('Variation schedule saved');
      setScheduleOpen(false);
    } catch {
      toast.error('Failed to save schedule');
    }
  };

  const handleGenerateVariations = async () => {
    if (winningAds.length === 0) {
      toast.error('No winning ads found — run attribution first');
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-variations', {
        body: {
          clientId,
          clientName,
          metric,
          topAds: winningAds.slice(0, 3).map(a => ({
            id: a.id,
            name: a.name,
            headline: a.headline,
            body: a.body,
            spend: a.spend,
            ctr: a.ctr,
            leads: a.attributed_leads,
            calls: a.attributed_calls,
            funded: a.attributed_funded,
            fundedDollars: a.attributed_funded_dollars,
            cpl: a.cost_per_lead,
            cpa: a.cost_per_funded,
            imageUrl: a.full_image_url || a.image_url || a.thumbnail_url,
          })),
        },
      });
      if (error) throw error;
      toast.success(`Generated ${data?.tasksCreated || 0} variation tasks`);
    } catch (err) {
      toast.error(`Generation failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setGenerating(false);
    }
  };

  const toggleDay = (day: string) => {
    setScheduleDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getCreativeUrl = (ad: any) => ad.full_image_url || ad.image_url || ad.thumbnail_url || null;

  const getScoreLabel = (ad: any) => {
    switch (metric) {
      case 'leads': return `${ad.attributed_leads || 0} leads`;
      case 'calls': return `${ad.attributed_calls || 0} calls`;
      case 'funded': return `${ad.attributed_funded || 0} funded`;
      case 'cpl': return `${fmt$(ad.cost_per_lead)} CPL`;
      case 'cpa': return `${fmt$(ad.cost_per_funded)} CPA`;
      case 'roas': {
        const roas = Number(ad.spend) > 0 ? (Number(ad.attributed_funded_dollars) || 0) / Number(ad.spend) : 0;
        return `${roas.toFixed(1)}x ROAS`;
      }
      default: return '';
    }
  };

  const scheduleLabel = autoEnabled
    ? scheduleType === 'daily' ? 'Daily'
      : scheduleType === 'weekly' ? 'Weekly'
      : scheduleDays.map(d => d.slice(0, 3).charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')
    : 'Off';

  return (
    <>
      <Card className="border-chart-4/30 bg-gradient-to-br from-card to-chart-4/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-chart-4" />
              <CardTitle className="text-base">Winning Creatives</CardTitle>
              <Badge variant="outline" className="text-xs">{winningAds.length} winners</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select value={metric} onValueChange={handleMetricChange}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setScheduleOpen(true)}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {scheduleLabel}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Configure auto-variation schedule</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleGenerateVariations}
                disabled={generating || winningAds.length === 0}
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Generate 4 Variations
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {winningAds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No winning ads found. Run Attribution to calculate performance, then select a winning metric above.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {winningAds.map((ad, idx) => {
                const creativeUrl = getCreativeUrl(ad);
                const isVideo = ad.media_type === 'video';
                return (
                  <div
                    key={ad.id}
                    className={`relative rounded-lg border bg-card p-3 space-y-2 ${idx === 0 ? 'ring-2 ring-chart-4/50' : ''}`}
                  >
                    {idx === 0 && (
                      <Badge className="absolute -top-2 -right-2 text-[10px] bg-chart-4 text-chart-4-foreground">
                        #1
                      </Badge>
                    )}
                    {idx > 0 && (
                      <Badge variant="outline" className="absolute -top-2 -right-2 text-[10px]">
                        #{idx + 1}
                      </Badge>
                    )}
                    {/* Thumbnail */}
                    {creativeUrl ? (
                      <div className="relative aspect-square rounded-md overflow-hidden border border-border">
                        <img src={creativeUrl} alt="" className="w-full h-full object-cover" />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                            <Play className="h-5 w-5 text-foreground" fill="currentColor" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs font-medium line-clamp-2 leading-tight">{ad.name}</p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{fmt$(ad.spend)} spent</span>
                      <Badge variant="secondary" className="text-[10px]">{getScoreLabel(ad)}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Configuration Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Auto-Variation Schedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Enable Auto-Generation</Label>
              <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
            </div>

            {autoEnabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-xs">Frequency</Label>
                  <Select value={scheduleType} onValueChange={setScheduleType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduleType === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Select Days</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map(day => (
                        <Button
                          key={day}
                          variant={scheduleDays.includes(day) ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2.5 capitalize"
                          onClick={() => toggleDay(day)}
                        >
                          {day.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Time (24h)</Label>
                  <Select value={scheduleTime} onValueChange={setScheduleTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 inline mr-1" />
                  {scheduleType === 'daily'
                    ? `Variations generated daily at ${scheduleTime}`
                    : scheduleType === 'weekly'
                    ? `Variations generated weekly on Monday at ${scheduleTime}`
                    : `Variations generated on ${scheduleDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')} at ${scheduleTime}`
                  }
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveSchedule} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
