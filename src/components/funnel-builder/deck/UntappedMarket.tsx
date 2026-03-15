import { motion } from 'framer-motion';
import { Users, Wallet, UserX, Banknote, Mail } from 'lucide-react';

const stats = [
  { icon: Users, title: '19M+ Accredited Investors', lines: ['Over 19 million Americans qualify as accredited investors, representing roughly 7-8% of U.S. households.', 'Many are unaware they qualify or are underserved by traditional capital markets.'] },
  { icon: Wallet, title: '$75T+ in Investable Assets', lines: ['These investors collectively control over $75 trillion in investable assets.', 'The majority of this wealth is often not actively deployed into private funds, presenting a massive opportunity.'] },
];

const methods = [
  { icon: UserX, title: 'Referrals & Networking', desc: 'Slow, limited scale, and heavily dependent on existing connections.' },
  { icon: Banknote, title: 'Broker-Dealers', desc: 'Costly, with commissions often ranging from 5-10% of capital raised.' },
  { icon: Mail, title: 'Cold Outreach/Email', desc: 'Extremely low conversion rates, high risk of being flagged as spam.' },
];

export default function UntappedMarket() {
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
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            The Untapped Market: <span className="gradient-text">Unlocking Trillions</span> in Investor Capital
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.title}
              className="glass-card rounded-2xl p-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">{s.title}</h3>
              {s.lines.map((l, j) => (
                <p key={j} className="text-muted-foreground text-sm leading-relaxed mb-2">{l}</p>
              ))}
            </motion.div>
          ))}
        </div>

        <motion.h3
          className="font-display text-xl font-bold text-center mb-6 text-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Traditional Capital Raising: Unscalable, Opaque, and Costly
        </motion.h3>
        <div className="grid md:grid-cols-3 gap-4">
          {methods.map((m, i) => (
            <motion.div
              key={m.title}
              className="glass-card rounded-xl p-6 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-display font-bold text-sm text-foreground mb-1">{m.title}</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
