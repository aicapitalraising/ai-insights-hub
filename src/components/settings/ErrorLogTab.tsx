import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, RefreshCw, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface ErrorEntry {
  id: string;
  timestamp: string;
  message: string;
  source?: string;
  stack?: string;
}

// Global error collector
const errorStore: ErrorEntry[] = [];
let listeners: (() => void)[] = [];

function addError(entry: ErrorEntry) {
  errorStore.unshift(entry);
  if (errorStore.length > 100) errorStore.pop();
  listeners.forEach(fn => fn());
}

// Install global interceptors once
let installed = false;
function installInterceptors() {
  if (installed) return;
  installed = true;

  // Catch unhandled errors
  window.addEventListener('error', (e) => {
    addError({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: e.message || String(e.error),
      source: e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined,
      stack: e.error?.stack,
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    addError({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: msg,
      source: 'Promise rejection',
      stack: e.reason?.stack,
    });
  });

  // Intercept console.error
  const origError = console.error;
  console.error = (...args: any[]) => {
    origError.apply(console, args);
    const msg = args.map(a => {
      if (a instanceof Error) return a.message;
      if (typeof a === 'object') try { return JSON.stringify(a); } catch { return String(a); }
      return String(a);
    }).join(' ');
    addError({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: msg,
      source: 'console.error',
    });
  };

  // Intercept fetch errors
  const origFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const res = await origFetch(...args);
      if (!res.ok && res.status >= 400) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        let body = '';
        try { body = await res.clone().text(); } catch {}
        addError({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: `HTTP ${res.status}: ${url}`,
          source: 'fetch',
          stack: body.slice(0, 500),
        });
      }
      return res;
    } catch (err) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      addError({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `Network error: ${url} — ${err instanceof Error ? err.message : String(err)}`,
        source: 'fetch',
      });
      throw err;
    }
  };
}

function generateFixPrompt(errors: ErrorEntry[]): string {
  if (errors.length === 0) return 'No errors to report.';

  const grouped = errors.reduce((acc, e) => {
    const key = e.message.slice(0, 80);
    if (!acc[key]) acc[key] = { count: 0, entry: e };
    acc[key].count++;
    return acc;
  }, {} as Record<string, { count: number; entry: ErrorEntry }>);

  let prompt = `I'm seeing the following errors in my app. Please help me fix them:\n\n`;

  Object.values(grouped).forEach(({ count, entry }, i) => {
    prompt += `### Error ${i + 1}${count > 1 ? ` (×${count})` : ''}\n`;
    prompt += `**Message:** ${entry.message}\n`;
    if (entry.source) prompt += `**Source:** ${entry.source}\n`;
    if (entry.stack) prompt += `**Details:**\n\`\`\`\n${entry.stack.slice(0, 300)}\n\`\`\`\n`;
    prompt += '\n';
  });

  prompt += `Please analyze each error, identify root causes, and provide specific code fixes.`;
  return prompt;
}

export function ErrorLogTab() {
  const [errors, setErrors] = useState<ErrorEntry[]>([...errorStore]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  useEffect(() => {
    installInterceptors();
    const update = () => setErrors([...errorStore]);
    listeners.push(update);
    return () => { listeners = listeners.filter(fn => fn !== update); };
  }, []);

  const handleClear = useCallback(() => {
    errorStore.length = 0;
    setErrors([]);
    setGeneratedPrompt('');
    toast.success('Error log cleared');
  }, []);

  const handleGenerate = useCallback(() => {
    const prompt = generateFixPrompt(errors);
    setGeneratedPrompt(prompt);
    toast.success('Fix prompt generated');
  }, [errors]);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Error Log</h4>
          <p className="text-sm text-muted-foreground">
            Captures runtime errors, failed requests & console errors
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} disabled={errors.length === 0}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
          <Button variant="outline" size="sm" onClick={() => setErrors([...errorStore])}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Error list */}
      <ScrollArea className="h-[240px] border border-border rounded-md">
        {errors.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-8">
            No errors captured yet. Errors will appear here automatically.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {errors.map((err) => (
              <div key={err.id} className="p-3 text-xs space-y-1 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-destructive break-all leading-relaxed">
                    {err.message.slice(0, 200)}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {new Date(err.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
                {err.source && (
                  <div className="text-muted-foreground font-mono text-[10px]">{err.source}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Auto prompt generator */}
      <div className="border-2 border-border rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Auto Fix Prompt
          </h4>
          <Button size="sm" onClick={handleGenerate} disabled={errors.length === 0}>
            <Wand2 className="h-3.5 w-3.5 mr-1" /> Generate Prompt
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate a copy-paste prompt from captured errors to quickly get fixes from AI
        </p>

        {generatedPrompt && (
          <>
            <Textarea
              value={generatedPrompt}
              readOnly
              rows={8}
              className="font-mono text-xs bg-muted/30"
            />
            <Button size="sm" variant="outline" onClick={() => handleCopy(generatedPrompt)} className="w-full">
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy Prompt to Clipboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
