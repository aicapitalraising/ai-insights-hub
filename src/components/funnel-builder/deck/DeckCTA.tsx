import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Check } from 'lucide-react';
import logo from '@/assets/logo-aicra.png';

const timelineSteps = [
  { label: 'Proposal', active: true },
  { label: 'Onboarding', active: false },
  { label: 'Access', active: false },
  { label: 'Kickoff Call', active: false },
];

export default function DeckCTA() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', raiseAmount: 10_000_000 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `https://aicapitalraising.com/#contact?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}`;
  };

  return (
    <section className="py-24 md:py-32 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <img src={logo} alt="AI Capital Raising Accelerator" className="h-12 mx-auto mb-8" />
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to <span className="gradient-text">Raise Capital</span> at Scale?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Fill out your details below and we'll send you a contract to get started.
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          className="glass-card rounded-2xl p-6 md:p-8 mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-5 text-center">Next Steps</p>
          <div className="relative flex items-center justify-between">
            {/* Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            <div className="absolute top-4 left-0 w-[8%] h-0.5 bg-primary" />

            {timelineSteps.map((step, i) => (
              <div key={step.label} className="relative flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.active
                    ? 'bg-primary shadow-[0_0_12px_4px_hsl(var(--primary)/0.4)] animate-pulse'
                    : 'bg-muted border-2 border-border'
                }`}>
                  {step.active ? (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <span className={`mt-2 text-xs font-display font-semibold ${step.active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-8 md:p-10 space-y-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-display font-semibold text-foreground mb-1.5 block">Company</label>
              <Input
                placeholder="Your company name"
                value={formData.company}
                onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-display font-semibold text-foreground mb-1.5 block">Full Name</label>
              <Input
                placeholder="Your full name"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-display font-semibold text-foreground">How much are you looking to raise?</label>
              <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">{'$' + formData.raiseAmount.toLocaleString('en-US')}</span>
            </div>
            <Slider
              value={[formData.raiseAmount]}
              onValueChange={v => setFormData(p => ({ ...p, raiseAmount: v[0] }))}
              min={5_000_000}
              max={100_000_000}
              step={500_000}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>$5M</span><span>$100M</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-display font-semibold text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-display font-semibold text-foreground mb-1.5 block">Phone Number</label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                required
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full text-base py-6 rounded-full mt-2">
            Send Me a Contract <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.form>
      </div>
    </section>
  );
}
