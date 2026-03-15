import { motion } from 'framer-motion';
import {
  Facebook, Instagram, FileText, Calendar, Video, Phone,
  UserCheck, RefreshCw, CheckCircle2, Mail, MessageSquare,
  Bot, PhoneCall, Play, HelpCircle, Award,
} from 'lucide-react';

/* ── Shared animation config ── */
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: '-60px' as const },
  transition: { duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const lineReveal = (delay = 0) => ({
  initial: { scaleX: 0 } as const,
  whileInView: { scaleX: 1 } as const,
  viewport: { once: true, margin: '-60px' as const },
  transition: { duration: 0.4, delay, ease: 'easeOut' as const },
});

/* ── Tiny reusable pieces ── */
function IconBubble({ icon: Icon, color, label, size = 'md' }: { icon: any; color: string; label: string; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`${sizeClasses} rounded-xl ${color} flex items-center justify-center shadow-sm`}>
        <Icon className={`${iconSize} text-primary-foreground`} />
      </div>
      <span className="text-[10px] font-display font-semibold text-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function Arrow({ direction = 'right', className = '' }: { direction?: 'right' | 'down'; className?: string }) {
  if (direction === 'down') {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="w-[2px] h-6 bg-border relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-primary/40" />
        </div>
      </div>
    );
  }
  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-8 h-[2px] bg-gradient-to-r from-border to-primary/30 relative">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-b-[4px] border-l-[5px] border-t-transparent border-b-transparent border-l-primary/40" />
      </div>
    </div>
  );
}

function DashedLine({ direction = 'down', className = '' }: { direction?: 'down' | 'right'; className?: string }) {
  if (direction === 'right') {
    return <div className={`h-[2px] w-12 border-t-2 border-dashed border-primary/20 ${className}`} />;
  }
  return <div className={`w-[2px] h-8 border-l-2 border-dashed border-primary/20 mx-auto ${className}`} />;
}

