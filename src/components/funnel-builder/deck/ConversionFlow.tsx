import { motion } from 'framer-motion';
import { Target, UserCheck, RefreshCw, Phone, UserPlus, ShieldCheck, FolderOpen, FileSignature, Landmark, CheckCircle2 } from 'lucide-react';
import FunnelFlowChart from './FunnelFlowChart';

/* ── Timeline Steps ── */
const flowSteps = [
  { step: 1, title: 'AI-Targeted Ads', desc: 'Precision targeting reaches qualified investors through behavior and investment profiles.', icon: Target },
  { step: 2, title: 'Lead Qualification', desc: 'Smart forms pre-qualify prospects through accreditation, investment capacity and timeline questions.', icon: UserCheck },
  { step: 3, title: 'Strategic Retargeting', desc: 'Personalized content nurtures hesitant leads with tailored investment insights and case studies.', icon: RefreshCw },
  { step: 4, title: 'Discovery Call', desc: '20-minute Zoom with a strategist confirms fit, explains returns, and answers questions.', icon: Phone },
  { step: 5, title: 'Platform Registration', desc: 'Investor receives secure link to create their InvestNext profile.', icon: UserPlus },
  { step: 6, title: 'Accreditation Verification', desc: 'Automated questionnaire and document upload with third-party verification.', icon: ShieldCheck },
  { step: 7, title: 'Deal Room Access', desc: 'Verified investors gain instant access to PPM, projections, FAQ, and legal documents.', icon: FolderOpen },
  { step: 8, title: 'Digital Commitment', desc: 'Investor selects allocation size and signs subscription agreement electronically.', icon: FileSignature },
  { step: 9, title: 'Banking Connection', desc: 'Plaid-enabled ACH link or wire instructions provided for seamless transfers.', icon: Landmark },
  { step: 10, title: 'Investment Completion', desc: 'Capital transfer executed with automated confirmation and ongoing nurture campaign activation.', icon: CheckCircle2 },
];

export default function ConversionFlow() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Step-by-Step Investor <span className="gradient-text">Conversion Flow</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            This streamlined, automated conversion path transforms traditional 12 month closing cycles into 2–3 months of efficient digital engagement.
          </p>
        </motion.div>

        <FunnelFlowChart />

        {/* Animated Timeline */}
        <div className="relative">
          <div className="absolute left-5 md:left-7 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-0">
            {flowSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  className="relative flex items-start gap-5 md:gap-7 py-5"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <div className="relative z-10 w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="glass-card rounded-xl p-4 md:p-6 flex-1 hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-display font-bold text-primary">Step {s.step}</span>
                    </div>
                    <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-1">{s.title}</h3>
                    <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
