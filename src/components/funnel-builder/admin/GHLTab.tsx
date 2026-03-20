import { useState, useMemo } from 'react';
import {
  Calendar, Link2, CheckCircle2, AlertCircle, RefreshCw,
  Settings2, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/db';
import { toast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';

export function GHLTab() {
  const [syncing, setSyncing] = useState(false);
  const { data: leads = [], isLoading } = useLeads();

  // Derive calendar stats from real lead data
  const calendarStats = useMemo(() => {
    const discoveryLeads = leads.filter(l => l.appointmentDate && (l.status === 'booked' || l.status === 'qualified'));
    const kickoffLeads = leads.filter(l => l.appointmentDate && l.status === 'qualified');
    const discoveryShowRate = discoveryLeads.length > 0
      ? Math.round((discoveryLeads.filter(l => l.showedUp === true).length / discoveryLeads.length) * 100)
      : 0;
    const kickoffShowRate = kickoffLeads.length > 0
      ? Math.round((kickoffLeads.filter(l => l.showedUp === true).length / kickoffLeads.length) * 100)
      : 0;

    return [
      { id: '35XuJAAvPdr0w5Tf9sPf', name: '30-min Discovery Call', type: 'Discovery', status: 'connected' as const, appointments: discoveryLeads.length, showRate: discoveryShowRate },
      { id: '30-min-kickoff', name: '30-min Kickoff Call', type: 'Onboarding', status: 'connected' as const, appointments: kickoffLeads.length, showRate: kickoffShowRate },
    ];
  }, [leads]);

  // Derive pipeline from real lead data
  const pipelineStages = useMemo(() => {
    const newCount = leads.filter(l => l.status === 'new').length;
    const bookedCount = leads.filter(l => l.status === 'booked').length;
    const qualifiedCount = leads.filter(l => l.status === 'qualified').length;
    const nonAccredited = leads.filter(l => l.status === 'non-accredited').length;
    const abandoned = leads.filter(l => l.status === 'abandoned').length;
    return [
      { name: 'New Lead', count: newCount, color: 'bg-blue-500' },
      { name: 'Booked', count: bookedCount, color: 'bg-yellow-500' },
      { name: 'Qualified', count: qualifiedCount, color: 'bg-emerald-500' },
      { name: 'Non-Accredited', count: nonAccredited, color: 'bg-purple-500' },
      { name: 'Abandoned', count: abandoned, color: 'bg-destructive' },
    ];
  }, [leads]);

  // Derive recent activity from actual leads (most recently updated)
  const recentSyncs = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(l => {
        let action = 'Contact created';
        if (l.status === 'qualified') action = 'Qualified + routed to closer';
        else if (l.status === 'booked') action = 'Appointment synced';
        else if (l.enrichmentStatus === 'verified') action = 'Contact enriched + tagged';
        else if (l.status === 'non-accredited') action = 'Routed to downsell';

        const created = new Date(l.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const time = diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;

        return {
          name: l.leadName,
          action,
          time,
          status: (l.enrichmentStatus === 'no-match' ? 'warning' : 'success') as 'success' | 'warning',
        };
      });
  }, [leads]);

  const handleTestSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-sync', {
        body: { action: 'test-connection' },
      });
      if (error) throw error;
      toast({ title: 'Connection verified', description: 'GoHighLevel API is responding correctly.' });
    } catch (err) {
      toast({ title: 'Connection failed', description: 'Could not reach GHL API. Check your API key.', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const totalPipeline = pipelineStages.reduce((s, st) => s + st.count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">GoHighLevel Integration</h2>
          <p className="text-sm text-muted-foreground mt-1">Calendar mapping, pipeline sync, and activity log</p>
        </div>
        <Button onClick={handleTestSync} disabled={syncing} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          Test Connection
        </Button>
      </div>

      {/* Calendar Mapping */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Calendar Mapping
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {calendarStats.map((cal) => (
            <Card key={cal.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cal.status === 'connected' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cal.type}</span>
                  </div>
                  <Settings2 className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                </div>
                <h4 className="font-display text-sm font-bold text-foreground mb-3">{cal.name}</h4>
                {cal.status === 'connected' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xl font-bold text-foreground">{cal.appointments}</div>
                      <div className="text-[10px] text-muted-foreground">Appointments</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-foreground">{cal.showRate}%</div>
                      <div className="text-[10px] text-muted-foreground">Show Rate</div>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-full gap-2 text-xs">
                    <Link2 className="w-3 h-3" /> Connect Calendar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pipeline Overview */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> HPA Master Pipeline
        </h3>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            {totalPipeline > 0 ? (
              <div className="flex items-center gap-1 mb-6">
                {pipelineStages.map((stage, i) => {
                  const width = Math.max((stage.count / totalPipeline) * 100, 8);
                  return (
                    <div key={stage.name} className="group relative" style={{ width: `${width}%` }}>
                      <div className={`h-8 ${stage.color} ${i === 0 ? 'rounded-l-md' : ''} ${i === pipelineStages.length - 1 ? 'rounded-r-md' : ''} flex items-center justify-center`}>
                        <span className="text-[10px] font-bold text-white">{stage.count}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground text-center mt-1.5 font-medium">{stage.name}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No leads in pipeline yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sync Activity */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" /> Recent Sync Activity
        </h3>
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentSyncs.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No sync activity yet</div>
              ) : (
                recentSyncs.map((sync, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {sync.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <div>
                        <span className="text-sm font-medium text-foreground">{sync.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">— {sync.action}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{sync.time}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
