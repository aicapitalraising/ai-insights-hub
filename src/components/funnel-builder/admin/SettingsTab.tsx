import { useState, useEffect } from 'react';
import { Settings, Plug, CalendarCheck, Tag, Database, Route, Radio, Megaphone, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/db';

const routingRules = [
  { tier: 'Qualified', score: '70-100', tag: 'qualified-investor', destination: '30-min Discovery Call', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  { tier: 'Borderline', score: '40-69', tag: 'needs-nurture', destination: '30-min Discovery Call', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  { tier: 'Unqualified', score: '0-39', tag: 'non-accredited', destination: '30-min Discovery Call', color: 'bg-destructive/10 text-destructive border-destructive/20' },
];

interface GHLCalendar {
  id: string;
  name: string;
  description: string;
  slug: string;
}

interface CalendarMapping {
  id?: string;
  route: string;
  label: string;
  calendar_id: string;
}

export function SettingsTab() {
  const [ghlCalendars, setGhlCalendars] = useState<GHLCalendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [calendarMappings, setCalendarMappings] = useState<CalendarMapping[]>([]);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchCalendars = async () => {
    setLoadingCalendars(true);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-calendars', {
        body: { action: 'list' },
      });
      if (error) throw error;
      setGhlCalendars(data.calendars || []);
      if ((data.calendars || []).length === 0) {
        toast({ title: 'No calendars found', description: 'Check your GHL Location ID and API key.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Failed to fetch GHL calendars:', err);
      toast({ title: 'Failed to load calendars', description: 'Could not reach GHL API.', variant: 'destructive' });
    } finally {
      setLoadingCalendars(false);
    }
  };

  const fetchMappings = async () => {
    const { data, error } = await supabase
      .from('calendar_mappings')
      .select('*')
      .order('route');
    if (!error && data) {
      setCalendarMappings(data.map((d: any) => ({
        id: d.id,
        route: d.route,
        label: d.label,
        calendar_id: d.calendar_id,
      })));
    }
  };

  useEffect(() => {
    fetchCalendars();
    fetchMappings();
  }, []);

  const handleCalendarChange = (index: number, calendarId: string) => {
    setCalendarMappings(prev => prev.map((m, i) => i === index ? { ...m, calendar_id: calendarId } : m));
  };

  const handleSaveCalendars = async () => {
    setSaving(true);
    try {
      for (const mapping of calendarMappings) {
        if (mapping.id) {
          await supabase
            .from('calendar_mappings')
            .update({ calendar_id: mapping.calendar_id })
            .eq('id', mapping.id);
        }
      }
      toast({ title: 'Calendar mappings saved', description: 'Page-to-calendar assignments updated.' });
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedClients = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-client-directory', {
        body: { password: 'HPA1234$' },
      });
      if (error) throw error;
      const errs = data?.errors?.length || 0;
      toast({
        title: errs > 0 ? 'Seeded with warnings' : 'Client directory synced',
        description: `${data?.clients_upserted || 0} clients, ${data?.settings_upserted || 0} settings, ${data?.funnel_steps_synced || 0} funnel steps${errs > 0 ? ` (${errs} errors)` : ''}`,
        variant: errs > 0 ? 'destructive' : 'default',
      });
      if (errs > 0) console.error('Seed errors:', data.errors);
    } catch (err) {
      console.error('Seed failed:', err);
      toast({ title: 'Seed failed', description: 'Could not sync client directory.', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Integration settings, calendar mapping, routing rules, and ad pixel configuration.</p>
        <Button size="sm" variant="outline" onClick={handleSeedClients} disabled={seeding} className="gap-2 shrink-0">
          <Database className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} /> {seeding ? 'Seeding…' : 'Sync Client Directory'}
        </Button>
      </div>

      {/* Integrations */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Plug className="w-3.5 h-3.5" /> Integrations
        </h3>
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> RetargetIQ
                <Badge className="text-[9px] ml-auto">Connected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Slug: <span className="font-mono font-medium text-foreground">high-performance-ads</span></p>
              <p>API Key: <span className="font-mono font-medium text-foreground">••••••••-3a3f-4a13-••••</span></p>
              <p>Endpoints: <span className="text-foreground">GetDataByPhone, GetDataByEmail, Results</span></p>
            </CardContent>
          </Card>

          <Card className="border-border border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plug className="w-4 h-4 text-muted-foreground" /> GHL (GoHighLevel)
                <Badge variant="outline" className="text-[9px] ml-auto">Not connected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>API Key, Location ID, Calendar Sync, Contact Sync, Lead Tags, Custom Field Mappings</p>
              <p className="text-primary font-medium cursor-pointer hover:underline">→ Configure GHL integration</p>
            </CardContent>
          </Card>

          <Card className="border-border border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-muted-foreground" /> Calendar
                <Badge variant="outline" className="text-[9px] ml-auto">Not connected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <p>Connect Google Calendar or Calendly for booking sync.</p>
            </CardContent>
          </Card>

          <Card className="border-border border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" /> Lead Tags & Rules
                <Badge variant="outline" className="text-[9px] ml-auto">Not configured</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <p>Auto-tag leads based on enrichment data (income, net worth, accreditation).</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calendar Mapping per Page */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CalendarCheck className="w-3.5 h-3.5" /> Calendar Mapping per Page
        </h3>
        <Card className="border-border">
          <CardContent className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Assign a GHL calendar to each page. Leads booking from that page will sync to the selected calendar and show real-time availability.
            </p>
            {calendarMappings.map((mapping, i) => (
              <div key={mapping.route} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="min-w-[140px]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Page</p>
                  <p className="text-sm font-semibold text-foreground">{mapping.label}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{mapping.route}</p>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">GHL Calendar</label>
                  {ghlCalendars.length > 0 ? (
                    <Select value={mapping.calendar_id} onValueChange={(val) => handleCalendarChange(i, val)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select a calendar" />
                      </SelectTrigger>
                      <SelectContent>
                        {ghlCalendars.map((cal) => (
                          <SelectItem key={cal.id} value={cal.id} className="text-xs">
                            <span className="font-medium">{cal.name}</span>
                            <span className="text-muted-foreground ml-2 font-mono text-[10px]">{cal.id.slice(0, 12)}…</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={mapping.calendar_id}
                      onChange={(e) => handleCalendarChange(i, e.target.value)}
                      className="h-8 text-xs font-mono"
                      placeholder={loadingCalendars ? 'Loading calendars…' : 'Enter GHL calendar ID'}
                    />
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveCalendars} disabled={saving} className="gap-2">
                <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Calendar Mappings'}
              </Button>
              <Button size="sm" variant="outline" onClick={fetchCalendars} disabled={loadingCalendars} className="gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCalendars ? 'animate-spin' : ''}`} /> Refresh Calendars
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Routing Rules */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5" /> Lead Routing Rules
        </h3>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-4">
              Auto-route leads based on qualification score. Scores are calculated from RetargetIQ financial data (net worth, income, credit range, investment ownership).
            </p>
            <div className="space-y-3">
              {routingRules.map((rule) => (
                <div key={rule.tier} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${rule.color}`}>
                    {rule.tier}
                  </span>
                  <div className="flex-1 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground text-[10px]">Score Range</p>
                      <p className="font-semibold">{rule.score}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">GHL Tag</p>
                      <p className="font-mono font-medium text-foreground">{rule.tag}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">Route To</p>
                      <p className="font-semibold">{rule.destination}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ad Pixel Feedback */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" /> Ad Pixel Feedback Loop
        </h3>
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border-border border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-500" /> Meta CAPI
                <Badge variant="outline" className="text-[9px] ml-auto">Not configured</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Pixel ID</label>
                <Input placeholder="e.g. 123456789012345" className="h-8 text-xs font-mono" disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Access Token</label>
                <Input placeholder="EAAx..." className="h-8 text-xs font-mono" type="password" disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Event Mapping</label>
                <div className="text-muted-foreground space-y-1 bg-muted/30 rounded p-2">
                  <p>Qualified → <span className="font-mono text-foreground">Purchase</span> (high-value signal)</p>
                  <p>Borderline → <span className="font-mono text-foreground">Lead</span></p>
                  <p>Unqualified → <span className="font-mono text-foreground">ViewContent</span></p>
                </div>
              </div>
              <p className="text-primary font-medium cursor-pointer hover:underline">→ Enable Meta CAPI</p>
            </CardContent>
          </Card>

          <Card className="border-border border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-red-500" /> Google Ads Offline
                <Badge variant="outline" className="text-[9px] ml-auto">Not configured</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Customer ID</label>
                <Input placeholder="e.g. 123-456-7890" className="h-8 text-xs font-mono" disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Conversion Action ID</label>
                <Input placeholder="e.g. 987654321" className="h-8 text-xs font-mono" disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Event Mapping</label>
                <div className="text-muted-foreground space-y-1 bg-muted/30 rounded p-2">
                  <p>Qualified → <span className="font-mono text-foreground">CONVERSION</span> ($10K value)</p>
                  <p>Booked → <span className="font-mono text-foreground">CONVERSION</span> ($1K value)</p>
                </div>
              </div>
              <p className="text-primary font-medium cursor-pointer hover:underline">→ Enable Google Offline Conversions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
