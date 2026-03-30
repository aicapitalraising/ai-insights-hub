import { Client } from '@/hooks/useClients';
import { ClientMRRSettings, calculateClientRevenue } from '@/hooks/useClientMRR';
import { ClientSettings, getEffectiveMonthlyTarget } from '@/hooks/useClientSettings';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Pause, DollarSign, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgencyStatsBarProps {
  clients: Client[];
  clientMRRSettings: Record<string, ClientMRRSettings>;
  clientAdSpends: Record<string, number>;
  clientFullSettings?: Record<string, ClientSettings>;
  isAdmin?: boolean;
}

export function AgencyStatsBar({ 
  clients, 
  clientMRRSettings,
  clientAdSpends,
  clientFullSettings = {},
  isAdmin = false,
}: AgencyStatsBarProps) {
  const activeClients = clients.filter(c => c.status === 'active').length;
  const onboardingClients = clients.filter(c => c.status === 'onboarding').length;
  const pausedClients = clients.filter(c => c.status === 'paused' || c.status === 'on_hold').length;
  const inactiveClients = clients.filter(c => c.status === 'inactive').length;

  const activeClientsForRevenue = clients.filter(c => c.status === 'active');

  let totalMRR = 0;
  for (const client of activeClientsForRevenue) {
    const settings = clientMRRSettings[client.id] || {
      mrr: 0,
      ad_spend_fee_threshold: 30000,
      ad_spend_fee_percent: 10,
    };
    const adSpend = clientAdSpends[client.id] || 0;
    totalMRR += calculateClientRevenue(
      settings.mrr,
      adSpend,
      settings.ad_spend_fee_threshold,
      settings.ad_spend_fee_percent
    );
  }

  let estimatedMonthlyRevenue = 0;
  for (const client of activeClientsForRevenue) {
    const fullSettings = clientFullSettings[client.id];
    if (fullSettings) {
      const monthlyTarget = getEffectiveMonthlyTarget(fullSettings);
      estimatedMonthlyRevenue += calculateClientRevenue(
        fullSettings.mrr || 0,
        monthlyTarget,
        fullSettings.ad_spend_fee_threshold || 30000,
        fullSettings.ad_spend_fee_percent || 10
      );
    }
  }

  const projectedAnnual = estimatedMonthlyRevenue * 12;

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="mb-4">
      {/* Status Cards Row */}
      <div className={cn(
        "grid gap-3 mb-3",
        isAdmin ? "grid-cols-3 lg:grid-cols-7" : "grid-cols-2 lg:grid-cols-4"
      )}>
        {/* Active */}
        <Card className="border border-chart-2/20 bg-chart-2/5">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{activeClients}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Active Clients</p>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding */}
        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{onboardingClients}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Onboarding</p>
            </div>
          </CardContent>
        </Card>

        {/* Paused */}
        <Card className="border border-border">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Pause className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{pausedClients}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">On Hold / Paused</p>
            </div>
          </CardContent>
        </Card>

        {/* Inactive - show only if there are any */}
        {inactiveClients > 0 && (
          <Card className="border border-destructive/20 bg-destructive/5">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums leading-none text-destructive">{inactiveClients}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Inactive</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue stats — admin only */}
        {isAdmin && (
          <>
            {/* Current MRR */}
            <Card className="border border-chart-2/20 bg-gradient-to-br from-chart-2/5 to-transparent">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums leading-none">{formatCurrency(totalMRR)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Current MRR</p>
                </div>
              </CardContent>
            </Card>

            {/* Est. Monthly Rev */}
            <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums leading-none">{formatCurrency(estimatedMonthlyRevenue)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Est. Monthly Rev</p>
                </div>
              </CardContent>
            </Card>

            {/* Projected Annual */}
            <Card className="border border-chart-2/20 bg-gradient-to-br from-chart-2/5 to-transparent">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums leading-none">{formatCurrency(projectedAnnual)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Projected Annual</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
