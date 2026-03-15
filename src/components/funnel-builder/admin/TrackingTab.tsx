import { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const trackingData = [
  { page: 'Landing Page', path: '/', ua: 'UA-AICRA-001', pixel: 'FB-9283746501', gtm: 'GTM-AICRA01' },
  { page: 'Investor Deck', path: '/deck', ua: 'UA-AICRA-002', pixel: 'FB-9283746502', gtm: 'GTM-AICRA02' },
  { page: 'Client Hub', path: '/client', ua: 'UA-AICRA-003', pixel: 'FB-9283746503', gtm: 'GTM-AICRA03' },
  { page: 'Booking Page', path: '/booking-page', ua: 'UA-AICRA-006', pixel: 'FB-9283746506', gtm: 'GTM-AICRA06' },
  { page: 'Access Setup', path: '/access', ua: 'UA-AICRA-004', pixel: 'FB-9283746504', gtm: 'GTM-AICRA04' },
  { page: 'Kickoff Call', path: '/kickoff', ua: 'UA-AICRA-005', pixel: 'FB-9283746505', gtm: 'GTM-AICRA05' },
];

export function TrackingTab() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(val);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Tracking codes and pixel IDs for each page. Click to copy.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {trackingData.map((t) => (
          <Card key={t.path} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                {t.page}
                <span className="text-[10px] text-muted-foreground font-normal">{t.path}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Google Analytics', value: t.ua },
                { label: 'Facebook Pixel', value: t.pixel },
                { label: 'GTM Container', value: t.gtm },
              ].map((code) => (
                <div key={code.value} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{code.label}</p>
                    <p className="text-xs font-mono font-medium">{code.value}</p>
                  </div>
                  <button onClick={() => copy(code.value)} className="p-1 hover:bg-background rounded transition-colors">
                    {copied === code.value ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
