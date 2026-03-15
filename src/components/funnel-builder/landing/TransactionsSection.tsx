import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ArrowRight } from 'lucide-react';

const transactions = [
  {
    type: 'Real Estate Fund',
    amount: '$10M',
    timeline: '90 Days',
    detail: 'Deployed $290K in ad spend to generate $10M in committed capital through AI-powered accredited investor acquisition.',
    highlight: '$290K Ad Spend',
    costOfCapital: '2.9%',
  },
  {
    type: 'Real Estate Fund',
    amount: '$5M',
    timeline: '31 Days',
    detail: 'Rapid capital deployment through pre-qualified investor pipeline and targeted digital acquisition.',
    highlight: '$120K Ad Spend',
    costOfCapital: '2.4%',
  },
  {
    type: 'Oil & Gas Fund',
    amount: '$3.2M',
    timeline: '135 Days',
    detail: 'From zero to fully funded using AI-powered accredited investor funnels.',
  },
  {
    type: 'Land Development Fund',
    amount: '$10.5M',
    timeline: '8 Months',
    detail: 'Scaled from $2M seed to full allocation through targeted digital acquisition.',
  },
  {
    type: 'Single Family Fund',
    amount: '$850K',
    timeline: '7 Days',
    detail: 'Rapid capital deployment through pre-qualified investor pipeline.',
  },
  {
    type: 'Private Equity Fund',
    amount: '$22M',
    timeline: '14 Months',
    detail: 'Built a recurring investor acquisition engine for ongoing capital raises.',
  },
];

export default function TransactionsSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="transactions" ref={ref} className="py-24 md:py-32 border-t border-border relative bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Recent <span className="gradient-text">Transactions</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real results from real funds. Here's what AI-powered capital raising looks like.
          </p>
        </motion.div>

        <div className="space-y-6">
          {transactions.map((tx, i) => (
            <motion.div
              key={`${tx.type}-${tx.amount}`}
              className="glass-card rounded-2xl p-8 md:p-10 group hover:border-primary/30 transition-all duration-500"
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs tracking-widest uppercase text-muted-foreground">{tx.type}</span>
                    <ArrowRight className="w-3 h-3 text-primary" />
                    {tx.highlight && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{tx.highlight}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{tx.detail}</p>
                </div>
                <div className="flex gap-8 md:gap-12 shrink-0">
                  <div className="text-center">
                    <div className="font-display text-3xl md:text-4xl font-bold text-primary">{tx.amount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Raised</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-3xl md:text-4xl font-bold text-foreground">{tx.timeline}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Timeline</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
