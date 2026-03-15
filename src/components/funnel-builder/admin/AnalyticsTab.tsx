import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, Users, CalendarCheck, Target, TrendingUp, TrendingDown,
  ArrowUpRight, Megaphone, UserCheck, UserX, Ghost, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts';
import { useLeads } from '@/hooks/useLeads';

const periods = ['7d', '14d', '30d', '90d', 'All'] as const;

function getDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AnalyticsTab() {
  const [period, setPeriod] = useState<string>('30d');
  const { data: allLeads = [], isLoading } = useLeads();

  // Filter leads by period
  const leads = useMemo(() => {
    if (period === 'All') return allLeads;
    const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '30d' ? 30 : 90;
    const cutoff = getDaysAgo(days);
    return allLeads.filter(l => new Date(l.createdAt) >= cutoff);
  }, [allLeads, period]);

  // Core KPIs
  const totalLeads = leads.length;
  const bookedLeads = leads.filter(l => l.status === 'booked' || l.status === 'qualified' || l.appointmentDate);
  const qualifiedLeads = leads.filter(l => l.status === 'qualified' || l.qualificationTier === 'qualified');
  const abandonedLeads = leads.filter(l => l.status === 'abandoned');
  const showedUpLeads = leads.filter(l => l.showedUp === true);
  const noShowLeads = leads.filter(l => l.showedUp === false);
  const newLeads = leads.filter(l => l.status === 'new');

  const bookingRate = totalLeads > 0 ? ((bookedLeads.length / totalLeads) * 100).toFixed(1) : '0';
  const qualificationRate = totalLeads > 0 ? ((qualifiedLeads.length / totalLeads) * 100).toFixed(1) : '0';
  const showUpRate = bookedLeads.length > 0 ? ((showedUpLeads.length / bookedLeads.length) * 100).toFixed(1) : '0';
  const noShowRate = bookedLeads.length > 0 ? ((noShowLeads.length / bookedLeads.length) * 100).toFixed(1) : '0';

  // Build chart data grouped by day
  const chartData = useMemo(() => {
    if (leads.length === 0) return [];

    const byDay: Record<string, { leads: number; booked: number; qualified: number; showedUp: number }> = {};
    leads.forEach(l => {
      const day = l.createdAt?.split('T')[0] || l.createdAt;
      if (!byDay[day]) byDay[day] = { leads: 0, booked: 0, qualified: 0, showedUp: 0 };
      byDay[day].leads++;
      if (l.status === 'booked' || l.status === 'qualified' || l.appointmentDate) byDay[day].booked++;
      if (l.status === 'qualified' || l.qualificationTier === 'qualified') byDay[day].qualified++;
      if (l.showedUp === true) byDay[day].showedUp++;
    });

    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date: formatDate(date),
        leads: counts.leads,
        booked: counts.booked,
        qualified: counts.qualified,
        bookRate: counts.leads > 0 ? Math.round((counts.booked / counts.leads) * 100) : 0,
        showUpRate: counts.booked > 0 ? Math.round((counts.showedUp / counts.booked) * 100) : 0,
      }));
  }, [leads]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const bySource: Record<string, { total: number; booked: number; qualified: number }> = {};
    leads.forEach(l => {
      const src = l.source || 'Unknown';
      if (!bySource[src]) bySource[src] = { total: 0, booked: 0, qualified: 0 };
      bySource[src].total++;
      if (l.status === 'booked' || l.status === 'qualified' || l.appointmentDate) bySource[src].booked++;
      if (l.qualificationTier === 'qualified') bySource[src].qualified++;
    });
    return Object.entries(bySource)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([source, counts]) => ({
        source: source.charAt(0).toUpperCase() + source.slice(1),
        leads: counts.total,
        booked: counts.booked,
        qualified: counts.qualified,
        convRate: counts.total > 0 ? Math.round((counts.booked / counts.total) * 100) : 0,
      }));
  }, [leads]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });
    return counts;
  }, [leads]);

  // Enrichment breakdown
  const enrichmentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const status = l.enrichmentStatus || 'pending';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [leads]);

  // Tier breakdown
  const tierBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const tier = l.qualificationTier || 'unqualified';
      counts[tier] = (counts[tier] || 0) + 1;
    });
    return counts;
  }, [leads]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {totalLeads} lead{totalLeads !== 1 ? 's' : ''} in period
        </span>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Leads', value: totalLeads.toLocaleString(), icon: Users },
          { label: 'Booked', value: bookedLeads.length.toLocaleString(), icon: CalendarCheck },
          { label: 'Qualified', value: qualifiedLeads.length.toLocaleString(), icon: Target },
          { label: 'Lead → Booked %', value: `${bookingRate}%`, icon: TrendingUp },
          { label: 'Qualified %', value: `${qualificationRate}%`, icon: Target },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Show-up Rate', value: `${showUpRate}%`, icon: UserCheck, highlight: true },
          { label: 'No-show Rate', value: `${noShowRate}%`, icon: UserX, highlight: false },
          { label: 'Abandoned', value: abandonedLeads.length.toString(), icon: Ghost, highlight: false },
          { label: 'Showed Up', value: `${showedUpLeads.length}/${bookedLeads.length}`, icon: CalendarCheck, highlight: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
            <Card className={`border-border ${kpi.highlight ? 'border-primary/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className={`w-3.5 h-3.5 ${kpi.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Lead Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="booked" name="Booked" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="qualified" name="Qualified" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No lead data for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Rates Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="bookRate" name="Booking %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="showUpRate" name="Show-up %" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No lead data for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Source Performance + Breakdowns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Source breakdown chart */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> Leads by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="booked" name="Booked" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qualified" name="Qualified" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No source data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdowns */}
        <div className="space-y-4">
          {/* Status */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize text-foreground">{status.replace('-', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${totalLeads > 0 ? (count / totalLeads) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(statusBreakdown).length === 0 && (
                <p className="text-xs text-muted-foreground italic">No data</p>
              )}
            </CardContent>
          </Card>

          {/* Qualification Tier */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Qualification Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(tierBreakdown).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize text-foreground">{tier}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          tier === 'qualified' ? 'bg-emerald-500' : tier === 'borderline' ? 'bg-yellow-500' : 'bg-destructive'
                        }`}
                        style={{ width: `${totalLeads > 0 ? (count / totalLeads) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(tierBreakdown).length === 0 && (
                <p className="text-xs text-muted-foreground italic">No data</p>
              )}
            </CardContent>
          </Card>

          {/* Enrichment */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Enrichment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(enrichmentBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize text-foreground">{status.replace('-', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          status === 'verified' ? 'bg-emerald-500' : status === 'spouse' ? 'bg-blue-500' : status === 'no-match' ? 'bg-destructive' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${totalLeads > 0 ? (count / totalLeads) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(enrichmentBreakdown).length === 0 && (
                <p className="text-xs text-muted-foreground italic">No data</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
