import { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useClients';
import { useQuizFunnels, useCreateQuizFunnel, useDeleteQuizFunnel, QuizFunnel } from '@/hooks/useQuizFunnels';
import { QuizFunnelEditor } from './QuizFunnelEditor';
import { QuizStatsPanel } from './QuizStatsPanel';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink, Trash2, BarChart3, Edit, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function QuizBuilderTab() {
  const { data: clients = [] } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingFunnel, setEditingFunnel] = useState<QuizFunnel | null>(null);
  const [viewingStats, setViewingStats] = useState<QuizFunnel | null>(null);

  const { data: funnels = [], isLoading } = useQuizFunnels(selectedClientId || undefined);
  const createFunnel = useCreateQuizFunnel();
  const deleteFunnel = useDeleteQuizFunnel();

  const allFunnels = useQuizFunnels();
  const displayFunnels = selectedClientId ? funnels : (allFunnels.data || []);

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [clients]);

  const handleCreate = async () => {
    if (!selectedClientId) {
      toast.error('Select a client first');
      return;
    }
    const client = clients.find(c => c.id === selectedClientId);
    try {
      const result = await createFunnel.mutateAsync({
        client_id: selectedClientId,
        name: `${client?.name || 'New'} Quiz`,
        title: `Invest in ${client?.name || 'Opportunity'}`,
        subtitle: 'Answer a few quick questions to see if you qualify.',
        hero_heading: `Invest in ${client?.name || 'Opportunity'}`,
        hero_description: client?.offer_description || 'A premium investment opportunity backed by an experienced team.',
        brand_name: client?.name || null,
        slug: (client?.slug || client?.name || 'quiz').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      });
      setEditingFunnel(result);
      toast.success('Quiz funnel created');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create quiz');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFunnel.mutateAsync(id);
      toast.success('Quiz funnel deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleCopyLink = (funnel: QuizFunnel) => {
    const url = `${window.location.origin}/quiz/${funnel.slug || funnel.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Quiz link copied!');
  };

  if (editingFunnel) {
    return (
      <QuizFunnelEditor
        funnel={editingFunnel}
        onBack={() => setEditingFunnel(null)}
      />
    );
  }

  if (viewingStats) {
    return (
      <QuizStatsPanel
        funnel={viewingStats}
        onBack={() => setViewingStats(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Quiz Builder</h2>
          <p className="text-sm text-muted-foreground">
            Create multi-step qualifying quiz funnels for each client
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedClientId || ''} onValueChange={(v) => setSelectedClientId(v || null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={!selectedClientId || createFunnel.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            New Quiz
          </Button>
        </div>
      </div>

      {displayFunnels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">No quiz funnels yet</p>
            <p className="text-sm text-muted-foreground">Select a client and create a new quiz funnel to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayFunnels.map(funnel => (
            <Card key={funnel.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{funnel.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{clientMap[funnel.client_id] || 'Unknown'}</p>
                  </div>
                  <Badge variant={funnel.is_active ? 'default' : 'secondary'}>
                    {funnel.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {(funnel.questions as any[])?.length || 0} questions · {funnel.collect_contact ? 'Contact form' : 'No contact'} · {funnel.show_calendar ? 'Calendar' : 'No calendar'}
                </div>
                {funnel.slug && (
                  <p className="text-xs font-mono text-muted-foreground truncate">/quiz/{funnel.slug}</p>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingFunnel(funnel)}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setViewingStats(funnel)}>
                    <BarChart3 className="h-3.5 w-3.5 mr-1" />
                    Stats
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleCopyLink(funnel)}>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Link
                  </Button>
                  {funnel.slug && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/quiz/${funnel.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete quiz funnel?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this quiz and all its submissions.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(funnel.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
