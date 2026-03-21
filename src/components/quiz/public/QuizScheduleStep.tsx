import { useState, useMemo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfWeek, isSameDay, isWeekend, isBefore, startOfDay } from 'date-fns';

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
];

interface QuizScheduleStepProps {
  onConfirm: (date: Date, time: string) => void;
  calendarUrl?: string | null;
}

export const QuizScheduleStep = forwardRef<HTMLDivElement, QuizScheduleStepProps>(
  ({ onConfirm, calendarUrl }, ref) => {
    // If external calendar URL, show an iframe
    if (calendarUrl) {
      return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
            <div className="bg-primary/5 p-6 text-center border-b border-border">
              <CalendarIcon className="w-7 h-7 text-primary mx-auto mb-2" />
              <h2 className="text-2xl font-heading font-semibold">Schedule Your Call</h2>
            </div>
            <iframe src={calendarUrl} className="w-full h-[600px] border-0" title="Schedule" />
          </div>
        </motion.div>
      );
    }

    const today = startOfDay(new Date());
    const [weekStart, setWeekStart] = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const hasPrevWeek = useMemo(() => {
      const prev = addDays(weekStart, -7);
      return Array.from({ length: 7 }, (_, i) => addDays(prev, i)).some(d => !isWeekend(d) && !isBefore(d, today));
    }, [weekStart, today]);

    const weekRange = `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;

    return (
      <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
        className="w-full max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
          <div className="bg-primary/5 p-6 text-center border-b border-border">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-semibold text-foreground">Schedule Your Call</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">Pick a time that works for you.</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              {hasPrevWeek ? (
                <Button variant="ghost" size="sm" onClick={() => { setWeekStart(addDays(weekStart, -7)); setSelectedDate(null); setSelectedTime(null); }}>
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
              ) : <div className="w-20" />}
              <span className="font-semibold text-foreground text-lg">{weekRange}</span>
              <Button variant="ghost" size="sm" onClick={() => { setWeekStart(addDays(weekStart, 7)); setSelectedDate(null); setSelectedTime(null); }}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-6">
              {weekDays.map(day => {
                const disabled = isWeekend(day) || isBefore(day, today);
                const selected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button key={day.toISOString()} disabled={disabled}
                    onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                    className={`relative rounded-xl text-center transition-all border-2 p-3
                      ${disabled ? 'opacity-30 cursor-not-allowed border-transparent bg-muted/30' : 'cursor-pointer hover:shadow-md'}
                      ${selected ? 'bg-primary text-primary-foreground border-primary shadow-md' : !disabled ? 'bg-card border-border hover:border-primary/50' : ''}
                    `}>
                    <div className={`font-medium mb-1 text-xs ${selected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{format(day, 'EEE')}</div>
                    <div className={`font-bold text-xl ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{format(day, 'd')}</div>
                    {selected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-primary-foreground rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Available Times for {format(selectedDate, 'EEEE, MMMM d')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-1">
                  {timeSlots.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)}
                      className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                        ${selectedTime === time ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'}
                      `}>{time}</button>
                  ))}
                </div>
              </motion.div>
            )}

            <Button className="w-full h-12 text-base font-semibold"
              onClick={() => selectedDate && selectedTime && onConfirm(selectedDate, selectedTime)}
              disabled={!selectedDate || !selectedTime}>
              Confirm Booking
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }
);

QuizScheduleStep.displayName = 'QuizScheduleStep';
