import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { 
  BarChart3, 
  Clock, 
  RefreshCw, 
  Timer, 
  Zap,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/db';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, differenceInSeconds } from 'date-fns';
import { getStoredKeys, TIER_CONFIGS, MAX_KEYS } from '@/hooks/useApiRateLimiter';

interface UsageRecord {
  id: string;
  service: string;
  key_index: number;
  created_at: string;
  request_type: string | null;
  success: boolean | null;
}

function getTimeUntilReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);
  return differenceInSeconds(tomorrow, now);
}

function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getTimeUntilMinuteReset() {
  const now = new Date();
  return 60 - now.getSeconds();
}

const KEY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--muted-foreground))',
  'hsl(220, 70%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
];

export function UsageDashboard() {
  const [timeUntilDailyReset, setTimeUntilDailyReset] = useState(getTimeUntilReset());
  const [timeUntilMinuteReset, setTimeUntilMinuteReset] = useState(getTimeUntilMinuteReset());
  const [timeRange, setTimeRange] = useState<'7d' | 'all'>('7d');

  const storedKeys = getStoredKeys('veo3');
  const activeKeys = storedKeys.filter(k => k.key.trim());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilDailyReset(getTimeUntilReset());
      setTimeUntilMinuteReset(getTimeUntilMinuteReset());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: usageData, isLoading, refetch } = useQuery({
    queryKey: ['api-usage-history', timeRange],
    queryFn: async (): Promise<UsageRecord[]> => {
      let query = supabase
        .from('api_usage')
        .select('*')
        .eq('success', true)
        .order('created_at', { ascending: false });

      if (timeRange === '7d') {
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        query = query.gte('created_at', sevenDaysAgo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const chartData = useMemo(() => {
    if (!usageData) return [];

    const dailyMap = new Map<string, Record<string, number>>();
    const days = timeRange === '7d' ? 7 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const entry: Record<string, number> = {};
      for (let k = 0; k < MAX_KEYS; k++) entry[`key${k}`] = 0;
      dailyMap.set(date, entry);
    }

    usageData.forEach((record) => {
      const date = format(new Date(record.created_at), 'yyyy-MM-dd');
      const existing = dailyMap.get(date);
      if (existing) {
        const keyField = `key${record.key_index}`;
        existing[keyField] = (existing[keyField] || 0) + 1;
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, counts]) => {
        const total = Object.values(counts).reduce((s, v) => s + v, 0);
        return { date: format(new Date(date), 'MMM d'), ...counts, total };
      })
      .slice(-days);
  }, [usageData, timeRange]);

  const keyStats = useMemo(() => {
    if (!usageData) return [];

    const today = startOfDay(new Date()).toISOString();
    const stats: { total: number; today: number }[] = Array.from({ length: MAX_KEYS }, () => ({ total: 0, today: 0 }));

    usageData.forEach((record) => {
      const idx = record.key_index;
      if (idx >= 0 && idx < MAX_KEYS) {
        stats[idx].total++;
        if (new Date(record.created_at) >= new Date(today)) {
          stats[idx].today++;
        }
      }
    });

    return stats;
  }, [usageData]);

  const todayTotal = keyStats.reduce((s, k) => s + k.today, 0);
  const allTimeTotal = keyStats.reduce((s, k) => s + k.total, 0);
  const totalDailyCapacity = activeKeys.reduce((s, k) => s + TIER_CONFIGS[k.tier || 'free'].perDay, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Dashboard
            </CardTitle>
            <CardDescription>
              Track API usage across {activeKeys.length} key(s) • {totalDailyCapacity.toLocaleString()} total daily capacity
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reset Countdowns */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
            <div className="p-2 rounded-full bg-primary/10">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Per-Minute Reset</p>
              <p className="text-2xl font-mono font-bold">{timeUntilMinuteReset}s</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
            <div className="p-2 rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Reset (UTC midnight)</p>
              <p className="text-2xl font-mono font-bold">{formatTimeRemaining(timeUntilDailyReset)}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg border text-center">
            <Zap className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{todayTotal}</p>
            <p className="text-sm text-muted-foreground">Today's Requests</p>
          </div>
          <div className="p-4 rounded-lg border text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{allTimeTotal}</p>
            <p className="text-sm text-muted-foreground">
              {timeRange === '7d' ? 'Last 7 Days' : 'All Time'}
            </p>
          </div>
          <div className="p-4 rounded-lg border text-center">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">
              {chartData.length > 0 
                ? Math.round(allTimeTotal / Math.max(chartData.length, 1))
                : 0
              }
            </p>
            <p className="text-sm text-muted-foreground">Avg per Day</p>
          </div>
        </div>

        {/* Per-Key Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            Per-Key Breakdown
            <Badge variant="outline" className="font-normal">Tier-based limits</Badge>
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {storedKeys.map((keyConfig, index) => {
              if (!keyConfig.key.trim()) return null;
              const tierLimits = TIER_CONFIGS[keyConfig.tier || 'free'];
              const todayCount = keyStats[index]?.today || 0;
              const pct = (todayCount / tierLimits.perDay) * 100;

              return (
                <div key={index} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge>{keyConfig.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{tierLimits.label}</Badge>
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      pct >= 100 && 'text-destructive',
                      pct >= 80 && pct < 100 && 'text-yellow-500'
                    )}>
                      {todayCount} / {tierLimits.perDay.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(pct, 100)} 
                    className={cn(
                      'h-2',
                      pct >= 100 && '[&>div]:bg-destructive',
                      pct >= 80 && pct < 100 && '[&>div]:bg-yellow-500'
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {keyStats[index]?.total || 0} total • {tierLimits.perMinute} RPM
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Historical Usage</h4>
            <div className="flex gap-1">
              <Button
                variant={timeRange === '7d' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                Last 7 Days
              </Button>
              <Button
                variant={timeRange === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('all')}
              >
                All Time
              </Button>
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No usage data yet</p>
                  <p className="text-sm">Generate some content to see usage stats</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {storedKeys.map((keyConfig, index) => {
                    if (!keyConfig.key.trim()) return null;
                    return (
                      <Bar 
                        key={index}
                        dataKey={`key${index}`} 
                        name={keyConfig.label}
                        stackId="a"
                        fill={KEY_COLORS[index % KEY_COLORS.length]} 
                        radius={index === activeKeys.length - 1 ? [4, 4, 0, 0] : undefined}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
