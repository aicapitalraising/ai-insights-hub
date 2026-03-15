import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "They raised $3.2M for our oil and gas fund in just 135 days. The AI-powered approach brought in investors we never would have reached through traditional channels.",
    name: 'Managing Partner',
    fund: 'Oil & Gas Fund',
  },
  {
    quote: "We went from struggling to raise $500K to closing $10.5M in 8 months. The system just works—qualified investors come in on autopilot.",
    name: 'Fund Manager',
    fund: 'Land Development Fund',
  },
  {
    quote: "$850K in 7 days. I didn't think it was possible until I saw the pipeline they built. Every investor was pre-qualified and ready to commit.",
    name: 'GP',
    fund: 'Single Family Fund',
  },
];

export default function TestimonialsSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section ref={ref} className="py-24 md:py-32 border-t border-border relative bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            What Fund Managers <span className="gradient-text">Are Saying</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="glass-card rounded-2xl p-8 relative group hover:border-primary/30 transition-all duration-500"
              initial={{ opacity: 0, y: 40 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <Quote className="w-8 h-8 text-primary/20 mb-4" />
              <p className="text-foreground/80 leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.fund}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
