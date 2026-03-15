import logo from '@/assets/logo-aicra.png';

export default function Footer() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const links = [
    { label: 'Track Record', id: 'track-record' },
    { label: 'Services', id: 'services' },
    { label: 'Transactions', id: 'transactions' },
    { label: 'About', id: 'about' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <footer className="border-t border-border py-12 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <img src={logo} alt="AI Capital Raising Accelerator" className="h-8" />
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            This site is operated by High Performance Ads. All investment opportunities referenced are provided by third-party fund managers. Past performance does not guarantee future results. All investments carry risk.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="text-xs text-muted-foreground">Terms & Conditions</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Privacy Policy</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">© {new Date().getFullYear()} AI Capital Raising. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
