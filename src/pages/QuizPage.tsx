import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Users, ArrowRight, CheckCircle, TrendingUp, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuizFunnelBySlug, useCreateQuizSubmission, useUpdateQuizSubmission, QuizQuestion } from '@/hooks/useQuizFunnels';
import { QuizQuestionStep } from '@/components/quiz/public/QuizQuestionStep';
import { QuizContactForm, QuizContactData } from '@/components/quiz/public/QuizContactForm';
import { QuizScheduleStep } from '@/components/quiz/public/QuizScheduleStep';
import { CashBagLoader } from '@/components/ui/CashBagLoader';

type Phase = 'landing' | 'quiz' | 'contact' | 'calendar' | 'thanks' | 'dq';

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { data: funnel, isLoading } = useQuizFunnelBySlug(slug);
  const createSubmission = useCreateQuizSubmission();
  const updateSubmission = useUpdateQuizSubmission();

  const [phase, setPhase] = useState<Phase>('landing');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const questions: QuizQuestion[] = (funnel?.questions as QuizQuestion[]) || [];
  const totalSteps = questions.length + (funnel?.collect_contact ? 1 : 0) + (funnel?.show_calendar ? 1 : 0);

  const getCurrentStepIndex = () => {
    if (phase === 'quiz') return currentQ;
    if (phase === 'contact') return questions.length;
    if (phase === 'calendar') return questions.length + (funnel?.collect_contact ? 1 : 0);
    return 0;
  };

  // Create submission when quiz starts
  const startQuiz = async () => {
    if (!funnel) return;
    try {
      const result = await createSubmission.mutateAsync({
        quiz_funnel_id: funnel.id,
        client_id: funnel.client_id,
        utm_source: searchParams.get('utm_source') || null,
        utm_medium: searchParams.get('utm_medium') || null,
        utm_campaign: searchParams.get('utm_campaign') || null,
        utm_content: searchParams.get('utm_content') || null,
        utm_term: searchParams.get('utm_term') || null,
      });
      setSubmissionId(result.id);
    } catch (e) {
      console.error('Failed to create submission', e);
    }
    setPhase('quiz');
  };

  const handleAnswer = async (value: string) => {
    const key = `q${currentQ}`;
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    // Update submission
    if (submissionId) {
      updateSubmission.mutate({ id: submissionId, answers: newAnswers, step_reached: currentQ + 1 });
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else if (funnel?.collect_contact) {
        setPhase('contact');
      } else if (funnel?.show_calendar) {
        setPhase('calendar');
      } else {
        if (submissionId) updateSubmission.mutate({ id: submissionId, completed: true });
        setPhase('thanks');
      }
    }, 300);
  };

  const handleContact = async (data: QuizContactData) => {
    if (submissionId) {
      await updateSubmission.mutateAsync({
        id: submissionId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        step_reached: questions.length + 1,
      });
    }
    if (funnel?.show_calendar) {
      setPhase('calendar');
    } else {
      if (submissionId) updateSubmission.mutate({ id: submissionId, completed: true });
      setPhase('thanks');
    }
  };

  const handleBooking = async (date: Date, time: string) => {
    if (submissionId) {
      await updateSubmission.mutateAsync({
        id: submissionId,
        booking_date: date.toISOString(),
        booking_time: time,
        completed: true,
        step_reached: totalSteps,
      });
    }
    setPhase('thanks');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CashBagLoader message="Loading..." />
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    );
  }

  const heroStats = (funnel.hero_stats as Array<{ value: string; label: string }>) || [];
  const brandName = funnel.brand_name || 'Quiz';

  // ─── LANDING PAGE ───
  if (phase === 'landing') {
    return (
      <div className="min-h-screen bg-background">
        <motion.nav initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
          className="border-b border-border bg-card">
          <div className="container flex h-14 items-center justify-center">
            {funnel.brand_logo_url ? (
              <img src={funnel.brand_logo_url} alt={brandName} className="h-8" />
            ) : (
              <span className="font-heading text-xl tracking-[0.3em] uppercase text-foreground">{brandName}</span>
            )}
          </div>
        </motion.nav>

        <section className="py-20 md:py-28">
          <div className="container max-w-3xl text-center">
            {funnel.badge_text && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {funnel.badge_text}
              </motion.div>
            )}

            <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="font-heading text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              {funnel.hero_heading || funnel.title}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
              {funnel.hero_description || funnel.subtitle}
            </motion.p>

            {heroStats.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="grid max-w-lg mx-auto mb-10 border border-border rounded-lg overflow-hidden bg-card"
                style={{ gridTemplateColumns: `repeat(${Math.min(heroStats.length, 4)}, 1fr)` }}>
                {heroStats.map((stat, i) => (
                  <div key={stat.label} className={`p-5 ${i < heroStats.length - 1 ? 'border-r border-border' : ''}`}>
                    <p className="text-2xl md:text-3xl font-heading text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Button size="lg" className="w-full max-w-md h-14 text-base rounded-lg" onClick={startQuiz}>
                {funnel.cta_text || 'See If You Qualify'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-6 mt-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />SEC Compliant</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />500+ Investors</span>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="text-xs text-muted-foreground mt-3">Takes less than 60 seconds</motion.p>
          </div>
        </section>

        {funnel.disclaimer_text && (
          <footer className="py-10">
            <div className="container">
              <p className="text-xs text-muted-foreground mb-6">© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
              <div className="text-[11px] text-muted-foreground leading-relaxed max-w-4xl">
                <p><strong>Investment Disclaimer:</strong> {funnel.disclaimer_text}</p>
              </div>
            </div>
          </footer>
        )}
      </div>
    );
  }

  // ─── THANK YOU ───
  if (phase === 'thanks') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="border-b border-border bg-card">
          <div className="container flex h-14 items-center justify-center">
            <span className="font-heading text-xl tracking-[0.3em] uppercase text-foreground">{brandName}</span>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="container max-w-lg text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-8">
              <CheckCircle className="h-10 w-10 text-primary" />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="font-heading text-3xl md:text-4xl mb-4">
              {funnel.thank_you_heading || "You're All Set!"}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-muted-foreground text-base md:text-lg leading-relaxed">
              {funnel.thank_you_message || 'Our team will be in touch shortly.'}
            </motion.p>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ / CONTACT / CALENDAR FLOW ───
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.nav initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="border-b border-border bg-card">
        <div className="container flex h-14 items-center justify-center">
          <span className="font-heading text-xl tracking-[0.3em] uppercase text-foreground">{brandName}</span>
        </div>
      </motion.nav>

      <main className="flex-1 flex flex-col items-center py-8 md:py-12 px-4">
        <div className="text-center mb-6 md:mb-8 max-w-xl w-full">
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 leading-tight">
            {funnel.title}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-muted-foreground text-base md:text-lg">
            {funnel.subtitle}
          </motion.p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, step) => {
            const current = getCurrentStepIndex();
            return (
              <div key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === current ? 'w-8 bg-primary' : step < current ? 'w-2 bg-primary/50' : 'w-2 bg-border'
                }`} />
            );
          })}
        </div>

        <div className="flex-1 flex items-start justify-center w-full pt-2">
          <AnimatePresence mode="wait">
            {phase === 'quiz' && questions[currentQ] && (
              <QuizQuestionStep
                key={`q-${currentQ}`}
                question={questions[currentQ].question}
                subtext={questions[currentQ].subtext}
                options={questions[currentQ].options}
                selectedValue={answers[`q${currentQ}`] || ''}
                onSelect={handleAnswer}
              />
            )}
            {phase === 'contact' && (
              <QuizContactForm key="contact" onSubmit={handleContact} />
            )}
            {phase === 'calendar' && (
              <QuizScheduleStep key="calendar" onConfirm={handleBooking} calendarUrl={funnel.calendar_url} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
