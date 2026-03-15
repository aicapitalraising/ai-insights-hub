import { useState } from 'react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo-aicra.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign,
  ArrowRight,
  Shield,
  CheckCircle2,
  CreditCard,
  Building2,
  Loader2,
  Landmark,
} from 'lucide-react';
import { toast } from 'sonner';

const presetAmounts = [15000, 25000];

type PaymentMethod = 'card' | 'ach';

export default function Invest() {
  const [amount, setAmount] = useState<number>(15000);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  const baseAmount = isCustom ? Number(customAmount) || 0 : amount;
  const processingFee = paymentMethod === 'card' ? Math.round(baseAmount * 0.03 * 100) / 100 : 0;
  const displayAmount = baseAmount + processingFee;
  const isValid = baseAmount >= 1 && Boolean(name.trim()) && Boolean(email.trim());

  const handlePay = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          baseAmount: Math.round(baseAmount * 100), // convert to cents
          paymentMethod,
          name,
          email,
          phone,
          companyName,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-center">
          <a href="/">
            <img src={logo} alt="AI Capital Raising" className="h-8" />
          </a>
        </div>
      </header>

      <div className="flex-1 px-6 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              <Shield className="w-3.5 h-3.5" /> Secure Payment
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Invest in Your <span className="gradient-text">Capital Raise</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Complete your setup payment to get started with the AI Capital Raising Accelerator program.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Left: Form */}
            <motion.div
              className="md:col-span-3 space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Amount selector */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Select Amount
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setAmount(preset);
                        setIsCustom(false);
                      }}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                        !isCustom && amount === preset
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-foreground hover:border-primary/40'
                      }`}
                    >
                      ${preset.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCustom(true)}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                      isCustom
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-foreground hover:border-primary/40'
                    }`}
                  >
                    Custom
                  </button>
                  {isCustom && (
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <Input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="pl-7"
                        min={1}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Payment method */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Payment Method
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">Credit Card</p>
                    <p className="text-xs text-muted-foreground">+3% processing fee</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ach')}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      paymentMethod === 'ach'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-primary" /> ACH Bank Transfer
                    </p>
                    <p className="text-xs text-muted-foreground">No processing fee</p>
                  </button>
                </div>
              </div>

              {/* Contact details */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Your Details
                </h3>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Full Name <span className="text-destructive">*</span>
                      </label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Email <span className="text-destructive">*</span>
                      </label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@acmecapital.com" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Phone</label>
                      <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Company / Fund</label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Capital" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <Button
                size="lg"
                className="w-full font-semibold gap-2 text-base py-6"
                disabled={!isValid || loading}
                onClick={handlePay}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ${displayAmount.toLocaleString()} & Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>

            {/* Right: Summary */}
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
                <h3 className="font-display text-sm font-semibold text-foreground mb-4">What You Get</h3>
                <ul className="space-y-3">
                  {[
                    'AI-Powered Ad Campaign Setup',
                    'Custom Investor Funnel & Landing Pages',
                    'Lead Enrichment & Qualification System',
                    'Automated Nurture Sequences',
                    'Dedicated Strategy Session',
                    'Performance Dashboard Access',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Setup Fee</span>
                      <span className="text-sm font-medium text-foreground">${baseAmount.toLocaleString()}</span>
                    </div>
                    {paymentMethod === 'card' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Card Fee (3%)</span>
                        <span className="text-sm font-medium text-foreground">${processingFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm text-muted-foreground">Total Due</span>
                      <span className="font-display font-bold text-foreground text-lg">${displayAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    One-time payment · Monthly billing starts after kickoff
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secured by Stripe · 256-bit encryption</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-muted/30 mt-auto">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={logo} alt="AI Capital Raising" className="h-7" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AI Capital Raising. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
