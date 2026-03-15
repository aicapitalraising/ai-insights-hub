import { motion } from 'framer-motion';

const rows = [
  {
    feature: 'Engagement Fees',
    bd: '$20K–$100K upfront',
    ai: '$15,000 setup',
    inhouse: '$0 (but $382,500+ in salaries)',
    overseas: '$0 (contractor fees)',
  },
  {
    feature: 'Success Fees',
    bd: '5–10% of total raise',
    ai: '1%–3% effective cost of capital',
    inhouse: 'None (but massive overhead)',
    overseas: 'None (but low accountability)',
  },
  {
    feature: 'Time to Launch',
    bd: '6–12 months',
    ai: 'Live in 7–10 days',
    inhouse: '3–6 months (hiring + onboarding)',
    overseas: 'Who knows',
  },
  {
    feature: 'Lead Generation',
    bd: 'Manual & slow',
    ai: 'Automated ads + AI outreach',
    inhouse: 'Depends on hire quality',
    overseas: 'Inconsistent execution',
  },
  {
    feature: 'Investor Meetings',
    bd: 'Reliant on relationships',
    ai: 'Meetings booked within first week',
    inhouse: 'Months to ramp up',
    overseas: 'Unreliable follow-through',
  },
  {
    feature: 'Capital Raise Timeline',
    bd: '3–9 months+',
    ai: 'First funded investor in 30–90 days',
    inhouse: '6–12 months to see results',
    overseas: 'Unpredictable',
  },
  {
    feature: 'Annual Team Cost',
    bd: 'Retainer + success fees',
    ai: '$60,000/yr ($5K/mo)',
    inhouse: '$382,500+ (Marketing Mgr, Copywriter, Funnel Builder, Media Buyer, Sales Setter)',
    overseas: 'Lower rates, lower results',
  },
  {
    feature: 'Taxes & Payroll',
    bd: 'None',
    ai: 'None',
    inhouse: '$50K–$200K+ on top of salaries',
    overseas: 'None (contractor)',
  },
  {
    feature: 'Scalability',
    bd: 'Pay per raise + fees each time',
    ai: 'Fully owned system you control',
    inhouse: '5–10× our annual cost',
    overseas: 'You manage everything yourself',
  },
  {
    feature: 'Accountability',
    bd: 'Limited transparency',
    ai: 'Dedicated team + weekly reporting',
    inhouse: 'You are the manager of 5+ people',
    overseas: 'Low oversight & timezone gaps',
  },
];

const totalRow = {
  feature: 'Total 1-Year Cost ($10M Raise)',
  bd: '$520K–$1.1M+',
  ai: '$75,000',
  inhouse: '$432,500–$582,500+',
  overseas: 'Unknown — results not guaranteed',
};

const columns = [
  { key: 'feature', label: 'Feature', className: 'font-display font-bold text-foreground' },
  { key: 'bd', label: 'Traditional B-D', className: 'font-display font-bold text-muted-foreground' },
  { key: 'ai', label: 'AI Capital Raising', className: 'font-display font-bold text-primary' },
  { key: 'inhouse', label: 'In-House Team', className: 'font-display font-bold text-muted-foreground' },
  { key: 'overseas', label: 'Overseas Team', className: 'font-display font-bold text-muted-foreground' },
];

export default function BrokerComparison() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            We Replace an Entire Marketing Team—<span className="gradient-text">for Less Than One Salary.</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">Building an in-house team to achieve the same results can be expensive, fragmented, and slow.</p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  {columns.map(col => (
                    <th key={col.key} className={`text-left p-4 ${col.className} text-xs md:text-sm`}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.feature} className="border-b border-border/50">
                    <td className="p-4 font-medium text-foreground text-xs md:text-sm">{r.feature}</td>
                    <td className="p-4 text-muted-foreground text-xs md:text-sm">{r.bd}</td>
                    <td className="p-4 text-primary font-medium text-xs md:text-sm">{r.ai}</td>
                    <td className="p-4 text-muted-foreground text-xs md:text-sm">{r.inhouse}</td>
                    <td className="p-4 text-muted-foreground text-xs md:text-sm">{r.overseas}</td>
                  </tr>
                ))}
                <tr className="bg-primary/5 border-t-2 border-primary/20">
                  <td className="p-4 font-display font-bold text-foreground text-xs md:text-sm">{totalRow.feature}</td>
                  <td className="p-4 font-bold text-destructive text-xs md:text-sm">{totalRow.bd}</td>
                  <td className="p-4 font-bold text-primary text-xs md:text-sm">{totalRow.ai}</td>
                  <td className="p-4 font-bold text-destructive text-xs md:text-sm">{totalRow.inhouse}</td>
                  <td className="p-4 font-bold text-muted-foreground italic text-xs md:text-sm">{totalRow.overseas}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.p
          className="text-muted-foreground text-sm text-center mt-6 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Traditional broker-dealer models are slow and expensive. In-house teams cost 5–10× more annually with no guarantee of results. Overseas teams lack accountability and expertise. Our lean, scalable system empowers serious fund managers to raise capital efficiently and repeatedly.
        </motion.p>
      </div>
    </section>
  );
}
