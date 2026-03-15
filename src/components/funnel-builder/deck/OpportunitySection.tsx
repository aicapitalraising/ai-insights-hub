import { motion } from 'framer-motion';
import { useScrollAnimation, useCountUp } from '@/hooks/useScrollAnimation';

export default function OpportunitySection() {
  const { ref, isVisible } = useScrollAnimation(0.2);
  const investorCount = useCountUp(19, 1800, isVisible);
  const assetCount = useCountUp(75, 1800, isVisible);

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          The Accredited Investor <span className="gradient-text">Opportunity</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            className="glass-card rounded-2xl p-10 text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-display text-5xl md:text-6xl font-bold gradient-text mb-2">{investorCount}M</p>
            <p className="font-display font-bold text-foreground mb-1">Accredited Investors</p>
            <p className="text-muted-foreground text-sm">A vast, underserved market of qualified capital.</p>
          </motion.div>
          <motion.div
            className="glass-card rounded-2xl p-10 text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="font-display text-5xl md:text-6xl font-bold gradient-text mb-2">${assetCount}T</p>
            <p className="font-display font-bold text-foreground mb-1">Investable Assets</p>
            <p className="text-muted-foreground text-sm">These investors control <strong>trillions</strong> in capital, eager for new opportunities.</p>
          </motion.div>
        </div>

        <motion.div
          className="max-w-3xl mx-auto space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p>There are over <strong className="text-foreground">19 million accredited investors</strong> in the United States alone. This represents an enormous, yet often untapped, market for capital.</p>
          <p>The majority of these high-net-worth individuals are currently underserved by traditional marketing methods, as most funds still rely on outdated approaches like referrals, cold emails, and broker networks. With the right digital strategy, you can directly reach, qualify, and secure meetings with these high-net-worth Limited Partners (LPs)—at scale.</p>
        </motion.div>
      </div>
    </section>
  );
}
