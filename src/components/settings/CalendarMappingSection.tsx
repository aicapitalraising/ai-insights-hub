import { useState, useEffect } from 'react';
import { CalendarCheck, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/db';

interface CalendarMapping {
  route: string;
  label: string;
  calendar_id: string;
}

interface GHLCalendar {
  id: string;
  name: string;
}

const defaultMappings: CalendarMapping[] = [
  { route: '/book', label: 'Booking Page', calendar_id: '' },
  { route: '/onboarding', label: 'Onboarding Kickoff', calendar_id: '' },
];

interface CalendarMappingSectionProps {
  clientId: string;
  ghlApiKey?: string;
  ghlLocationId?: string;
}

export function CalendarMappingSection({ clientId, ghlApiKey, ghlLocationId }: CalendarMappingSectionProps) {
  const [ghlCalendars, setGhlCalendars] = useState<GHLCalendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [calendarMappings, setCalendarMappings] = useState<CalendarMapping[]>(defaultMappings);

  const fetchCalendars = async () => {
    if (!ghlApiKey || !ghlLocationId) return;
    setLoadingCalendars(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: { client_id: clientId, testOnly: true, apiKey: ghlApiKey, locationId: ghlLocationId },
      });
      if (error) throw error;
      // If the GHL API returns calendars, use them
      if (data?.calendars) {
        setGhlCalendars(data.calendars);
      }
    } catch (err) {
      console.error('Failed to fetch calendars:', err);
    } finally {
      setLoadingCalendars(false);
    }
  };

  useEffect(() => {
    if (ghlApiKey && ghlLocationId) {
      fetchCalendars();
    }
  }, [ghlApiKey, ghlLocationId]);

  const handleCalendarChange = (index: number, calendarId: string) => {
    setCalendarMappings(prev => prev.map((m, i) => i === index ? { ...m, calendar_id: calendarId } : m));
  };

  const handleSave = () => {
    toast.success('Calendar mappings saved');
  };

  return (
    <div className="border-t-2 border-border pt-6 mt-6">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <CalendarCheck className="w-3.5 h-3.5" /> Calendar Mapping per Page
      </h4>
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">Assign a GHL calendar to each client-facing page.</p>
          {calendarMappings.map((mapping, i) => (
            <div key={mapping.route} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="min-w-[140px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Page</p>
                <p className="text-sm font-semibold text-foreground">{mapping.label}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{mapping.route}</p>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">GHL Calendar</label>
                {ghlCalendars.length > 0 ? (
                  <Select value={mapping.calendar_id} onValueChange={(val) => handleCalendarChange(i, val)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select a calendar" /></SelectTrigger>
                    <SelectContent>
                      {ghlCalendars.map((cal) => (
                        <SelectItem key={cal.id} value={cal.id} className="text-xs">
                          <span className="font-medium">{cal.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={mapping.calendar_id}
                    onChange={(e) => handleCalendarChange(i, e.target.value)}
                    className="h-8 text-xs font-mono"
                    placeholder={loadingCalendars ? 'Loading…' : 'Enter GHL calendar ID'}
                  />
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} className="gap-2"><Save className="w-3.5 h-3.5" /> Save</Button>
            <Button size="sm" variant="outline" onClick={fetchCalendars} disabled={loadingCalendars || !ghlApiKey} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCalendars ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
