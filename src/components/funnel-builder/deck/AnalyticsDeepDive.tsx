import { motion } from 'framer-motion';
import { Search, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';

const reasons = [
  { icon: Search, title: 'Identify Bottlenecks', desc: 'Pinpoint exactly where prospects are dropping off in your funnel.' },
  { icon: DollarSign, title: 'Optimize Spending', desc: 'Understand which campaigns, content, or strategies deliver the best ROI.' },
  { icon: MessageSquare, title: 'Improve Messaging', desc: 'See which headlines, value propositions, or calls to action resonate most.' },
  { icon: TrendingUp, title: 'Forecast Accurately', desc: 'Predict lead flow, conversion rates, and capital commitments with greater accuracy.' },
];

const examples = [
  { title: 'Example #1: Land Fund', img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/ce7184329fd149199dab6dacdf3f9711/original/Screenshot-2025-05-08-at-8.16.52-AM.png' },
  { title: 'Example #2: Oil & Gas Fund', img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/335a972491bc4eab92cf75af02e7ea17/original/Screenshot-2025-06-18-at-1.19.26-PM.png' },
  { title: 'Example #3: Real Estate Fund', img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/828d500749f94daabd993f6789c9af14/original/Screenshot-2025-06-18-at-1.23.00-PM.png' },
];

export default function AnalyticsDeepDive() {
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
          <p className="text-primary font-display font-semibold text-sm uppercase tracking-wider mb-3">Step 4</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Analytics & <span className="gradient-text">KPI Tracking</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-3xl mx-auto">
            In the world of AI-driven capital raising, data isn't just a byproduct; it's the fuel that powers continuous improvement and predictable success.
          </p>
        </motion.div>

        {/* Why Analytics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              className="glass-card rounded-xl p-5 text-center group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <r.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-1">{r.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
