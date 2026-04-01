import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AGENT_TEMPLATES } from '@/hooks/useAgents';

interface Props {
  onSelect: (templateKey: string) => void;
}

export function AgentTemplateGallery({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {AGENT_TEMPLATES.map((t) => (
        <Card key={t.key} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{t.icon}</span>
              <h3 className="font-semibold text-sm">{t.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{t.description}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {t.connectors.map((c) => (
                <span key={c} className="px-2 py-0.5 bg-muted rounded text-[10px] font-medium">{c}</span>
              ))}
            </div>
            <Button size="sm" className="w-full" onClick={() => onSelect(t.key)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Agent
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
