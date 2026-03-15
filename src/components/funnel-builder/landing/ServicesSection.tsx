import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Cpu, Target, Zap, Database, UserCheck, BarChart3 } from 'lucide-react';
import LeadEnrichmentCard from './LeadEnrichmentCard';
import AudienceBuilderCard from './AudienceBuilderCard';

const steps = [
  {
    step: 1,
    icon: Target,
    title: 'AI-Powered Investor Lead Generation',
    description: 'Finding your ideal investors digitally through sophisticated targeting and "Investor Magnet" content that attracts accredited investors at scale.',
  },
  {
    step: 2,
    icon: Zap,
    title: 'High-Converting Investor Funnels',
    description: 'Turning interest into engagement with landing pages and content designed specifically for sophisticated investors.',
  },
  {
    step: 3,
    icon: Cpu,
    title: 'Marketing Automation & Nurturing',
    description: 'Building relationships at scale through personalized, automated follow-up sequences that move investors toward commitment.',
  },
  {
    step: 4,
    icon: BarChart3,
    title: 'Analytics & KPI Tracking',
    description: 'Turning data into dollars by measuring, analyzing, and optimizing your entire investor acquisition system.',
  },
];

export default function ServicesSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="services" ref={ref} className="py-24 md:py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* 4-Step Framework */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            The 4-Step <span className="gradient-text">AI Framework</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A systematic approach that transforms sporadic fundraising into consistent, scalable capital inflow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="glass-card rounded-2xl p-8 md:p-10 group hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 relative"
              initial={{ opacity: 0, y: 60, scale: 0.92, rotateX: 8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              viewport={{ once: true, margin: '-50px', amount: 0.3 }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <span className="font-display text-lg font-bold text-primary">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Unique Value Props */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Our <span className="gradient-text">Unfair Advantage</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Proprietary data and technology that no other capital raising firm can offer.
          </p>
        </motion.div>

        {/* Database prop */}
        <motion.div
          className="glass-card rounded-2xl p-8 md:p-10 group hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 mb-6"
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-50px', amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                <Database className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-4 text-foreground">5M+ Accredited Investor Database</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">Leverage our proprietary database of 5 million accredited investors to supercharge your ad targeting—plus access our best-kept secret: a 5,000 funded investor list to scale your campaigns with proven buyers.</p>
            </div>
            <AudienceBuilderCard />
          </div>
        </motion.div>

        {/* Lead Enrichment prop + card side by side */}
        <motion.div
          className="glass-card rounded-2xl p-8 md:p-10 group hover:border-primary/30 transition-all duration-500 hover:-translate-y-1"
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-50px', amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                <UserCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-4 text-foreground">Instant Lead Enrichment</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">Every lead that enters your CRM is instantly enriched with net worth, income, investment history, and accreditation status—so your team only spends time on qualified prospects.</p>
            </div>
            <LeadEnrichmentCard />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
