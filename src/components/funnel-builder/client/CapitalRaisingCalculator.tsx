import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Users, PhoneCall, TrendingDown } from 'lucide-react';

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

const timelineOptions = [
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '12 Months', months: 12 },
  { label: '24 Months', months: 24 },
];

export default function ClientCapitalRaisingCalculator() {
  const [fundingGoal, setFundingGoal] = useState(10_000_000);
  const [costOfCapital, setCostOfCapital] = useState(2.5);
  const [closingPct, setClosingPct] = useState(10);
  const [avgInvestment, setAvgInvestment] = useState(100_000);
  const [timelineIdx, setTimelineIdx] = useState(1);

  const calc = useMemo(() => {
    const adSpend = fundingGoal * (costOfCapital / 100);
    const investorsNeeded = Math.ceil(fundingGoal / avgInvestment);
    const calls = Math.ceil(investorsNeeded / (closingPct / 100));
    const costPerCall = calls > 0 ? Math.round(adSpend / calls) : 0;
    const months = timelineOptions[timelineIdx].months;
    const adSpendPerMonth = Math.round(adSpend / months);
    const adSpendPerDay = Math.round(adSpend / (months * 30));
    const brokerFees = [5, 6, 7, 8, 9, 10].map(pct => ({
      pct,
      fee: fundingGoal * (pct / 100),
    }));
    return { adSpend, calls, costPerCall, investorsNeeded, adSpendPerMonth, adSpendPerDay, brokerFees, months };
  }, [fundingGoal, costOfCapital, closingPct, avgInvestment, timelineIdx]);

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid md:grid-cols-2">
        {/* Inputs */}
        <div className="p-6 md:p-8 space-y-5">
          <SliderRow
            label="Funding Goal"
            display={fmt(fundingGoal)}
            value={fundingGoal}
            onChange={setFundingGoal}
            min={1_000_000} max={100_000_000} step={500_000}
            range={['$1M', '$100M']}
            desc="Total amount to raise"
          />
          <SliderRow
            label="Cost of Capital"
            display={`${costOfCapital}%`}
            value={costOfCapital}
            onChange={setCostOfCapital}
            min={0.5} max={4} step={0.1}
            range={['0.5%', '4%']}
            desc="Percentage of ad spend into investors (Average is 2.5%)"
          />
          <SliderRow
            label="Closing %"
            display={`${closingPct}%`}
            value={closingPct}
            onChange={setClosingPct}
            min={1} max={100} step={1}
            range={['1%', '100%']}
          />
          <SliderRow
            label="Avg. Investor Investment"
            display={fmt(avgInvestment)}
            value={avgInvestment}
            onChange={setAvgInvestment}
            min={10_000} max={1_000_000} step={5_000}
            range={['$10K', '$1M']}
          />
          {/* Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-display font-semibold text-foreground">Raise Timeline</label>
              <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">{timelineOptions[timelineIdx].label}</span>
            </div>
            <Slider value={[timelineIdx]} onValueChange={v => setTimelineIdx(v[0])} min={0} max={3} step={1} />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              {timelineOptions.map(t => <span key={t.months}>{t.label}</span>)}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-muted/40 border-l border-border p-6 md:p-8 space-y-5">
          {/* Primary result */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-display">Ad Spend (Total)</p>
              <p className="text-2xl md:text-3xl font-display font-bold text-primary">{fmt(calc.adSpend)}</p>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3">
            <MetricBox icon={PhoneCall} label="Calls Needed" value={calc.calls.toLocaleString()} />
            <MetricBox icon={DollarSign} label="Cost/Call KPI" value={fmt(calc.costPerCall)} />
            <MetricBox icon={Users} label="Investors Needed" value={calc.investorsNeeded.toLocaleString()} />
          </div>

          {/* Monthly / Daily spend */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wide">Ad Spend / Month ({timelineOptions[timelineIdx].label})</p>
                <p className="text-2xl font-display font-bold text-foreground mt-0.5">{fmt(calc.adSpendPerMonth)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Daily</p>
                <p className="text-sm font-display font-bold text-foreground">{fmt(calc.adSpendPerDay)}/day</p>
              </div>
            </div>
          </div>

          {/* Broker comparison */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <p className="text-xs font-display font-bold text-foreground">VS — Broker Fees</p>
            </div>
            <div className="space-y-1.5">
              {calc.brokerFees.map(b => (
                <div key={b.pct} className="flex justify-between text-xs">
                  <span className="font-display font-medium text-muted-foreground">Broker Fee {b.pct}%</span>
                  <span className="font-bold text-destructive">{fmt(b.fee)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-center">
      <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
      <p className="text-[10px] text-muted-foreground font-display">{label}</p>
      <p className="text-sm font-display font-bold text-foreground">{value}</p>
    </div>
  );
}

function SliderRow({ label, display, value, onChange, min, max, step, range, desc }: {
  label: string; display: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; range: [string, string]; desc?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-display font-semibold text-foreground">{label}</label>
        <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">{display}</span>
      </div>
      <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={step} />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{range[0]}</span><span>{range[1]}</span>
      </div>
      {desc && <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  );
}
