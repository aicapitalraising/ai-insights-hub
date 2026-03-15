import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import logo from '@/assets/logo-aicra.png';

const navLinks = [
  { label: 'Track Record', id: 'track-record' },
  { label: 'Services', id: 'services' },
  { label: 'Transactions', id: 'transactions' },
  { label: 'About', id: 'about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <motion.header
        className={`w-full transition-all duration-700 ease-out ${
          scrolled
            ? 'mt-4 mx-4 rounded-2xl bg-background/70 backdrop-blur-2xl border border-border/60 shadow-[0_8px_32px_-8px_rgb(0_0_0/0.08),0_2px_8px_-2px_rgb(0_0_0/0.04)]'
            : 'mt-0 mx-0 rounded-none bg-background/80 backdrop-blur-lg md:bg-transparent md:backdrop-blur-none border border-transparent shadow-none'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: scrolled ? 'min(calc(100% - 2rem), 72rem)' : '100%',
        }}
      >
        <div className="px-6 h-14 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logo} alt="AI Capital Raising Accelerator" className="h-8" />
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
            <Button
              size="sm"
              onClick={() => scrollTo('contact')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg"
            >
              Get Started
            </Button>
          </nav>

          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden px-6 pb-6 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="flex flex-col gap-4 pt-2 border-t border-border/40">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left py-2"
                  >
                    {link.label}
                  </button>
                ))}
                <Button
                  onClick={() => scrollTo('contact')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mt-2 rounded-lg"
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}
