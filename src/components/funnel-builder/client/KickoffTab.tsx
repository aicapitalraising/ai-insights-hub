import { Calendar, Clock, Video, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function KickoffTab() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
          <CheckCircle2 className="w-3.5 h-3.5" /> You're almost there
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
          Congratulations!
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Let's schedule your <span className="text-foreground font-semibold">Kickoff Call</span> to get started.
        </p>
        <div className="luxury-divider mt-6" />
      </section>

      {/* Call details */}
      <section className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Onboarding Call</span>
            <h3 className="font-display text-lg font-bold text-foreground mt-0.5">30-min Capital Raising Kickoff Call</h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>30 Minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="w-4 h-4 text-primary" />
                <span>Zoom Video Call</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-display text-sm font-semibold text-foreground">What we'll cover:</h4>
              <ul className="space-y-2">
                {[
                  'Review your goals and target investor profile',
                  'Walk through your ad creatives and funnel',
                  'Set up tracking and KPI benchmarks',
                  'Answer any questions about the process',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <a href="https://aicapitalraising.com/kickoff" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto font-semibold gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Your Kickoff Call
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="max-w-2xl mx-auto">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">Before Your Call</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Complete Ad Access', desc: 'Make sure you\'ve granted Facebook, Google, and LinkedIn access from the Access tab.' },
            { title: 'Prepare Your Assets', desc: 'Have your logo, brand guidelines, and any existing ad creatives ready.' },
            { title: 'Know Your Numbers', desc: 'Have your funding goal, timeline, and average investment size in mind.' },
            { title: 'Review Resources', desc: 'Check out the sales scripts and flow diagrams in the Resources tab.' },
          ].map((tip) => (
            <div key={tip.title} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all">
              <h4 className="font-display text-sm font-semibold text-foreground mb-1">{tip.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
