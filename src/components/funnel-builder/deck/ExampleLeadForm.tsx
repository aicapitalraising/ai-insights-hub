import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ExampleLeadForm() {
  return (
    <motion.div
      className="glass-card rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div className="p-3 border-b border-border">
        <p className="text-[10px] font-display font-semibold text-primary uppercase tracking-wider">Example Lead Qualification Form</p>
      </div>

      <div className="p-5 space-y-4">
        <div className="text-center mb-2">
          <h4 className="font-display font-bold text-foreground text-sm">Schedule Your Discovery Call</h4>
          <p className="text-[10px] text-muted-foreground mt-1">Tell us about your investment goals</p>
        </div>

        {/* Name + Email row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Full Name</Label>
            <Input className="h-8 text-xs bg-background/50" placeholder="John Smith" readOnly tabIndex={-1} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Email</Label>
            <Input className="h-8 text-xs bg-background/50" placeholder="john@example.com" readOnly tabIndex={-1} />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Phone Number</Label>
          <Input className="h-8 text-xs bg-background/50" placeholder="(555) 123-4567" readOnly tabIndex={-1} />
        </div>

        {/* Accreditation */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Accredited Investor Status</Label>
          <div className="h-8 rounded-md border border-input bg-background/50 px-3 flex items-center justify-between text-xs text-foreground">
            <span>Yes — $1M+ Net Worth</span>
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <div className="mt-1 space-y-0.5 pl-1">
            <p className="text-[9px] text-muted-foreground/60">• Yes — $200K+ Annual Income</p>
            <p className="text-[9px] text-muted-foreground/60">• Not Sure / Need Guidance</p>
          </div>
        </div>

        {/* Liquidity */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Available Liquidity</Label>
          <div className="h-8 rounded-md border border-input bg-background/50 px-3 flex items-center justify-between text-xs text-foreground">
            <span>$250K — $500K</span>
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <div className="mt-1 space-y-0.5 pl-1">
            <p className="text-[9px] text-muted-foreground/60">• $50K — $100K</p>
            <p className="text-[9px] text-muted-foreground/60">• $100K — $250K</p>
            <p className="text-[9px] text-muted-foreground/60">• $500K+</p>
          </div>
        </div>

        {/* Investment Timeline */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Investment Timeline</Label>
          <div className="h-8 rounded-md border border-input bg-background/50 px-3 flex items-center justify-between text-xs text-foreground">
            <span>Within 30 days</span>
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary text-primary-foreground text-center text-xs font-display font-bold py-2.5 rounded-lg mt-2">
          Book My Discovery Call →
        </div>
      </div>
    </motion.div>
  );
}
