import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const roles = [
  { role: 'Marketing Manager', salary: '$97,500', limitation: 'No media buying or funnel skills' },
  { role: 'Copywriter', salary: '$70,000', limitation: 'No ad strategy' },
  { role: 'Funnel Builder', salary: '$85,000', limitation: 'Not conversion-optimized' },
  { role: 'Media Buyer', salary: '$80,000', limitation: 'Limited compliance experience' },
  { role: 'Sales Appointment Setter', salary: '$50,000 + Commission', limitation: 'No automation, AI, or LP strategy' },
];

const benefits = [
  'Investor acquisition ads',
  'AI nurturing + scheduling',
  'LP qualification funnel',
  'Weekly campaign optimization',
  'Fraction of the cost',
  'No long-term commitments',
  'Proven fund results ($500M+ raised)',
];

export default function CostComparison() {
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
            We Replace an Entire Marketing Team—<span className="gradient-text">for Less Than One Salary.</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Building an in-house team to achieve the same results can be expensive, fragmented, and slow.
          </p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl overflow-hidden mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display font-bold text-foreground">Role</th>
                  <th className="text-left p-4 font-display font-bold text-foreground">Annual Cost</th>
                  <th className="text-left p-4 font-display font-bold text-foreground">Limitation</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.role} className="border-b border-border/50">
                    <td className="p-4 text-foreground font-medium">{r.role}</td>
                    <td className="p-4 text-muted-foreground">{r.salary}</td>
                    <td className="p-4 text-muted-foreground">{r.limitation}</td>
                  </tr>
                ))}
                <tr className="bg-primary/5">
                  <td className="p-4 font-display font-bold text-foreground">Total</td>
                  <td className="p-4 font-display font-bold text-foreground">$382,500+</td>
                  <td className="p-4 font-bold text-destructive">Fragmented, slow, & expensive</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground p-4 border-t border-border">*USA Based Team, Doesn't Include Payroll etc</p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-8 border-primary/20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h3 className="font-display text-lg font-bold text-foreground mb-4">✅ Us: One expert team delivers all this and more:</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {benefits.map(b => (
              <div key={b} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
