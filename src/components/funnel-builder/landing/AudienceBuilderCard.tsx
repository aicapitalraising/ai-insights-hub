import { motion } from 'framer-motion';
import { Database, MapPin, Users, DollarSign, Home, Mail, Heart, Baby, UserCircle, Search } from 'lucide-react';

const filters = [
  { icon: UserCircle, label: 'Contact Details', desc: 'Required contact information' },
  { icon: MapPin, label: 'Location', desc: 'City, State, or ZIP code' },
  { icon: Users, label: 'Gender', desc: 'Gender targeting' },
  { icon: Users, label: 'Age Range', desc: 'Demographic age groups' },
  { icon: Heart, label: 'Marital Status', desc: 'Marital status' },
  { icon: Baby, label: 'Children', desc: 'Has children' },
  { icon: DollarSign, label: 'Income', desc: 'Household income range', active: true, count: 2 },
  { icon: DollarSign, label: 'Net Worth', desc: 'Net worth range' },
  { icon: Home, label: 'Home Owner', desc: 'Homeownership status' },
  { icon: Mail, label: 'Email Validation', desc: 'Email validation status' },
];

const incomeOptions = [
  { value: '$200,000 to $249,000', checked: true },
  { value: '$250,000+', checked: true },
  { value: '$150,000 to $199,999', checked: false },
  { value: '$100,000 to $149,999', checked: false },
];

export default function AudienceBuilderCard() {
  return (
    <motion.div
      className="max-w-md mx-auto glass-card rounded-2xl overflow-hidden animate-enrichment-glow"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
        <Database className="w-4 h-4 text-primary" />
        <span className="font-display text-xs font-bold tracking-widest uppercase text-foreground">
          Audience Builder
        </span>
        <span className="ml-auto">
          <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            5M+ Records
          </span>
        </span>
      </div>

      <div className="grid grid-cols-[140px_1fr] divide-x divide-border">
        {/* Sidebar filters */}
        <div className="py-2 px-2 space-y-0.5 max-h-[260px] overflow-hidden">
          {filters.slice(0, 7).map((filter, i) => (
            <motion.div
              key={filter.label}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-default ${
                filter.active
                  ? 'bg-primary/10'
                  : 'hover:bg-secondary/60'
              }`}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
            >
              <filter.icon className={`w-3 h-3 shrink-0 ${filter.active ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="min-w-0">
                <p className={`text-[10px] font-semibold truncate ${filter.active ? 'text-primary' : 'text-foreground'}`}>
                  {filter.label}
                </p>
                <p className="text-[8px] text-muted-foreground truncate">{filter.desc}</p>
              </div>
              {filter.count && (
                <span className="ml-auto text-[8px] font-bold w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  {filter.count}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Income options */}
        <div className="py-2 px-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-foreground">Income</p>
              <p className="text-[9px] text-muted-foreground">Household income range</p>
            </div>
            <span className="text-[9px] text-muted-foreground cursor-default">Clear</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/60 mb-2">
            <Search className="w-3 h-3 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">Search...</span>
          </div>

          <div className="space-y-1">
            {incomeOptions.map((opt, i) => (
              <motion.div
                key={opt.value}
                className="flex items-center gap-2 py-1"
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  opt.checked
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                }`}>
                  {opt.checked && (
                    <svg className="w-2 h-2 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-[10px] ${opt.checked ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {opt.value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Applied filters */}
          <div className="mt-3 pt-2 border-t border-border">
            <p className="text-[8px] font-semibold tracking-wide uppercase text-muted-foreground mb-1.5">Applied Filters</p>
            <div className="flex flex-wrap gap-1">
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                $200K–$249K ×
              </span>
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                $250K+ ×
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Estimated reach footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Estimated Reach</span>
        <div className="text-right">
          <span className="font-display text-lg font-bold text-foreground">5.1M</span>
          <span className="text-[9px] text-muted-foreground ml-1">matching contacts</span>
        </div>
      </div>
    </motion.div>
  );
}
