import { useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';

export default function ContactSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" ref={ref} className="py-24 md:py-32 border-t border-border relative bg-muted/20">
      <div className="max-w-3xl mx-auto px-6 relative">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Let's Talk About{' '}
            <span className="gradient-text">What Comes Next</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Tell us about your fund and we'll show you how AI can accelerate your raise.
          </p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-8 md:p-12"
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <ArrowRight className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3 text-foreground">We'll Be In Touch</h3>
              <p className="text-muted-foreground">Our team will reach out within 24 hours to discuss your capital raising goals.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Full Name</label>
                  <Input placeholder="John Smith" className="bg-background border-border h-12" required />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Email</label>
                  <Input type="email" placeholder="john@fund.com" className="bg-background border-border h-12" required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Phone</label>
                  <Input type="tel" placeholder="+1 (555) 000-0000" className="bg-background border-border h-12" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">How Much Do You Want To Raise?</label>
                  <Select>
                    <SelectTrigger className="bg-background border-border h-12">
                      <SelectValue placeholder="Select amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-10">$5M – $10M</SelectItem>
                      <SelectItem value="10-25">$10M – $25M</SelectItem>
                      <SelectItem value="25-50">$25M – $50M</SelectItem>
                      <SelectItem value="50-100">$50M – $100M</SelectItem>
                      <SelectItem value="100-200">$100M – $200M</SelectItem>
                      <SelectItem value="200+">$200M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Tell us about your fund</label>
                <Textarea placeholder="Brief description of your fund, asset class, and current raise status..." className="bg-background border-border min-h-[100px]" />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-300 hover:shadow-lg"
              >
                Submit Inquiry
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By submitting this form, you agree to our Terms of Service and Privacy Policy. We will never share your information with third parties.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
