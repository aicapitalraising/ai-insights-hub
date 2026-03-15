import { motion } from 'framer-motion';
import { CreditCard, Repeat, Calendar, Rocket } from 'lucide-react';

const steps = [
  {
    icon: CreditCard,
    step: 1,
    title: 'Initial Investment',
    content: (
      <>
        <p className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">$15,000 <span className="text-base font-normal text-muted-foreground">one-time setup fee</span></p>
        <p className="text-muted-foreground text-sm leading-relaxed">This covers the initial costs of getting your fundraising system up and running using our proven AI-powered framework. By leveraging our cutting-edge technology and proven strategies, you'll be able to raise $5M to $100M from accredited investors — without relying on your personal network, hosting events, or paying broker fees.</p>
      </>
    ),
  },
  {
    icon: Repeat,
    step: 2,
    title: 'Monthly Management',
    content: (
      <>
        <p className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">$5,000<span className="text-base font-normal text-muted-foreground">/month</span> <span className="text-lg md:text-xl font-normal text-muted-foreground">($60,000/year)</span></p>
        <p className="text-lg md:text-xl font-display font-semibold text-muted-foreground mb-4">+ 10% of ad-spend above $35K/month</p>
        <div className="grid grid-cols-2 gap-2">
          {['Paid Media Buyer Ads', 'Graphic Designer / Video Edits', 'Funnel A/B Testing', 'SMS Nurture Sequences', 'Email Nurture Sequences', 'AI Setter', 'AI Caller', 'AI Videos', 'AI Sales Review'].map(item => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-primary text-xs">✓</span>
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    icon: Rocket,
    step: 3,
    title: 'Implementation Process',
    content: (
      <>
        <p className="mb-2"><strong className="text-foreground">You:</strong> Pay Deposit, Fill Out Onboarding Form, Share content / assets, Give Ad Account access, Join group chat.</p>
        <p><strong className="text-foreground">Us:</strong> Research, funnel creation, creative development, copywriting, approval, and launch.</p>
      </>
    ),
  },
];

export default function InvestmentSteps() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="font-display text-3xl md:text-5xl font-bold text-center mb-12 text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Investment & <span className="gradient-text">Next Steps</span>
        </motion.h2>

        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              className="glass-card rounded-2xl p-8 md:p-10"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-lg font-bold text-primary">{s.step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">{s.title}</h3>
                  <div className="text-muted-foreground text-sm leading-relaxed">{s.content}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
