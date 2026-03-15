import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const logos = [
  'Real Estate Fund I', 'Oil & Gas Partners', 'Venture Capital LLC',
  'Private Equity Group', 'Multifamily Fund', 'Land Development Co',
  'Tech Growth Fund', 'Energy Partners LP', 'Capital Holdings',
  'Strategic Ventures',
];

export default function LogoTicker() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section ref={ref} className="py-16 border-y border-border overflow-hidden bg-muted/30">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        <p className="text-center text-xs tracking-[0.3em] uppercase text-muted-foreground mb-10">
          Trusted by Leading Investment Funds
        </p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-10" />
          <div className="flex animate-marquee whitespace-nowrap">
            {[...logos, ...logos].map((name, i) => (
              <div key={i} className="flex items-center mx-10">
                <div className="flex items-center gap-3 px-6 py-3 rounded-lg border border-border bg-background">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">{name.charAt(0)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
