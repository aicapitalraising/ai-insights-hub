import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const transactions = [
  {
    type: 'REAL ESTATE FUND',
    adSpend: '$290K Ad Spend',
    description: 'Deployed $290K in ad spend to generate $10M in committed capital through AI-powered accredited investor acquisition.',
    raised: '$10M',
    timeline: '90 Days',
  },
  {
    type: 'REAL ESTATE FUND',
    adSpend: '$120K Ad Spend',
    description: 'Rapid capital deployment through pre-qualified investor pipeline and targeted digital acquisition.',
    raised: '$5M',
    timeline: '31 Days',
  },
  {
    type: 'OIL & GAS FUND',
    description: 'From zero to fully funded using AI-powered accredited investor funnels.',
    raised: '$3.2M',
    timeline: '135 Days',
  },
  {
    type: 'LAND DEVELOPMENT FUND',
    description: 'Scaled from $2M seed to full allocation through targeted digital acquisition.',
    raised: '$10.5M',
    timeline: '8 Months',
  },
  {
    type: 'SINGLE FAMILY FUND',
    description: 'Rapid capital deployment through pre-qualified investor pipeline.',
    raised: '$850K',
    timeline: '7 Days',
  },
  {
    type: 'PRIVATE EQUITY FUND',
    description: 'Built a recurring investor acquisition engine for ongoing capital raises.',
    raised: '$22M',
    timeline: '14 Months',
  },
];

const scorecards = [
  { title: 'Example #1: Land Fund', img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/ce7184329fd149199dab6dacdf3f9711/original/Screenshot-2025-05-08-at-8.16.52-AM.png' },
  { title: 'Example #2: Oil & Gas Fund', img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/335a972491bc4eab92cf75af02e7ea17/original/Screenshot-2025-06-18-at-1.19.26-PM.png' },
  { title: 'Example #3: Real Estate Fund', img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/828d500749f94daabd993f6789c9af14/original/Screenshot-2025-06-18-at-1.23.00-PM.png' },
];

export default function CaseStudies() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-primary font-display font-semibold text-sm uppercase tracking-wider mb-3">Proven Results</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Recent <span className="gradient-text">Transactions</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mt-4">
            Real results from real funds. Here's what AI-powered capital raising looks like.
          </p>
        </motion.div>

        {/* Transaction cards */}
        <div className="space-y-4">
          {transactions.map((t, i) => (
            <motion.div
              key={`${t.type}-${i}`}
              className="rounded-xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 hover:border-primary/20 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
            >
              {/* Left: info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.type}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  {t.adSpend && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{t.adSpend}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
              </div>

              {/* Right: stats */}
              <div className="flex items-center gap-8 shrink-0">
                <div className="text-center">
                  <p className="font-display text-2xl md:text-3xl font-bold text-primary">{t.raised}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Raised</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl md:text-3xl font-bold text-foreground">{t.timeline}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Timeline</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scorecard Screenshots */}
        <motion.h3
          className="font-display text-2xl font-bold text-center mt-16 mb-8 text-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Real Numbers: Ad Spend to <span className="gradient-text">Funded Investor</span>
        </motion.h3>
        <div className="space-y-6">
          {scorecards.map((sc, i) => (
            <motion.div
              key={sc.title}
              className="glass-card rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <div className="p-4 border-b border-border">
                <h4 className="font-display font-bold text-foreground">{sc.title}</h4>
              </div>
              <img src={sc.img} alt={sc.title} className="w-full" loading="lazy" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
