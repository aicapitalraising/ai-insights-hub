import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Facebook, Search, Linkedin, Youtube, Mail, MessageSquare, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCountUp } from '@/hooks/useScrollAnimation';

const rotatingWords = [
  'Accredited Investors',
  'Institutional Capital',
  'Capital Partners',
  'Family Offices',
];

const stats = [
  { value: 600, suffix: 'M+', prefix: '$', label: 'Capital Raised', decimals: 0 },
  { value: 2.46, suffix: '%', prefix: '', label: 'Avg. Cost of Capital', decimals: 2 },
  { value: 10, suffix: 'M', prefix: '$', label: 'Raised in 90 Days', decimals: 0 },
  { value: 1.5, suffix: 'B+', prefix: '$', label: 'Capital Pipeline Generated', decimals: 1 },
];

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = rotatingWords[wordIndex];
    const timeout = isDeleting ? 40 : 70;

    if (!isDeleting && displayed === word) {
      setTimeout(() => setIsDeleting(true), 2000);
      return;
    }

    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayed(
        isDeleting ? word.slice(0, displayed.length - 1) : word.slice(0, displayed.length + 1)
      );
    }, timeout);

    return () => clearTimeout(timer);
  }, [displayed, isDeleting, wordIndex]);

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-background" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(220 13% 70%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 13% 70%) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-medium tracking-wide uppercase">Paid Ads → Investors → Capital Raised</span>
          </div>
        </motion.div>

        <motion.h1
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6 text-balance text-foreground"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          Raise $5M–$100M
          <br />
          With{' '}
          <span className="text-primary cursor-blink">{displayed}</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          We use <span className="text-foreground font-semibold">paid advertising</span> to put your fund
          in front of <span className="text-foreground font-semibold">qualified, accredited investors</span> who
          are actively looking to deploy capital—so you stop chasing and start closing.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button
            size="lg"
            onClick={scrollToContact}
            className="text-base px-8 py-6 font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-300 hover:shadow-lg"
          >
            View Demo
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.getElementById('track-record')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-base px-8 py-6 font-semibold rounded-lg border-border hover:border-primary/40 hover:bg-primary/5"
          >
            View Track Record
          </Button>
        </motion.div>

        {/* Stats directly under buttons */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-14 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {stats.map((stat, i) => (
            <HeroStatCard key={stat.label} stat={stat} delay={0.7 + i * 0.1} />
          ))}
        </motion.div>

        {/* Platform logos - paid ads emphasis */}
        <motion.div
          className="mt-12 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-5 font-medium">
            We Run Paid Ads That Attract Investors On
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 md:gap-6 max-w-2xl mx-auto">
            {[
              { name: 'Meta Ads', icon: Facebook },
              { name: 'Google Ads', icon: Search },
              { name: 'LinkedIn', icon: Linkedin },
              { name: 'YouTube', icon: Youtube },
              { name: 'Email', icon: Mail },
              { name: 'SMS', icon: MessageSquare },
              { name: 'AI', icon: Bot },
            ].map((platform) => (
              <div key={platform.name} className="flex flex-col items-center gap-1.5 group">
                <span className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground/60 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300">
                  <platform.icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-semibold text-foreground/70">{platform.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <ChevronDown className="w-4 h-4 animate-bounce-slow" />
      </motion.div>
    </section>
  );
}

function HeroStatCard({ stat, delay }: { stat: typeof stats[0]; delay: number }) {
  const count = useCountUp(stat.value, 2500, true, stat.decimals);

  return (
    <motion.div
      className="text-center py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="font-display text-2xl md:text-3xl font-bold text-foreground">
        {stat.prefix}{count}{stat.suffix}
      </div>
      <div className="text-xs text-muted-foreground tracking-wide uppercase mt-1">{stat.label}</div>
    </motion.div>
  );
}
