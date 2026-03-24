import { Route } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const routingRules = [
  {
    tier: 'Qualified',
    score: '70-100',
    tag: 'qualified-investor',
    destination: '30-min Discovery Call',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
  },
  {
    tier: 'Borderline',
    score: '40-69',
    tag: 'needs-nurture',
    destination: '30-min Discovery Call',
    color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800',
  },
  {
    tier: 'Unqualified',
    score: '0-39',
    tag: 'non-accredited',
    destination: '30-min Discovery Call',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
  },
];

export function LeadRoutingSection() {
  return (
    <div className="border-t-2 border-border pt-6 mt-6">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Route className="w-3.5 h-3.5" /> Lead Routing Rules
      </h4>
      <Card className="border-border">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Score-based routing determines which calendar leads are sent to after quiz completion.
          </p>
          <div className="space-y-3">
            {routingRules.map((rule) => (
              <div key={rule.tier} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${rule.color}`}>
                  {rule.tier}
                </span>
                <div className="flex-1 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground text-[10px]">Score</p>
                    <p className="font-semibold">{rule.score}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">Tag</p>
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
  );
}
