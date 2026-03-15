import { motion } from 'framer-motion';
import logo from '@/assets/logo-aicra.png';

export default function DeckHero() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center py-20 px-6">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src={logo} alt="AI Capital Raising Accelerator" className="h-14 mx-auto mb-12" />
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 text-foreground">
          Raise $5M–$100M From Accredited Investors{' '}
          <span className="gradient-text">Without Relying On Network, Events, Or Broker Fees.</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
          Our proven system helps you flip the script and have qualified investors lining up to hear about your opportunity.
        </p>
      </motion.div>
    </section>
  );
}
