import { motion } from 'framer-motion';
import { Send, BookOpen, Award, RefreshCw, Bot, Phone } from 'lucide-react';

const timeline = [
  { icon: Send, label: 'Initial Engagement', day: 'Day 0', desc: 'Immediate automated email, SMS with personalized thank you, content link, and soft next step.' },
  { icon: BookOpen, label: 'Value Delivery', day: 'Day 2-3', desc: 'Share valuable market insights or educational content related to your investment strategy.' },
  { icon: Award, label: 'Proof & Invitation', day: 'Day 7-10', desc: 'Share success stories or testimonials and invite to a low-commitment group event.' },
  { icon: RefreshCw, label: 'Ongoing Nurturing', day: 'Day 14+', desc: 'Deeper dives into strategy, updates, and personalized check-ins for highly engaged leads.' },
];

const robotFeatures = ['Works 24/7', '365 Days A Year', 'No Breaks', '1 min reply rate'];

export default function AutomationDeepDive() {
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
          <p className="text-primary font-display font-semibold text-sm uppercase tracking-wider mb-3">Step 3</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Marketing Automation <span className="gradient-text">(Investor Nurturing)</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-3xl mx-auto">
            Research consistently shows that <strong className="text-foreground">80% of successful capital commitments occur only after at least five follow-up interactions.</strong> AI-driven marketing automation transforms this critical phase from a laborious chore into a systematic, personalized, and scalable process.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {timeline.map((t, i) => (
            <motion.div
              key={t.label}
              className="glass-card rounded-xl p-6 text-center group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <t.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-primary font-semibold mb-1">{t.day}</p>
              <h3 className="font-display font-bold text-sm text-foreground mb-2">{t.label}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Pipeline image */}
        <motion.div
          className="glass-card rounded-2xl overflow-hidden mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <img
            src="https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/9b26dba94cc54754bfbdc9238ff69187/original/AGV_vUemyQdbNRoWVC339ZppThSziAi3eM8wCpejjloT9GUJ8jbpfnp-K5S9bYxa4aQpP88sIEiDgngepnoZw5qNPnEM3zHQ5awQVmMzFdRE28s-Uw237PL9HPJ0K_CEHrqIxLSAjxayQA-s2048.png"
            alt="Investor pipeline"
            className="w-full"
            loading="lazy"
          />
        </motion.div>

        {/* AI Sales Robot */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            className="glass-card rounded-2xl p-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-6 h-6 text-primary" />
              <h3 className="font-display text-lg font-bold text-foreground">AI Sales Robot</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">Follow up via SMS and convert more booked calls on your calendar.</p>
            <div className="grid grid-cols-2 gap-3">
              {robotFeatures.map(f => (
                <div key={f} className="bg-primary/10 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs font-bold text-primary">{f}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl overflow-hidden">
              <img
                src="https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/a83db1595dbc47709f2c4be61dd08b72/original/image.png"
                alt="AI Sales Robot SMS"
                className="w-full"
                loading="lazy"
              />
            </div>
          </motion.div>
          <motion.div
            className="glass-card rounded-2xl p-8"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-6 h-6 text-primary" />
              <h3 className="font-display text-lg font-bold text-foreground">AI Caller</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">Calls, Voicemails, Appointment Confirmations & Reschedules.</p>
            <div className="rounded-xl overflow-hidden">
              <img
                src="https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/fed975be66454950ab49a0febf89ca07/original/image.png"
                alt="AI Caller interface"
                className="w-full"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
