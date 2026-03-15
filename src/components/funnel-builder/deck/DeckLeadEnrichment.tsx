import { motion } from 'framer-motion';
import { Sparkles, MapPin, DollarSign, Home, Users, GraduationCap, Database, Zap } from 'lucide-react';

const enrichmentFields = [
  {
    icon: Users,
    label: 'IDENTITY',
    fields: ['Gender: Female', 'Age: 50', 'Marital: Married'],
    blurred: ['████████ ██████'],
  },
  {
    icon: MapPin,
    label: 'ADDRESS',
    fields: ['Area: Urban'],
    blurred: ['████████ ██ ████'],
  },
  {
    icon: DollarSign,
    label: 'FINANCIAL PROFILE',
    fields: ['Net Worth: Greater than $499K', 'Income: GT_150K'],
    tags: ['Investor', 'Owns Investments'],
  },
  {
    icon: Home,
    label: 'HOME',
    fields: ['Home Owner', 'Value: $1,745,200', 'Type: Single Family'],
  },
  {
    icon: Users,
    label: 'HOUSEHOLD',
    fields: ['1 person(s), 1 adult(s)'],
    tags: ['Has Children'],
  },
  {
    icon: GraduationCap,
    label: 'EDUCATION & CAREER',
    fields: ['Completed Graduate School', 'Type: White Collar'],
  },
];

export default function DeckLeadEnrichment() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Instant Lead <span className="gradient-text">Enrichment</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
              Every lead that enters your CRM is instantly enriched with net worth, income, investment history, and accreditation status—so your team only spends time on qualified prospects.
            </p>

            {/* Secret sauce callout */}
            <motion.div
              className="rounded-xl border border-primary/20 bg-primary/5 p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-foreground text-sm">Our Secret Weapon</h4>
                  <p className="text-xs text-muted-foreground">Proprietary Investor Database</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Access our exclusive list of <span className="text-primary font-bold">5,000+ funded investors</span> who have already invested in alternative investments—real estate funds, oil & gas, private equity, and more. These aren't cold leads. They're <span className="text-foreground font-semibold">proven capital deployers</span>.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Zap className="w-3.5 h-3.5" /> Pre-Qualified
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <DollarSign className="w-3.5 h-3.5" /> $50K–$1M+ Tickets
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Database className="w-3.5 h-3.5" /> 5,000+ Records
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: enrichment card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-display text-sm font-bold text-foreground uppercase tracking-wide">Lead Enrichment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Enriched</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Phone+Email</span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-px bg-border">
                {enrichmentFields.map((field, i) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.label} className="bg-card p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{field.label}</span>
                      </div>
                      {field.blurred && (
                        <p className="text-sm text-foreground/20 blur-[4px] select-none mb-1 font-medium">
                          {field.blurred[0]}
                        </p>
                      )}
                      {field.fields.map((f) => (
                        <p key={f} className="text-xs text-foreground leading-relaxed">{f}</p>
                      ))}
                      {field.tags && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {field.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
