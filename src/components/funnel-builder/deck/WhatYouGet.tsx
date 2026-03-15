import { motion } from 'framer-motion';
import { Megaphone, Filter, HeadphonesIcon } from 'lucide-react';

const deliverables = [
  {
    icon: Megaphone,
    title: 'Investor Acquisition Ads',
    items: ['Paid campaigns across Meta, LinkedIn & Google', 'Scroll-stopping creative & compliant copy', 'Weekly campaign optimization'],
  },
  {
    icon: Filter,
    title: 'Conversion Funnel',
    items: ['High-converting funnel with investor filters', 'Fully responsive design', 'Calendar integration + automation'],
  },
  {
    icon: HeadphonesIcon,
    title: 'Dedicated Team',
    items: ['Account Manager + Media Buyer', 'Funnel Specialist', 'Weekly strategy reviews'],
  },
];

export default function WhatYouGet() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="font-display text-3xl md:text-5xl font-bold text-center mb-12 text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          What You <span className="gradient-text">Get</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {deliverables.map((d, i) => (
            <motion.div
              key={d.title}
              className="glass-card rounded-2xl p-8 text-center group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <d.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-4">{d.title}</h3>
              <ul className="space-y-2 text-left">
                {d.items.map(item => (
                  <li key={item} className="text-muted-foreground text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
