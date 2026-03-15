import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

const timelineOptions = [
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '12 Months', months: 12 },
  { label: '24 Months', months: 24 },
];

export default function CapitalRaisingCalculator() {
  const [fundingGoal, setFundingGoal] = useState(10_000_000);
  const [costOfCapital, setCostOfCapital] = useState(2.5);
  const [closingPct, setClosingPct] = useState(10);
  const [avgInvestment, setAvgInvestment] = useState(100_000);
  const [timelineIdx, setTimelineIdx] = useState(1); // default 6 months

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
    <section className="py-16 md:py-20 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
            Calculate Your <span className="gradient-text">Raise</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            See exactly how much ad spend you need to hit your funding goal—and how it compares to broker fees.
          </p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid md:grid-cols-2">
            {/* Left – Inputs */}
            <div className="p-6 md:p-8 space-y-5">
              <SliderInput
                label="Funding Goal"
                display={fmt(fundingGoal)}
                value={fundingGoal}
                onChange={setFundingGoal}
                min={1_000_000} max={100_000_000} step={500_000}
                rangeLabel={['$1M', '$100M']}
                desc="Total amount to raise"
              />
              <SliderInput
                label="Cost of Capital"
                display={`${costOfCapital}%`}
                value={costOfCapital}
                onChange={setCostOfCapital}
                min={0.5} max={4} step={0.1}
                rangeLabel={['0.5%', '4%']}
                desc="Percentage of ad spend into investors (Average is 2.5%)"
              />
              <SliderInput
                label="Closing %"
                display={`${closingPct}%`}
                value={closingPct}
                onChange={setClosingPct}
                min={1} max={100} step={1}
                rangeLabel={['1%', '100%']}
              />
              <SliderInput
                label="Avg. Investor Investment"
                display={fmt(avgInvestment)}
                value={avgInvestment}
                onChange={setAvgInvestment}
                min={10_000} max={1_000_000} step={5_000}
                rangeLabel={['$10K', '$1M']}
              />
              {/* Timeline slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-display font-semibold text-foreground">Raise Timeline</label>
                  <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">{timelineOptions[timelineIdx].label}</span>
                </div>
                <Slider
                  value={[timelineIdx]}
                  onValueChange={v => setTimelineIdx(v[0])}
                  min={0} max={3} step={1}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  {timelineOptions.map(t => <span key={t.months}>{t.label}</span>)}
                </div>
              </div>
            </div>

            {/* Right – Results */}
            <div className="bg-[hsl(var(--card))] border-l border-border p-6 md:p-8 space-y-4">
              <ResultRow label="Ad Spend (Total)" value={fmt(calc.adSpend)} large />
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-semibold text-foreground">Calls Needed</span>
                <span className="text-sm font-bold text-foreground">{calc.calls.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-semibold text-foreground">Cost Per Call — KPI</span>
                <span className="text-sm font-bold text-foreground">{fmt(calc.costPerCall)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-semibold text-foreground">Investors Needed</span>
                <span className="text-sm font-bold text-foreground">{calc.investorsNeeded.toLocaleString()}</span>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-display font-semibold text-foreground">Ad Spend/mo ({timelineOptions[timelineIdx].label})</p>
                    <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{fmt(calc.adSpendPerMonth)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Daily</p>
                    <p className="text-sm font-display font-bold text-foreground">{fmt(calc.adSpendPerDay)}/day</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-display font-bold text-foreground text-center mb-2">VS — Broker Fees</p>
                <div className="space-y-1">
                  {calc.brokerFees.map(b => (
                    <div key={b.pct} className="flex justify-between text-xs">
                      <span className="font-display font-semibold text-foreground">Broker Fee {b.pct}%</span>
                      <span className="font-bold text-destructive">{fmt(b.fee)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SliderInput({ label, display, value, onChange, min, max, step, rangeLabel, desc }: {
  label: string; display: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; rangeLabel: [string, string]; desc?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-display font-semibold text-foreground">{label}</label>
        <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">{display}</span>
      </div>
      <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={step} />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
        <span>{rangeLabel[0]}</span><span>{rangeLabel[1]}</span>
      </div>
      {desc && <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  );
}

function ResultRow({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div>
      <p className="text-xs font-display font-semibold text-foreground">{label}</p>
      <p className={`${large ? 'text-2xl md:text-3xl' : 'text-lg'} font-display font-bold text-foreground`}>{value}</p>
    </div>
  );
}
