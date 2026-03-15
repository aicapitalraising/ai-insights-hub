import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export default function ClientInvestmentCalculator() {
  const [initial, setInitial] = useState(100_000);
  const [annualReturn, setAnnualReturn] = useState(15);
  const [years, setYears] = useState(5);

  const calc = useMemo(() => {
    const futureValue = initial * Math.pow(1 + annualReturn / 100, years);
    const totalProfit = futureValue - initial;
    return { futureValue, totalProfit };
  }, [initial, annualReturn, years]);

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid md:grid-cols-2">
        {/* Inputs */}
        <div className="p-6 md:p-8 space-y-6">
          <SliderRow
            label="Initial Investment"
            display={fmt(initial)}
            value={initial}
            onChange={setInitial}
            min={10_000} max={5_000_000} step={10_000}
            range={['$10K', '$5M']}
            desc="The starting amount of your investment."
          />
          <SliderRow
            label="Targeted Annual Return"
            display={`${annualReturn}%`}
            value={annualReturn}
            onChange={setAnnualReturn}
            min={1} max={50} step={0.5}
            range={['1%', '50%']}
            desc="The annual interest rate (percentage)."
          />
          <SliderRow
            label="Investment Duration"
            display={`${years} year${years > 1 ? 's' : ''}`}
            value={years}
            onChange={setYears}
            min={1} max={30} step={1}
            range={['1 year', '30 years']}
            desc="The number of years you plan to invest."
          />
        </div>

        {/* Results */}
        <div className="bg-muted/40 border-l border-border p-6 md:p-8 flex flex-col justify-center space-y-6">
          <ResultCard
            icon={TrendingUp}
            label="Future Investment Value"
            value={fmt(calc.futureValue)}
            accent
          />
          <ResultCard
            icon={DollarSign}
            label="Total Contributions"
            value={fmt(initial)}
          />
          <ResultCard
            icon={Percent}
            label="Total Profit Earned"
            value={fmt(calc.totalProfit)}
            accent
          />
        </div>
      </div>
    </motion.div>
  );
}

function ResultCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent ? 'bg-primary/10' : 'bg-muted'}`}>
        <Icon className={`w-5 h-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-display">{label}</p>
        <p className={`text-xl md:text-2xl font-display font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      </div>
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
