import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface QuizQuestionStepProps {
  question: string;
  subtext?: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const QuizQuestionStep = forwardRef<HTMLDivElement, QuizQuestionStepProps>(
  ({ question, subtext, options, selectedValue, onSelect }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg mx-auto px-4"
      >
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-5 md:p-6 min-h-[280px]">
          {question && (
            <div className="mb-4 text-center">
              <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground leading-snug">
                {question}
              </h2>
              {subtext && (
                <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">
                  {subtext}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => onSelect(option)}
                className={`
                  w-full px-4 py-3 rounded-xl border text-center font-medium
                  transition-all duration-150
                  ${selectedValue === option
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-foreground'
                  }
                `}
              >
                <span className="text-sm md:text-[15px]">{option}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
);

QuizQuestionStep.displayName = 'QuizQuestionStep';
