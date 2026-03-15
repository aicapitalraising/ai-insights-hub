import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function AboutSection() {
  const { ref, isVisible } = useScrollAnimation(0.15);

  return (
    <section id="about" ref={ref} className="py-24 md:py-32 border-t border-border">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-6">About</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8 text-foreground">
            High Performance Ads
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            We are a performance marketing agency specializing in AI-powered capital raising for alternative investment funds. Our team combines deep expertise in digital marketing, investor psychology, and artificial intelligence to build systems that attract, qualify, and convert accredited investors at scale.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            With over <span className="text-primary font-semibold">$600M+ in capital raised</span> across 47+ funds, we've proven that the future of fundraising is automated, intelligent, and measurable.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
