import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { X, Check, AlertTriangle, Rocket } from 'lucide-react';

const traditional = [
  'Expensive conferences, events & roadshows',
  'Friends & family referrals—not scalable',
  'Cold calling & outdated broker networks',
  'No visibility into investor pipeline',
  'Months of relationship building before first meeting',
  'High cost of capital (5–8%+ in fees)',
];

const aiPowered = [
  'AI-targeted digital ads that find accredited investors',
  'Scalable lead gen from 5M+ investor database',
  'Automated funnels that pre-qualify investors 24/7',
  'Real-time CRM with enriched investor profiles',
  'Investors come to you—warm & pre-qualified',
  'Avg. 2.46% cost of capital',
];

export default function ComparisonSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section ref={ref} className="py-24 md:py-32 border-t border-border relative overflow-hidden">
      {/* Subtle luxury gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Why Funds Are <span className="gradient-text">Making the Switch</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            The old playbook is broken. See how AI-powered capital raising compares.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Traditional */}
          <motion.div
            className="rounded-2xl border border-destructive/20 bg-destructive/[0.02] p-8 md:p-10 relative overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/[0.04] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Traditional Capital Raising</h3>
                <p className="text-sm text-muted-foreground">The old way—slow, expensive, unscalable</p>
              </div>
            </div>
            <ul className="space-y-4">
              {traditional.map((item, i) => (
                <motion.li
                  key={item}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                >
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3 h-3 text-destructive" />
                  </div>
                  <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* AI-Powered */}
          <motion.div
            className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-8 md:p-10 relative overflow-hidden shadow-sm"
            initial={{ opacity: 0, x: 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.06] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-primary/[0.04] rounded-full blur-xl" />
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">AI Capital Raising</h3>
                <p className="text-sm text-muted-foreground">The new standard—fast, scalable, data-driven</p>
              </div>
            </div>
            <ul className="space-y-4">
              {aiPowered.map((item, i) => (
                <motion.li
                  key={item}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground text-sm leading-relaxed font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
