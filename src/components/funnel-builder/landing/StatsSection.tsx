import { motion } from 'framer-motion';
import { useScrollAnimation, useCountUp } from '@/hooks/useScrollAnimation';

const stats = [
  { value: 600, suffix: 'M+', prefix: '$', label: 'Capital Raised', decimals: 0 },
  { value: 2.46, suffix: '%', prefix: '', label: 'Avg. Conversion Rate', decimals: 2 },
  { value: 3.2, suffix: 'M', prefix: '$', label: 'Avg. Fund Raise', decimals: 1 },
  { value: 47, suffix: '+', prefix: '', label: 'Funds Served', decimals: 0 },
];

function StatCard({ stat, index, isVisible }: { stat: typeof stats[0]; index: number; isVisible: boolean }) {
  const count = useCountUp(stat.value, 2500, isVisible, stat.decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl p-8 text-center group hover:border-primary/30 transition-colors duration-500"
    >
      <div className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
        {stat.prefix}{count}{stat.suffix}
      </div>
      <div className="text-sm text-muted-foreground tracking-wide uppercase">{stat.label}</div>
    </motion.div>
  );
}

export default function StatsSection() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section id="track-record" ref={ref} className="py-24 md:py-32 relative">
      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.p
          className="text-center text-sm text-muted-foreground mb-16 tracking-wide"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          As you read this, the numbers are rising.
        </motion.p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