/* ── Stage Card ── */
function StageCard({ icon: Icon, label, children, isEnd = false, delay = 0 }: { icon: any; label: string; children?: React.ReactNode; isEnd?: boolean; delay?: number }) {
  return (
    <motion.div
      className={`rounded-2xl overflow-hidden border bg-background ${isEnd ? 'border-2 border-green-500/30' : 'border-border'}`}
      {...reveal(delay)}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isEnd ? 'bg-green-500/15' : 'bg-primary/10'}`}>
          <Icon className={`w-3.5 h-3.5 ${isEnd ? 'text-green-600' : 'text-primary'}`} />
        </div>
        <span className="text-xs font-display font-bold text-foreground">{label}</span>
      </div>
      {children && <div className="p-4">{children}</div>}
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   DESKTOP FLOW
   ════════════════════════════════════════════ */
function DesktopFlow() {
  return (
    <div className="hidden lg:block">
      {/* ── ROW 1: Ad Sources → Lead Form → Calendar → Indoctrination Page ── */}
      <div className="flex items-start gap-0">
        {/* Ad Sources */}
        <motion.div className="flex flex-col items-center gap-3 pt-4 shrink-0" {...reveal(0)}>
          <IconBubble icon={Facebook} color="bg-blue-600" label="Facebook Ad" />
          <IconBubble icon={Instagram} color="bg-gradient-to-br from-purple-500 to-pink-500" label="Instagram Ad" />
        </motion.div>

        <motion.div className="pt-10" {...lineReveal(0.15)}><Arrow /></motion.div>

        {/* Lead Opt-in */}
        <div className="shrink-0 w-[200px]">
          <StageCard icon={FileText} label="Lead Opt-in" delay={0.2}>
            <div className="space-y-2.5">
              <div className="h-6 rounded bg-muted border border-border" />
              <div className="h-6 rounded bg-muted border border-border" />
              <div className="h-6 rounded bg-primary/80 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary-foreground tracking-wider">OPT IN</span>
              </div>
              <div className="pt-1">
                <p className="text-[8px] text-muted-foreground leading-snug font-medium">Are you an accredited investor?</p>
                <div className="mt-1 space-y-1">
                  {['Yes', 'No'].map(o => (
                    <div key={o} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full border border-border bg-background" />
                      <span className="text-[8px] text-foreground">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-1">
                <p className="text-[8px] text-muted-foreground leading-snug font-medium">What is your liquidity range?</p>
                <div className="mt-1 space-y-1">
                  {['Less than $25k', '$25k–$50k', '$50k–$100k', '$100k–$250k', '$250k–$500k'].map(o => (
                    <div key={o} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full border border-border bg-background" />
                      <span className="text-[8px] text-foreground">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </StageCard>
        </div>

        <motion.div className="pt-10" {...lineReveal(0.35)}><Arrow /></motion.div>

        {/* Calendar */}
        <div className="shrink-0 w-[170px]">
          <StageCard icon={Calendar} label="Calendar" delay={0.4}>
            <div className="bg-muted/50 rounded-lg p-2 border border-border">
              <div className="text-[8px] font-bold text-foreground text-center mb-1">CALENDAR</div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: 28 }, (_, i) => (
                  <div key={i} className={`w-3.5 h-3.5 rounded-sm text-[6px] flex items-center justify-center ${i === 14 ? 'bg-primary text-primary-foreground font-bold' : 'bg-background text-muted-foreground'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </StageCard>
        </div>

        <motion.div className="pt-10" {...lineReveal(0.5)}><Arrow /></motion.div>

        {/* Indoctrination Page */}
        <div className="shrink-0 w-[180px]">
          <StageCard icon={Video} label="Indoctrination Page" delay={0.55}>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center mb-3">
              <Video className="w-6 h-6 text-primary/40 mx-auto" />
            </div>
            <ul className="space-y-1">
              {['Pitch Video', 'Pitch Deck', 'Credibility', 'FAQ Videos'].map(item => (
                <li key={item} className="text-[8px] text-muted-foreground flex items-center gap-1">
                  <span className="text-primary">•</span> {item}
                </li>
              ))}
            </ul>
          </StageCard>
        </div>

        <motion.div className="pt-10" {...lineReveal(0.65)}><Arrow /></motion.div>

        {/* Final stages row */}
        <div className="flex items-center gap-0 pt-2 shrink-0">
          {[
            { icon: Phone, label: 'Discovery Call', delay: 0.7, color: 'bg-amber-500' },
            { icon: UserCheck, label: 'Committed\nInvestor', delay: 0.8, color: 'bg-blue-600' },
            { icon: RefreshCw, label: 'Reconnect\nCall', delay: 0.9, color: 'bg-primary' },
            { icon: CheckCircle2, label: 'Funded\nInvestor', delay: 1.0, color: 'bg-green-600' },
          ].map((stage, i) => (
            <div key={stage.label} className="flex items-center">
              <motion.div className="flex flex-col items-center gap-1.5" {...reveal(stage.delay)}>
                <div className={`w-12 h-12 rounded-xl ${stage.color}/15 border-2 ${stage.color}/30 flex items-center justify-center`}>
                  <stage.icon className={`w-5 h-5 ${stage.color === 'bg-green-600' ? 'text-green-600' : stage.color === 'bg-amber-500' ? 'text-amber-600' : stage.color === 'bg-blue-600' ? 'text-blue-600' : 'text-primary'}`} />
                </div>
                <span className="text-[9px] font-display font-semibold text-foreground text-center leading-tight whitespace-pre-line max-w-[70px]">{stage.label}</span>
              </motion.div>
              {i < 3 && (
                <motion.div className="mx-1" {...lineReveal(stage.delay + 0.1)}>
                  {i === 1 ? <DashedLine direction="right" className="!w-6" /> : <Arrow />}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 2: Nurture channels below Lead Opt-in & content below Calendar ── */}
      <div className="flex items-start gap-0 mt-4">
        {/* Spacer for ad sources + arrow */}
        <div className="shrink-0 w-[80px]" />

        {/* Nurture under Lead Opt-in */}
        <motion.div className="shrink-0 w-[200px]" {...reveal(0.5)}>
          <DashedLine direction="down" className="!h-4" />
          <div className="glass-card rounded-xl p-3">
            <p className="text-[8px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-2">NURTURE CHANNELS</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Mail, label: 'Email', color: 'bg-blue-500' },
                { icon: MessageSquare, label: 'SMS', color: 'bg-pink-500' },
                { icon: Bot, label: 'AI Setter', color: 'bg-blue-700' },
                { icon: PhoneCall, label: 'Phone', color: 'bg-blue-600' },
              ].map(ch => (
                <IconBubble key={ch.label} icon={ch.icon} color={ch.color} label={ch.label} size="sm" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Spacer for arrow */}
        <div className="shrink-0 w-[40px]" />

        {/* Content Delivery - moved up, directly after nurture spacer */}
        <motion.div className="shrink-0 w-[170px]" {...reveal(0.55)}>
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[8px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-2">CONTENT DELIVERY</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Mail, label: 'Email', color: 'bg-blue-500' },
                { icon: MessageSquare, label: 'SMS', color: 'bg-pink-500' },
                { icon: Play, label: 'Pitch Video', color: 'bg-red-500' },
                { icon: HelpCircle, label: 'FAQ Videos', color: 'bg-red-600' },
                { icon: Award, label: 'Testimonial', color: 'bg-red-500' },
              ].map(item => (
                <IconBubble key={item.label} icon={item.icon} color={item.color} label={item.label} size="sm" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="shrink-0 w-[40px]" />

        {/* Testimonial Videos label near end */}
        <motion.div className="pt-4" {...reveal(0.9)}>
          <div className="rounded-xl border border-border bg-background p-3 flex flex-col items-center gap-2">
            <p className="text-[8px] font-display font-bold text-muted-foreground uppercase tracking-wider">TESTIMONIAL VIDEOS</p>
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shadow-sm">
              <Play className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MOBILE FLOW (vertical)
   ════════════════════════════════════════════ */
function MobileFlow() {
  const stages = [
    {
      label: 'Ad Sources',
      content: (
        <div className="flex gap-3">
          <IconBubble icon={Facebook} color="bg-blue-600" label="Facebook" size="sm" />
          <IconBubble icon={Instagram} color="bg-gradient-to-br from-purple-500 to-pink-500" label="Instagram" size="sm" />
        </div>
      ),
    },
    {
      label: 'Lead Opt-in & Qualification',
      content: (
        <div className="space-y-2">
          <div className="h-6 rounded bg-muted border border-border" />
          <div className="h-6 rounded bg-muted border border-border" />
          <div className="h-6 rounded bg-primary/80 flex items-center justify-center">
            <span className="text-[9px] font-bold text-primary-foreground">OPT IN</span>
          </div>
          <p className="text-[9px] text-muted-foreground font-medium pt-1">Accredited? <span className="text-foreground">Yes / No</span></p>
          <p className="text-[9px] text-muted-foreground font-medium">Liquidity: <span className="text-foreground">$25k–$500k+</span></p>
        </div>
      ),
    },
    {
      label: 'Nurture Channels',
      content: (
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: Mail, label: 'Email', color: 'bg-blue-500' },
            { icon: MessageSquare, label: 'SMS', color: 'bg-pink-500' },
            { icon: Bot, label: 'AI Setter', color: 'bg-blue-700' },
            { icon: PhoneCall, label: 'Phone', color: 'bg-blue-600' },
          ].map(ch => (
            <IconBubble key={ch.label} icon={ch.icon} color={ch.color} label={ch.label} size="sm" />
          ))}
        </div>
      ),
    },
    {
      label: 'Calendar Booking',
      content: null,
    },
    {
      label: 'Indoctrination Page',
      content: (
        <ul className="space-y-1">
          {['Pitch Video', 'Pitch Deck', 'Credibility', 'FAQ Videos'].map(item => (
            <li key={item} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="text-primary">•</span> {item}
            </li>
          ))}
        </ul>
      ),
    },
    { label: 'Discovery Call', content: null },
    { label: 'Committed Investor', content: null },
    { label: 'Testimonial Videos', content: null },
    { label: 'Reconnect Call', content: null },
    { label: 'Funded Investor', content: null, isEnd: true },
  ];

  const icons = [null, FileText, null, Calendar, Video, Phone, UserCheck, Play, RefreshCw, CheckCircle2];

  return (
    <div className="lg:hidden">
      <div className="relative pl-6">
        <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-border" />
        {stages.map((stage, i) => (
          <motion.div
            key={stage.label}
            className="relative pb-6 last:pb-0"
            {...reveal(i * 0.08)}
          >
            <div className={`absolute left-[-13px] w-6 h-6 rounded-full border-2 flex items-center justify-center ${stage.isEnd ? 'bg-green-500/15 border-green-500/40' : 'bg-primary/10 border-primary/30'}`}>
              {icons[i] && <>{(() => { const I = icons[i]!; return <I className={`w-3 h-3 ${stage.isEnd ? 'text-green-600' : 'text-primary'}`} />; })()}</>}
              {!icons[i] && <div className={`w-2 h-2 rounded-full ${stage.isEnd ? 'bg-green-500' : 'bg-primary/50'}`} />}
            </div>
            <div className="ml-6">
              <h4 className={`font-display font-bold text-sm mb-2 ${stage.isEnd ? 'text-green-600' : 'text-foreground'}`}>{stage.label}</h4>
              {stage.content && (
                <div className="rounded-xl border border-border bg-background p-3">
                  {stage.content}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════ */
export default function FunnelFlowChart() {
  return (
    <div className="mt-4 mb-8">
      <motion.div
        className="rounded-2xl border border-border bg-background p-6 md:p-10 overflow-x-auto shadow-sm"
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <DesktopFlow />
        <MobileFlow />
      </motion.div>
    </div>
  );
}
