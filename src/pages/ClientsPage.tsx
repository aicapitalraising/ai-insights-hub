import { useState, useCallback, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientCard } from '@/components/clients/ClientCard';
import { ClientForm } from '@/components/clients/ClientForm';
import { ClientOnboardingWizard } from '@/components/clients/ClientOnboardingWizard';
import { QuickGenerateDialog } from '@/components/clients/QuickGenerateDialog';
import { ClientCardSkeletonGrid } from '@/components/ui/LoadingSkeletons';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { useSeedOnboardingTasks } from '@/hooks/useOnboardingTasks';
import { getTemplatesForClientType } from '@/lib/onboardingTaskTemplates';
import { slugify } from '@/lib/slugify';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Users, Search, ArrowUpDown } from 'lucide-react';
import { Client } from '@/types';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SortMode = 'newest' | 'alpha' | 'most-assets';

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);

  // Auto-open wizard when navigating with ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setWizardOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [quickGenClient, setQuickGenClient] = useState<Client | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const seedOnboardingTasks = useSeedOnboardingTasks();

  // Auto-backfill slugs for existing clients missing them
  useEffect(() => {
    if (!clients) return;
    const missing = clients.filter(c => !c.slug);
    if (missing.length === 0) return;
    (async () => {
      for (const c of missing) {
        const slug = slugify(c.name);
        await supabase.from('clients').update({ slug }).eq('id', c.id);
      }
      console.log(`[Slugify] Backfilled slugs for ${missing.length} clients`);
    })();
  }, [clients]);

  // Fetch project counts per client
  const { data: projectCounts = {} } = useQuery({
    queryKey: ['client-project-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('client_id');
      const counts: Record<string, number> = {};
      (data || []).forEach(p => { counts[p.client_id] = (counts[p.client_id] || 0) + 1; });
      return counts;
    },
  });

  // Fetch asset counts per client
  const { data: assetCounts = {} } = useQuery({
    queryKey: ['client-asset-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('assets').select('client_id').not('client_id', 'is', null);
      const counts: Record<string, number> = {};
      (data || []).forEach(a => { if (a.client_id) counts[a.client_id] = (counts[a.client_id] || 0) + 1; });
      return counts;
    },
  });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    let filtered = clients;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    }
    const sorted = [...filtered];
    switch (sortMode) {
      case 'alpha': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'most-assets': sorted.sort((a, b) => (assetCounts[b.id] || 0) - (assetCounts[a.id] || 0)); break;
      case 'newest': default: sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return sorted;
  }, [clients, searchQuery, sortMode, assetCounts]);

  const handleCreate = useCallback(() => setWizardOpen(true), []);

  useKeyboardShortcuts({
    onNewClient: handleCreate,
    onQuickGenerate: () => {
      if (clients && clients.length > 0) setQuickGenClient(clients[0]);
    },
  });

  const handleEdit = (client: Client) => { setEditingClient(client); setEditFormOpen(true); };
  const handleDelete = (client: Client) => setDeletingClient(client);
  const handleQuickGenerate = (client: Client) => setQuickGenClient(client);

  const handleWizardSubmit = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Auto-generate slug from client name if not set
      const slug = (data as any).slug || slugify(data.name);
      const newClient = await createClient.mutateAsync({ ...data, slug } as any);
      // Auto-seed onboarding tasks
      try {
        const templates = getTemplatesForClientType((data as any).client_type);
        await seedOnboardingTasks.mutateAsync({ clientId: newClient.id, tasks: templates });
      } catch (e) {
        console.error('Failed to seed onboarding tasks:', e);
      }
      toast.success('Client created');
      setWizardOpen(false);
      navigate(`/clients/${newClient.id}`);
    } catch { toast.error('Failed to create client'); }
  };

  const handleEditSubmit = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingClient) return;
    try {
      await updateClient.mutateAsync({ id: editingClient.id, ...data });
      toast.success('Client updated');
      setEditFormOpen(false);
      setEditingClient(null);
    } catch { toast.error('Failed to save client'); }
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;
    try {
      await deleteClient.mutateAsync(deletingClient.id);
      toast.success('Client deleted');
    } catch { toast.error('Failed to delete client'); }
    setDeletingClient(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground text-sm">Manage your clients and their creative projects</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </div>

        {/* Search & Sort Bar */}
        {clients && clients.length > 0 && (
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="pl-9"
              />
            </div>
            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="alpha">A → Z</SelectItem>
                <SelectItem value="most-assets">Most Assets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <ClientCardSkeletonGrid count={6} />
        ) : filteredClients.length > 0 ? (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.slice(0, visibleCount).map((client, i) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  index={i}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onQuickGenerate={handleQuickGenerate}
                  projectCount={projectCounts[client.id] || 0}
                  assetCount={assetCounts[client.id] || 0}
                />
              ))}
            </div>
            {filteredClients.length > visibleCount && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => setVisibleCount((c) => c + 12)}>
                  Load More ({filteredClients.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        ) : clients && clients.length > 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No clients match "{searchQuery}"
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-5 mb-4">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Add your first client to get started</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Create a client to organize projects, assets, and brand guidelines.</p>
            <Button size="lg" onClick={handleCreate}>
              <Plus className="mr-2 h-5 w-5" />
              New Client
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">Tip: Press <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">⌘N</kbd> anytime</p>
          </div>
        )}
      </div>

      <ClientOnboardingWizard open={wizardOpen} onOpenChange={setWizardOpen} onSubmit={handleWizardSubmit} isLoading={createClient.isPending} />
      <ClientForm open={editFormOpen} onOpenChange={setEditFormOpen} client={editingClient} onSubmit={handleEditSubmit} isLoading={updateClient.isPending} />
      {quickGenClient && (
        <QuickGenerateDialog open={!!quickGenClient} onOpenChange={(open) => !open && setQuickGenClient(null)} client={quickGenClient} />
      )}
      <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deletingClient?.name}"? This will also delete all associated projects and assets.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
