import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ConnectionStatus = 'success' | 'error' | 'pending' | 'not_configured';

interface ApiConnectionStatusProps {
  contacts: ConnectionStatus;
  calendars: ConnectionStatus;
  opportunities: ConnectionStatus;
  errors?: {
    contacts?: string;
    calendars?: string;
    opportunities?: string;
  };
  compact?: boolean;
}

function StatusIcon({ status, error }: { status: ConnectionStatus; error?: string }) {
  if (status === 'pending') {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  }
  if (status === 'success') {
    return <CheckCircle className="h-3 w-3 text-chart-2" />;
  }
  if (status === 'error') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <XCircle className="h-3 w-3 text-destructive cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{error || 'Connection failed'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
}

export function ApiConnectionStatus({
  contacts,
  calendars,
  opportunities,
  errors = {},
  compact = true,
}: ApiConnectionStatusProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-muted-foreground">C</span>
                <StatusIcon status={contacts} error={errors.contacts} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Contacts: {contacts}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-muted-foreground">Cal</span>
                <StatusIcon status={calendars} error={errors.calendars} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Calendars: {calendars}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-muted-foreground">O</span>
                <StatusIcon status={opportunities} error={errors.opportunities} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Opportunities: {opportunities}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <StatusIcon status={contacts} error={errors.contacts} />
        <span className="text-sm">Contacts</span>
        {contacts === 'error' && errors.contacts && (
          <span className="text-xs text-destructive">{errors.contacts}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon status={calendars} error={errors.calendars} />
        <span className="text-sm">Calendars</span>
        {calendars === 'error' && errors.calendars && (
          <span className="text-xs text-destructive">{errors.calendars}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon status={opportunities} error={errors.opportunities} />
        <span className="text-sm">Opportunities</span>
        {opportunities === 'error' && errors.opportunities && (
          <span className="text-xs text-destructive">{errors.opportunities}</span>
        )}
      </div>
    </div>
  );
}
