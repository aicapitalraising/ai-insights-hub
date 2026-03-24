import { Radio, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AdPixelSection() {
  return (
    <div className="border-t-2 border-border pt-6 mt-6">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Radio className="w-3.5 h-3.5" /> Ad Pixel Feedback Loop
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-500" /> Meta CAPI
              <Badge variant="outline" className="text-[9px] ml-auto">Not configured</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <p>Server-side conversion tracking for Meta Ads. Send lead events back to Meta for better optimization.</p>
          </CardContent>
        </Card>
        <Card className="border-border border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-red-500" /> Google Ads Offline
              <Badge variant="outline" className="text-[9px] ml-auto">Not configured</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <p>Upload offline conversion events to Google Ads for ROAS optimization.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
