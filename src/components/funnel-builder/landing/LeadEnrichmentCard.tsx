import { motion } from 'framer-motion';
import { Sparkles, User, MapPin, DollarSign, Home, Users, GraduationCap } from 'lucide-react';

const enrichmentData = [
  {
    icon: User,
    title: 'Identity',
    fields: [
      { label: null, value: 'Margo Lauterbach', bold: true, redacted: true },
      { label: 'Gender', value: 'Female' },
      { label: 'Age', value: '50' },
      { label: 'Marital', value: 'Married' },
    ],
  },
  {
    icon: MapPin,
    title: 'Address',
    fields: [
      { label: null, value: '1001 Malvern Ave, Towson, MD, 21204', bold: true, redacted: true },
      { label: 'Area', value: 'Urban' },
    ],
  },
  {
    icon: DollarSign,
    title: 'Financial Profile',
    fields: [
      { label: 'Net Worth', value: 'Greater than $499K' },
      { label: 'Income', value: 'GT_150K' },
    ],
    tags: ['Investor', 'Owns Investments'],
  },
  {
    icon: Home,
    title: 'Home',
    fields: [
      { label: null, value: 'Home Owner', bold: true },
      { label: 'Value', value: '$1,745,200' },
      { label: 'Type', value: 'Single Family' },
    ],
  },
  {
    icon: Users,
    title: 'Household',
    fields: [
      { label: null, value: '1 person(s), 1 adult(s)', bold: true },
    ],
    tags: ['Has Children'],
  },
  {
    icon: GraduationCap,
    title: 'Education & Career',
    fields: [
      { label: null, value: 'Completed Graduate School', bold: true },
      { label: 'Type', value: 'White Collar' },
    ],
  },
];

export default function LeadEnrichmentCard() {
  return (
    <motion.div
      className="max-w-sm mx-auto glass-card rounded-xl overflow-hidden animate-enrichment-glow"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="font-display text-[10px] font-bold tracking-widest uppercase text-foreground">
          Lead Enrichment
        </span>
        <span className="ml-auto flex gap-1">
          <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            Enriched
          </span>
          <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground">
            Phone+Email
          </span>
        </span>
      </div>

      {/* Sections in 2-column grid */}
      <div className="px-3 py-2 grid grid-cols-2 gap-1.5">
        {enrichmentData.map((section, i) => (
          <motion.div
            key={section.title}
            className="rounded-lg bg-secondary/60 px-3 py-2"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <section.icon className="w-3 h-3 text-muted-foreground" />
              <span className="font-display text-[9px] font-semibold tracking-wide uppercase text-muted-foreground">
                {section.title}
              </span>
            </div>
            <div className="space-y-0">
              {section.fields.map((field, j) => (
                <p key={j} className={`text-[10px] leading-tight ${field.bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {field.label ? (
                    <>
                      <span className="text-muted-foreground">{field.label}:</span>{' '}
                      <span className="text-foreground">{field.value}</span>
                    </>
                  ) : (
                    <span className={field.redacted ? 'blur-[5px] select-none' : ''}>
                      {field.value}
                    </span>
                  )}
                </p>
              ))}
            </div>
            {section.tags && (
              <div className="flex flex-wrap gap-1 mt-1">
                {section.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
