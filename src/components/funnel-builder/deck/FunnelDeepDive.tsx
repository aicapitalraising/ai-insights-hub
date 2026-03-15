import { motion } from 'framer-motion';
import { GraduationCap, Clock, ShieldCheck, Lock } from 'lucide-react';

const psychology = [
  { icon: GraduationCap, title: 'Sophisticated', desc: "They've likely seen hundreds, if not thousands, of investment pitches and can quickly discern hype from substance." },
  { icon: Clock, title: 'Time-Conscious', desc: 'Their time is their most valuable asset. Your process must be efficient and respectful of it.' },
  { icon: ShieldCheck, title: 'Risk-Aware', desc: 'While seeking returns, capital preservation is often a primary concern.' },
  { icon: Lock, title: 'Seeking Exclusivity & Trust', desc: 'They value unique opportunities and need to establish a high degree of trust before committing capital.' },
];

export default function FunnelDeepDive() {
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
          <p className="text-primary font-display font-semibold text-sm uppercase tracking-wider mb-3">Step 2</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            High-Converting Investor <span className="gradient-text">Funnels</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Generating a lead is only the first checkpoint. The real art lies in effectively converting that initial flicker of interest into meaningful engagement and, ultimately, a committed investor.
          </p>
        </motion.div>

        {/* Psychology cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {psychology.map((p, i) => (
            <motion.div
              key={p.title}
              className="glass-card rounded-xl p-6 group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Funnel Screenshots */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-display font-bold text-foreground mb-3">Example Opt-In Page</h3>
            <div className="glass-card rounded-xl overflow-hidden">
              <img
                src="https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/e8c4a9ecaa134e6c8ca59e0f0fba96a7/original/screencapture-go-krohexploration-investment-info-2025-06-18-22_02_29.png"
                alt="Example opt-in page"
                className="w-full"
                loading="lazy"
              />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['Optimized Headline', 'VSL (Pitch Deck)', 'Book Discovery Call'].map(t => (
                <span key={t} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="font-display font-bold text-foreground mb-3">Example Thank You Page</h3>
            <div className="glass-card rounded-xl overflow-hidden">
              <img
                src="https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/a011f6e4d6164dca99fb2812c0f5eb01/original/screencapture-invest-luxelivinghomes-net-thank-you-faqs-2025-06-19-12_44_19.jpg"
                alt="Example thank you page"
                className="w-full"
                loading="lazy"
              />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['VSL & Pitch Deck', 'Track Record', 'FAQ Videos'].map(t => (
                <span key={t} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
