import { motion } from 'framer-motion';
import { Network, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const challenges = [
  { icon: Network, title: 'Limited Networks', desc: 'Traditional methods rely on personal connections that quickly exhaust. Your rolodex has a ceiling.' },
  { icon: Clock, title: 'Time Intensive', desc: 'Events, roadshows, and introductions consume months of time and hundreds of thousands in cash.' },
  { icon: TrendingUp, title: 'Hard to Scale', desc: 'Referrals and personal networks are unpredictable, inconsistent, and impossible to scale.' },
  { icon: AlertCircle, title: 'Missed Potential', desc: "You're leaving millions on the table. There are 19M+ accredited investors you're not reaching." },
];

export default function ChallengeSection() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="font-display text-3xl md:text-5xl font-bold mb-12 text-center text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          The Capital Raising <span className="gradient-text">Challenge</span>
        </motion.h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {challenges.map((c, i) => (
            <motion.div
              key={c.title}
              className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-8 md:p-10 relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/[0.05] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-5">
                <c.icon className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="font-display text-xl font-bold text-destructive mb-2">{c.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
