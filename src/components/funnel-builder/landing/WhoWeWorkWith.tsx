import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { Building2, Fuel, TrendingUp, Landmark, Home, Leaf } from 'lucide-react';

const categories = [
  { icon: Building2, label: 'Real Estate Funds' },
  { icon: Fuel, label: 'Oil & Gas' },
  { icon: TrendingUp, label: 'Private Equity' },
  { icon: Landmark, label: 'Venture Capital' },
  { icon: Home, label: 'Multifamily' },
  { icon: Leaf, label: 'Land Development' },
];

export default function WhoWeWorkWith() {
  const { ref, isVisible } = useScrollAnimation(0.15);

  return (
    <section ref={ref} className="py-24 md:py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.h2
              className="font-display text-3xl md:text-5xl font-bold mb-6 leading-tight text-foreground"
              initial={{ opacity: 0, x: -40 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              Built for Funds That Are{' '}
              <span className="gradient-text">Ready to Scale</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-lg mb-8 leading-relaxed"
              initial={{ opacity: 0, x: -30 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              We work with fund managers who have a minimum of{' '}
              <span className="text-primary font-semibold">$5M in committed capital</span>{' '}
              and are ready to deploy AI-powered investor acquisition at scale.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                size="lg"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              >
                See If You Qualify
              </Button>
            </motion.div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                className="glass-card rounded-xl p-6 text-center group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * i }}
              >
                <cat.icon className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
