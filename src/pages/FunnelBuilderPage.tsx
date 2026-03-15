import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useClients } from '@/hooks/useClients';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Globe, BookOpen, Calendar, DollarSign, Users,
  Settings, Eye, Plus, ExternalLink, Copy, CheckCircle2,
  ArrowRight, Zap, HelpCircle
} from 'lucide-react';

type FunnelStepType = 'landing' | 'quiz' | 'booking' | 'deck' | 'invest' | 'onboarding' | 'fulfillment' | 'kickoff';

interface FunnelStep {
  id: string;
  type: FunnelStepType;
  label: string;
  icon: React.ElementType;
  description: string;
  status: 'live' | 'draft' | 'disabled';
  conversionRate?: number;
  visitors?: number;
}

const STEP_TEMPLATES: FunnelStep[] = [
  { id: 'landing', type: 'landing', label: 'Landing Page', icon: Globe, description: 'Main entry point with hero, social proof, and CTA', status: 'live', conversionRate: 12.4, visitors: 1240 },
  { id: 'quiz', type: 'quiz', label: 'Quiz / Qualifier', icon: HelpCircle, description: 'Multi-step quiz to qualify leads before booking', status: 'live', conversionRate: 68.2, visitors: 854 },
  { id: 'booking', type: 'booking', label: 'Booking Page', icon: Calendar, description: 'Calendar booking with phone capture and confirmation', status: 'live', conversionRate: 42.1, visitors: 582 },
  { id: 'deck', type: 'deck', label: 'Sales Deck', icon: BookOpen, description: 'Interactive pitch deck with calculators and case studies', status: 'live', conversionRate: 31.5, visitors: 245 },
  { id: 'invest', type: 'invest', label: 'Investment Page', icon: DollarSign, description: 'Payment collection with Stripe integration', status: 'draft', conversionRate: 18.3, visitors: 77 },
  { id: 'onboarding', type: 'onboarding', label: 'Onboarding', icon: Users, description: 'Multi-step client onboarding wizard', status: 'live', conversionRate: 89.4, visitors: 14 },
  { id: 'fulfillment', type: 'fulfillment', label: 'Fulfillment', icon: CheckCircle2, description: 'Client portal with deliverables and progress tracking', status: 'draft' },
  { id: 'kickoff', type: 'kickoff', label: 'Kickoff', icon: Zap, description: 'Kickoff call scheduling and prep materials', status: 'draft' },
];

const QUIZ_TEMPLATES = [
  { id: 'investor-qualifier', name: 'Investor Qualifier', description: 'Qualify accredited investors for fund opportunities', questions: 6, avgCompletion: '2.5 min', conversionLift: '+34%' },
  { id: 'agency-fit', name: 'Agency Fit Quiz', description: 'Qualify prospects for agency services', questions: 5, avgCompletion: '2 min', conversionLift: '+28%' },
  { id: 'real-estate-fund', name: 'Real Estate Fund Qualifier', description: 'Qualify investors for real estate syndications', questions: 7, avgCompletion: '3 min', conversionLift: '+41%' },
];

function FunnelFlowVisual({ steps }: { steps: FunnelStep[] }) {
  const liveSteps = steps.filter(s => s.status === 'live');
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {liveSteps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <step.icon className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{step.label}</span>
            {step.conversionRate && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0">{step.conversionRate}%</Badge>
            )}
          </div>
          {i < liveSteps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mb-4" />}
        </div>
      ))}
    </div>
  );
}

export default function FunnelBuilderPage() {
  const { data: clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  const selectedClient = clients?.find(c => c.id === selectedClientId);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Funnel Builder</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Build, manage, and optimize client funnels with quiz qualification</p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Funnel
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium shrink-0">Client</Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {clients?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClient && <Badge variant="outline" className="text-xs">{selectedClient.name}</Badge>}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Funnel Overview</TabsTrigger>
            <TabsTrigger value="quiz">Quiz Builder</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">Funnel Flow</h3>
              <FunnelFlowVisual steps={STEP_TEMPLATES} />
            </Card>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Visitors', value: '1,240', change: '+12%' },
                { label: 'Quiz Completions', value: '854', change: '+8%' },
                { label: 'Calls Booked', value: '245', change: '+23%' },
                { label: 'Conversion Rate', value: '19.8%', change: '+3.2%' },
              ].map(m => (
                <Card key={m.label} className="p-4">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-semibold mt-1">{m.value}</p>
                  <p className="text-xs text-green-500 mt-0.5">{m.change} this week</p>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {STEP_TEMPLATES.map(step => (
                <Card key={step.id} className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{step.label}</span>
                      <Badge variant={step.status === 'live' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    {step.visitors && (
                      <p className="text-xs text-muted-foreground mt-1">{step.visitors.toLocaleString()} visitors · {step.conversionRate}% CVR</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Quiz Templates</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pre-built quiz flows that qualify leads before booking</p>
              </div>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-3.5 h-3.5" />
                Custom Quiz
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {QUIZ_TEMPLATES.map(t => (
                <Card key={t.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">{t.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{t.conversionLift}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{t.questions} questions</span>
                    <span>·</span>
                    <span>{t.avgCompletion}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7 text-xs">Use Template</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs">Preview</Button>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">Quiz Builder — Active Questions</h3>
              <div className="space-y-3">
                {[
                  { q: 'Are you an accredited investor?', type: 'Yes/No', required: true },
                  { q: 'What is your investment experience?', type: 'Multiple Choice', required: true },
                  { q: 'How much are you looking to invest?', type: 'Range Slider', required: true },
                  { q: 'What is your primary investment goal?', type: 'Multiple Choice', required: false },
                  { q: 'What is your timeline?', type: 'Multiple Choice', required: false },
                  { q: 'How did you hear about us?', type: 'Dropdown', required: false },
                ].map((q, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{q.q}</p>
                      <p className="text-xs text-muted-foreground">{q.type}</p>
                    </div>
                    {q.required && <Badge variant="outline" className="text-[10px] px-1.5">Required</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
                  <Plus className="w-3.5 h-3.5" />
                  Add Question
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {STEP_TEMPLATES.map(step => (
                <Card key={step.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <step.icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{step.label}</span>
                      <Badge variant={step.status === 'live' ? 'default' : 'secondary'} className="text-[10px]">
                        {step.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">Edit Page</Button>
                    <Button size="sm" className="flex-1 h-7 text-xs">{step.status === 'live' ? 'View Live' : 'Publish'}</Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3">Funnel Drop-off</h3>
                <div className="space-y-2">
                  {STEP_TEMPLATES.filter(s => s.visitors).map(step => (
                    <div key={step.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">{step.label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: `${((step.visitors || 0) / 1240) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono w-12 text-right">{step.visitors?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3">Quiz Drop-off by Question</h3>
                <div className="space-y-2">
                  {[
                    { q: 'Accredited investor?', dropoff: 8 },
                    { q: 'Investment experience?', dropoff: 12 },
                    { q: 'Investment amount?', dropoff: 6 },
                    { q: 'Primary goal?', dropoff: 4 },
                    { q: 'Timeline?', dropoff: 2 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground flex-1 truncate">{item.q}</span>
                      <span className="text-xs text-red-400">-{item.dropoff}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Funnel Settings</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Custom Domain', 'Meta Pixel', 'GHL Webhook', 'Stripe Integration', 'Email Notifications', 'SMS Alerts'].map(s => (
                  <div key={s} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <span className="text-sm font-medium">{s}</span>
                    <Badge variant="outline" className="text-[10px]">Configure</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
