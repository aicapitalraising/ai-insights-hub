import { motion } from 'framer-motion';
import { Target, Zap, Cpu, BarChart3 } from 'lucide-react';

const steps = [
  { step: 1, icon: Target, title: 'AI-Powered Investor Lead Generation', desc: 'Finding your ideal investors digitally through sophisticated targeting and "Investor Magnet" content.' },
  { step: 2, icon: Zap, title: 'High-Converting Investor Funnels', desc: 'Turning interest into engagement with landing pages and content designed for sophisticated investors.' },
  { step: 3, icon: Cpu, title: 'Marketing Automation (Investor Nurturing)', desc: 'Building relationships at scale through personalized, automated follow-up sequences.' },
  { step: 4, icon: BarChart3, title: 'Analytics & KPI Tracking', desc: 'Turning data into dollars by measuring, analyzing, and optimizing your entire system.' },
];

export default function FrameworkSection() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Your Blueprint: The 4-Step <span className="gradient-text">AI Framework</span> for Success
          </h2>
        </motion.div>
        <motion.p
          className="text-muted-foreground text-sm md:text-base max-w-3xl mx-auto text-center mb-14 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          The difference between sporadic fundraising wins and consistent, scalable capital inflow lies in a <strong className="text-foreground">systematic approach</strong>. This 4-step framework has been meticulously developed, tested, and refined across numerous funds and diverse investment types, consistently delivering results for raises ranging from $1 million to over $100 million.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              className="glass-card rounded-2xl p-8 group hover:border-primary/30 transition-all duration-500 hover:-translate-y-1"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <span className="font-display text-lg font-bold text-primary">{s.step}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold mb-2 text-foreground">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
