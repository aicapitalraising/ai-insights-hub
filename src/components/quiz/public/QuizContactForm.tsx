import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Loader2 } from 'lucide-react';

export interface QuizContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface QuizContactFormProps {
  onSubmit: (data: QuizContactData) => void;
}

function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  let nationalDigits = digits;
  let prefix = '';
  if (digits.length > 10 && digits.startsWith('1')) {
    prefix = '+1 ';
    nationalDigits = digits.slice(1);
  }
  if (nationalDigits.length <= 3) return prefix + `(${nationalDigits}`;
  if (nationalDigits.length <= 6) return prefix + `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3)}`;
  return prefix + `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3, 6)}-${nationalDigits.slice(6, 10)}`;
}

export const QuizContactForm = forwardRef<HTMLDivElement, QuizContactFormProps>(
  ({ onSubmit }, ref) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
      const newErrors: Record<string, string> = {};
      if (!formData.fullName.trim()) newErrors.fullName = 'Required';
      if (!formData.email.trim()) {
        newErrors.email = 'Required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Required';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      setIsSubmitting(true);
      const { firstName, lastName } = parseFullName(formData.fullName);
      onSubmit({ firstName, lastName, email: formData.email, phone: formData.phone });
      setIsSubmitting(false);
    };

    return (
      <motion.div ref={ref} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="w-full max-w-xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-foreground mb-8 text-center">
          Your Contact Information
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2"><User className="w-4 h-4" /> Full Name</Label>
            <Input id="fullName" autoComplete="name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Smith" className={errors.fullName ? 'border-destructive' : ''} />
            {errors.fullName && <span className="text-xs text-destructive">{errors.fullName}</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email Address</Label>
            <Input id="email" type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className={errors.email ? 'border-destructive' : ''} />
            {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</Label>
            <Input id="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })} placeholder="(555) 123-4567" className={errors.phone ? 'border-destructive' : ''} />
            {errors.phone && <span className="text-xs text-destructive">{errors.phone}</span>}
          </div>
          <div className="pt-4 flex flex-col items-center gap-3">
            <Button type="submit" size="lg" className="min-w-40" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Continue'}
            </Button>
          </div>
        </form>
      </motion.div>
    );
  }
);

QuizContactForm.displayName = 'QuizContactForm';
