import { motion } from 'framer-motion';
import { Lightbulb, Search, RefreshCw, Rocket } from 'lucide-react';

const adImages = [
  'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/05836dad7ecf435cab1ff1837e985b4a/original/683a0f256be0e771fb3f1ac8.png',
  'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/0c693f8788104f95ab5fba1b70cb84f3/original/Q1-Top-Ads-Template-1.jpg',
  'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/f07d3d44f12e48de9c2287c0efb8ec83/original/Altitude-Capital.jpg',
  'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/83977ee260444a7c8b90a50f3a63286d/original/Hero-homes-Ads.jpg',
  'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/591263c574df42558701435d12e50a9e/original/LLH-Crypto-Creative-2.jpg',
  'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/f8dfad3f3e44408ca7f6eeb70e99283f/original/Titan-Asset-Management-ADS.jpg',
];

const flywheel = [
  { icon: Lightbulb, label: 'Create' },
  { icon: Search, label: 'Analyze' },
  { icon: RefreshCw, label: 'Research' },
  { icon: Rocket, label: 'Launch' },
];

export default function LeadGenDeepDive() {
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
          <p className="text-primary font-display font-semibold text-sm uppercase tracking-wider mb-3">Step 1</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            AI-Powered <span className="gradient-text">Paid Ads</span>
          </h2>
        </motion.div>

        {/* Mindset Shift */}
        <motion.div
          className="glass-card rounded-2xl p-8 md:p-10 mb-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="font-display text-xl font-bold mb-4 text-foreground">The Mindset Shift: From "Pursuing" to "Attracting"</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">The core of this step is to shift from actively chasing investors to strategically attracting them. Rather than cold-calling or enduring endless networking mixers with no clear outcome, your goal is to position your offering directly in front of investors who are actively exploring, researching, or signaling their inclination to invest.</p>
          <h4 className="font-display font-bold text-foreground mb-2">Signal Spotting</h4>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">When an individual reads articles about commercial real estate investment strategies, researches private equity opportunities online, or engages with content related to alternative assets, they are leaving digital footprints—signals of potential interest. AI can spot these signals and ensure your opportunity appears prominently in front of these already-engaged prospects.</p>
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground text-sm">
            You're essentially fishing in a well-stocked pond rather than casting lines randomly into the vast ocean.
          </blockquote>
        </motion.div>

        {/* Flywheel */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="font-display text-xl font-bold mb-6 text-foreground">High Converting Ad Flywheel</h3>
          <div className="flex justify-center gap-4 md:gap-8">
            {flywheel.map((f, i) => (
              <motion.div
                key={f.label}
                className="glass-card rounded-xl p-4 md:p-6 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <f.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-display font-bold text-xs text-foreground">{f.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Static Ad Examples */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="font-display text-xl font-bold mb-2 text-center text-foreground">Captivating Static Ads</h3>
          <p className="text-muted-foreground text-sm text-center mb-8 max-w-2xl mx-auto">
            Static image ads pack a powerful punch when it comes to converting high-net-worth individuals into red-hot leads for your fund.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {adImages.map((src, i) => (
              <motion.div
                key={i}
                className="rounded-xl overflow-hidden glass-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <img src={src} alt={`Ad example ${i + 1}`} className="w-full h-auto" loading="lazy" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
