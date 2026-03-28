import { useState, useRef, lazy, Suspense } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAllCreatives } from '@/hooks/useAllCreatives';
import { useClients, Client } from '@/hooks/useClients';
import { Creative, CreateCreativeInput, useUpdateCreativeStatus, useDeleteCreative, useCreateCreative, useCreateCreatives, uploadCreativeFile, detectAspectRatio } from '@/hooks/useCreatives';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreativeHorizontalPreview } from './CreativeHorizontalPreview';
import { CreativeAIActions } from './CreativeAIActions';
import { CashBagLoader } from '@/components/ui/CashBagLoader';
import { formatFileSize } from '@/lib/uploadWithProgress';
import {
  Search,
  Image,
  Video,
  FileText,
  Upload,
  Clock,
  Check,
  X,
  Rocket,
  RefreshCw,
  MessageSquare,
  Trash2,
  Eye,
  Sparkles,
  CheckSquare,
  Download,
  Film,
  Wand2,
  User,
  Radar,
  Instagram,
  Scissors,
  History,
  Inbox,
  Plus,
  Calendar,
  BarChart3,
  FolderArchive,
} from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Lazy-load sub-section page components
const CreativeBriefs = lazy(() => import('@/pages/CreativeBriefs'));
const StaticCreativesPage = lazy(() => import('@/pages/StaticCreativesPage'));
const BatchVideoWorkflow = lazy(() => import('@/components/batch-video/BatchVideoWorkflow').then(m => ({ default: m.BatchVideoWorkflow })));
const AdVariationsPage = lazy(() => import('@/pages/AdVariationsPage'));
const AvatarsPage = lazy(() => import('@/pages/AvatarsPage'));
const AdScrapingPage = lazy(() => import('@/pages/AdScrapingPage'));
const InstagramIntelPage = lazy(() => import('@/pages/InstagramIntelPage'));
const VideoEditorPage = lazy(() => import('@/pages/VideoEditorPage'));
const BrollPage = lazy(() => import('@/pages/BrollPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const ExportHubPage = lazy(() => import('@/pages/ExportHubPage'));
const CreativeCalendarLazy = lazy(() => import('@/components/creative/CreativeCalendar').then(m => ({ default: m.CreativeCalendar })));
const CreativeAnalyticsLazy = lazy(() => import('@/components/creative/CreativeAnalytics').then(m => ({ default: m.CreativeAnalytics })));

interface CreativeWithClient extends Creative {
  clientName?: string;
}

export function CreativesTab() {
  const [activeSection, setActiveSection] = useState('approvals');
  const { data: creatives = [], isLoading: creativesLoading } = useAllCreatives();
  const { data: clients = [] } = useClients();
  const updateStatus = useUpdateCreativeStatus();
  const deleteCreative = useDeleteCreative();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCreative, setSelectedCreative] = useState<CreativeWithClient | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Upload state
  const createCreative = useCreateCreative();
  const createCreatives = useCreateCreatives();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [singleUploading, setSingleUploading] = useState(false);
  const [singleUploadProgress, setSingleUploadProgress] = useState(0);
  const [singleUploadCurrentFile, setSingleUploadCurrentFile] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [bulkUploadCurrentFile, setBulkUploadCurrentFile] = useState('');
  const [bulkUploadFileIndex, setBulkUploadFileIndex] = useState(0);
  const [bulkUploadTotalFiles, setBulkUploadTotalFiles] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkClientId, setBulkClientId] = useState<string>('');
  const [bulkPlatform, setBulkPlatform] = useState<'meta' | 'tiktok' | 'youtube' | 'google'>('meta');
  const [newCreative, setNewCreative] = useState({
    title: '',
    type: 'image' as 'image' | 'video' | 'copy',
    platform: 'meta' as 'meta' | 'tiktok' | 'youtube' | 'google',
    headline: '',
    body_copy: '',
    cta_text: '',
    file: null as File | null,
    client_id: '',
  });

  // Map client names to creatives
  const clientMap = clients.reduce((acc, client) => {
    acc[client.id] = client.name;
    return acc;
  }, {} as Record<string, string>);

  const creativesWithClients: CreativeWithClient[] = creatives.map(c => ({
    ...c,
    clientName: clientMap[c.client_id] || 'Unknown Client',
  }));

  // Filter creatives
  const filteredCreatives = creativesWithClients.filter((creative) => {
    const matchesSearch = 
      creative.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creative.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = clientFilter === 'all' || creative.client_id === clientFilter;
    const matchesStatus = statusFilter === 'all' || creative.status === statusFilter;
    return matchesSearch && matchesClient && matchesStatus;
  });

  // Group by status for activity feed
  const recentActivity = creativesWithClients
    .slice(0, 20)
    .map(c => ({
      ...c,
      activityType: c.status === 'pending' ? 'uploaded' : c.status,
    }));

  const pendingCount = creativesWithClients.filter(c => c.status === 'pending').length;

  const statusCounts = {
    all: creativesWithClients.length,
    draft: creativesWithClients.filter(c => c.status === 'draft').length,
    pending: pendingCount,
    approved: creativesWithClients.filter(c => c.status === 'approved').length,
    launched: creativesWithClients.filter(c => c.status === 'launched').length,
    revisions: creativesWithClients.filter(c => c.status === 'revisions').length,
    rejected: creativesWithClients.filter(c => c.status === 'rejected').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'launched': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'revisions': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'launched': return <Rocket className="h-4 w-4" />;
      case 'revisions': return <RefreshCw className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'copy': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleStatusChange = (creative: CreativeWithClient, status: 'approved' | 'revisions' | 'rejected' | 'launched') => {
    updateStatus.mutate({ 
      id: creative.id, 
      status, 
      clientId: creative.client_id,
      creativeTitle: creative.title 
    });
  };

  const handleDelete = (creative: CreativeWithClient) => {
    if (confirm('Are you sure you want to delete this creative?')) {
      deleteCreative.mutate({ id: creative.id, clientId: creative.client_id });
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCreatives.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCreatives.map(c => c.id)));
    }
  };

  const handleBulkAction = (status: 'approved' | 'rejected') => {
    const selected = filteredCreatives.filter(c => selectedIds.has(c.id));
    selected.forEach(creative => {
      updateStatus.mutate({
        id: creative.id,
        status,
        clientId: creative.client_id,
        creativeTitle: creative.title,
      });
    });
    toast.success(`${selected.length} creative(s) ${status}`);
    setSelectedIds(new Set());
  };

  // Single upload handler
  const handleSingleUpload = async () => {
    if (!newCreative.title || !newCreative.client_id) {
      toast.error('Please select a client and enter a title');
      return;
    }
    setSingleUploading(true);
    setSingleUploadProgress(0);
    setSingleUploadCurrentFile(newCreative.file?.name || 'Creative file');
    try {
      let fileUrl = null;
      let aspectRatio = null;
      if (newCreative.file && (newCreative.type === 'image' || newCreative.type === 'video')) {
        aspectRatio = await detectAspectRatio(newCreative.file);
        fileUrl = await uploadCreativeFile(newCreative.file, newCreative.client_id, (pct) => setSingleUploadProgress(pct));
      }
      const clientName = clientMap[newCreative.client_id] || '';
      await createCreative.mutateAsync({
        client_id: newCreative.client_id,
        client_name: clientName,
        title: newCreative.title,
        type: newCreative.type,
        platform: newCreative.platform,
        file_url: fileUrl,
        headline: newCreative.headline || null,
        body_copy: newCreative.body_copy || null,
        cta_text: newCreative.cta_text || null,
        status: 'draft',
        comments: [],
        aspect_ratio: aspectRatio,
        isAgencyUpload: true,
      });
      toast.success('Creative uploaded successfully');
      setUploadOpen(false);
      setNewCreative({ title: '', type: 'image', platform: 'meta', headline: '', body_copy: '', cta_text: '', file: null, client_id: '' });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setSingleUploading(false);
      setSingleUploadProgress(0);
      setSingleUploadCurrentFile('');
    }
  };

  // Bulk upload handler
  const handleBulkUpload = async () => {
    if (!bulkClientId || bulkFiles.length === 0) {
      toast.error('Please select a client and add files');
      return;
    }
    setBulkUploading(true);
    setBulkUploadTotalFiles(bulkFiles.length);
    const clientName = clientMap[bulkClientId] || '';
    try {
      const successfulPayloads: CreateCreativeInput[] = [];
      let failedCount = 0;

      for (let index = 0; index < bulkFiles.length; index++) {
        const file = bulkFiles[index];
        try {
        setBulkUploadFileIndex(index + 1);
        setBulkUploadCurrentFile(file.name);
        setBulkUploadProgress(0);

        const isVideo = file.type.startsWith('video/');
        const aspectRatio = await detectAspectRatio(file);
        const fileUrl = await uploadCreativeFile(file, bulkClientId, (pct) => setBulkUploadProgress(pct));
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        const title = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        successfulPayloads.push({
          client_id: bulkClientId,
          client_name: clientName,
          title,
          type: isVideo ? 'video' : 'image',
          platform: bulkPlatform,
          file_url: fileUrl,
          headline: null,
          body_copy: null,
          cta_text: null,
          status: 'draft',
          comments: [],
          aspect_ratio: aspectRatio,
          isAgencyUpload: true,
        });
        } catch (error) {
          failedCount++;
          console.error('Failed to prepare creative upload:', file.name, error);
        }
      }

      if (successfulPayloads.length > 0) {
        await createCreatives.mutateAsync(successfulPayloads);
      }

      if (successfulPayloads.length > 0) toast.success(`Uploaded ${successfulPayloads.length} creative${successfulPayloads.length !== 1 ? 's' : ''}`);
      if (failedCount > 0) toast.error(`Failed to upload ${failedCount} file${failedCount !== 1 ? 's' : ''}`);
      setBulkUploadOpen(false);
      setBulkFiles([]);
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Bulk upload failed');
    } finally {
      setBulkUploading(false);
      setBulkUploadProgress(0);
      setBulkUploadCurrentFile('');
      setBulkUploadFileIndex(0);
      setBulkUploadTotalFiles(0);
    }
  };

  if (creativesLoading) {
    return <CashBagLoader message="Loading creatives..." />;
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="approvals" className="gap-2">
            <Upload className="h-4 w-4" />
            Approvals
            {pendingCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="briefs" className="gap-2">
            <FileText className="h-4 w-4" />
            Briefs & Scripts
          </TabsTrigger>
          <TabsTrigger value="static-ads" className="gap-2">
            <Image className="h-4 w-4" />
            Static Ads
          </TabsTrigger>
          <TabsTrigger value="batch-video" className="gap-2">
            <Film className="h-4 w-4" />
            Batch Video
          </TabsTrigger>
          <TabsTrigger value="ad-variations" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Ad Variations
          </TabsTrigger>
          <TabsTrigger value="avatars" className="gap-2">
            <User className="h-4 w-4" />
            Avatars
          </TabsTrigger>
          <TabsTrigger value="ad-scraping" className="gap-2">
            <Radar className="h-4 w-4" />
            Ad Scraping
          </TabsTrigger>
          <TabsTrigger value="instagram-intel" className="gap-2">
            <Instagram className="h-4 w-4" />
            IG Intel
          </TabsTrigger>
          <TabsTrigger value="video-editor" className="gap-2">
            <Scissors className="h-4 w-4" />
            Video Editor
          </TabsTrigger>
          <TabsTrigger value="broll" className="gap-2">
            <Film className="h-4 w-4" />
            B-Roll
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-4 space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creatives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="launched">Launched</SelectItem>
            <SelectItem value="revisions">Revisions</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Upload Buttons */}
        <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bulk Upload Creatives</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Client *</label>
                <Select value={bulkClientId} onValueChange={setBulkClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Platform</label>
                <div className="flex gap-2 mt-1">
                  {(['meta', 'tiktok', 'youtube', 'google'] as const).map((p) => (
                    <Button key={p} type="button" variant={bulkPlatform === p ? 'default' : 'outline'} size="sm" onClick={() => setBulkPlatform(p)}>
                      {p === 'meta' ? 'Meta/IG' : p === 'tiktok' ? 'TikTok' : p === 'youtube' ? 'YouTube' : 'Google PPC'}
                    </Button>
                  ))}
                </div>
              </div>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => bulkFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setBulkFiles(Array.from(e.dataTransfer.files)); }}
              >
                {bulkFiles.length > 0 ? (
                  <p className="text-sm font-medium">{bulkFiles.length} file{bulkFiles.length !== 1 ? 's' : ''} selected</p>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Drag & drop or click to select • Up to 10 GB per file</p>
                  </>
                )}
              </div>
              <input ref={bulkFileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => setBulkFiles(Array.from(e.target.files || []))} />
              {bulkUploading && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium">Uploading batch</p>
                      <p className="truncate text-muted-foreground">File {bulkUploadFileIndex}/{bulkUploadTotalFiles}: {bulkUploadCurrentFile}</p>
                    </div>
                    <span className="text-muted-foreground font-mono">{bulkUploadProgress}%</span>
                  </div>
                  <Progress value={bulkUploadProgress} className="h-2" />
                </div>
              )}
              <Button onClick={handleBulkUpload} className="w-full" disabled={bulkUploading || bulkFiles.length === 0 || !bulkClientId}>
                {bulkUploading ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Uploading {bulkUploadFileIndex}/{bulkUploadTotalFiles}...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Upload {bulkFiles.length} Creative{bulkFiles.length !== 1 ? 's' : ''}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Creative
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New Creative</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Client *</label>
                <Select value={newCreative.client_id} onValueChange={(v) => setNewCreative({ ...newCreative, client_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input value={newCreative.title} onChange={(e) => setNewCreative({ ...newCreative, title: e.target.value })} placeholder="Creative title" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2 mt-1">
                  {(['image', 'video', 'copy'] as const).map((type) => (
                    <Button key={type} type="button" variant={newCreative.type === type ? 'default' : 'outline'} size="sm" onClick={() => setNewCreative({ ...newCreative, type })}>
                      {type === 'image' ? <Image className="h-4 w-4 mr-1" /> : type === 'video' ? <Video className="h-4 w-4 mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
                      <span className="capitalize">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Platform</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(['meta', 'tiktok', 'youtube', 'google'] as const).map((p) => (
                    <Button key={p} type="button" variant={newCreative.platform === p ? 'default' : 'outline'} size="sm" onClick={() => setNewCreative({ ...newCreative, platform: p })}>
                      {p === 'meta' ? 'Meta/IG' : p === 'tiktok' ? 'TikTok' : p === 'youtube' ? 'YouTube' : 'Google PPC'}
                    </Button>
                  ))}
                </div>
              </div>
              {(newCreative.type === 'image' || newCreative.type === 'video') && (
                <div>
                  <label className="text-sm font-medium">File</label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    {newCreative.file ? (
                      <div className="flex items-center justify-center gap-2">
                        {newCreative.type === 'video' ? <Video className="h-4 w-4" /> : <Image className="h-4 w-4" />}
                        <span className="text-sm truncate max-w-[200px]">{newCreative.file.name}</span>
                        <span className="text-xs text-muted-foreground">({formatFileSize(newCreative.file.size)})</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Click to select • Up to 10 GB • 4K supported</p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept={newCreative.type === 'image' ? 'image/*' : 'video/*'} onChange={(e) => setNewCreative({ ...newCreative, file: e.target.files?.[0] || null })} className="hidden" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Headline</label>
                <Input value={newCreative.headline} onChange={(e) => setNewCreative({ ...newCreative, headline: e.target.value })} placeholder="Ad headline" />
              </div>
              <div>
                <label className="text-sm font-medium">Body Copy</label>
                <Textarea value={newCreative.body_copy} onChange={(e) => setNewCreative({ ...newCreative, body_copy: e.target.value })} placeholder="Ad body text" rows={3} />
              </div>
              {singleUploading && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium">Uploading creative</p>
                      <p className="truncate text-muted-foreground">{singleUploadCurrentFile}</p>
                    </div>
                    <span className="text-muted-foreground font-mono">{singleUploadProgress}%</span>
                  </div>
                  <Progress value={singleUploadProgress} className="h-2" />
                </div>
              )}
              <Button onClick={handleSingleUpload} className="w-full" disabled={singleUploading || !newCreative.client_id}>
                {singleUploading ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Uploading... {singleUploadProgress}%</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Upload Creative</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="default" onClick={() => handleBulkAction('approved')}>
            <Check className="h-3 w-3 mr-1" />
            Approve All
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleBulkAction('rejected')}>
            <X className="h-3 w-3 mr-1" />
            Reject All
          </Button>
          <Button size="sm" variant="outline" onClick={async () => {
            const selected = filteredCreatives.filter(c => selectedIds.has(c.id) && c.file_url);
            if (selected.length === 0) { toast.error('No files to export'); return; }
            toast.info(`Downloading ${selected.length} files...`);
            const zip = new JSZip();
            for (const c of selected) {
              try {
                const resp = await fetch(c.file_url!);
                const blob = await resp.blob();
                const ext = c.type === 'video' ? 'mp4' : 'png';
                zip.file(`${c.title.replace(/[^a-zA-Z0-9 ]/g, '')}.${ext}`, blob);
              } catch { /* skip */ }
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `creatives-export-${Date.now()}.zip`);
            toast.success('ZIP downloaded!');
          }}>
            <FolderArchive className="h-3 w-3 mr-1" />
            Export ZIP
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{statusCounts.all}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{statusCounts.launched}</p>
          <p className="text-xs text-muted-foreground">Launched</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{statusCounts.revisions}</p>
          <p className="text-xs text-muted-foreground">Revisions</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
      </div>

      <Tabs defaultValue="creatives" className="space-y-4">
        <TabsList>
          <TabsTrigger value="creatives" className="gap-2">
            <Upload className="h-4 w-4" />
            All Creatives ({filteredCreatives.length})
          </TabsTrigger>
          <TabsTrigger value="ai-generated" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generated ({creativesWithClients.filter(c => c.source === 'ai-auto').length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creatives" className="space-y-4">
          {filteredCreatives.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={selectedIds.size === filteredCreatives.length && filteredCreatives.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          )}
          {filteredCreatives.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No creatives found</p>
                <p className="text-sm text-muted-foreground">
                  Click "Upload Creative" above to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCreatives.map((creative) => (
                <Card key={creative.id} className="overflow-hidden hover:border-primary/50 transition-all duration-200 relative">
                  {/* Checkbox overlay */}
                  <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(creative.id)}
                      onCheckedChange={() => toggleSelect(creative.id)}
                    />
                  </div>
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {creative.type === 'image' && creative.file_url ? (
                      <img
                        src={creative.file_url}
                        alt={creative.title}
                        className="w-full h-full object-cover"
                      />
                    ) : creative.type === 'video' && creative.file_url ? (
                      <video
                        src={creative.file_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getTypeIcon(creative.type)}
                        <span className="ml-2 text-sm text-muted-foreground capitalize">{creative.type}</span>
                      </div>
                    )}
                    <Badge className={`absolute top-2 right-2 ${getStatusColor(creative.status)}`}>
                      {getStatusIcon(creative.status)}
                      <span className="ml-1 capitalize">{creative.status}</span>
                    </Badge>
                    {creative.source === 'ai-auto' && (
                      <Badge className="absolute bottom-2 right-2 bg-violet-600 text-white dark:bg-violet-500 text-[10px] gap-1">
                        <Sparkles className="h-3 w-3" />
                        Auto-Generated
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium truncate">{creative.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{creative.clientName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {creative.platform}
                        </Badge>
                        {creative.comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {creative.comments.length}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {creative.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = creative.file_url!;
                              link.download = creative.title || 'creative';
                              link.target = '_blank';
                              link.rel = 'noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCreative(creative)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(creative)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(creative.created_at), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Generated Performance Tracking */}
        <TabsContent value="ai-generated" className="space-y-4">
          {(() => {
            const aiCreatives = creativesWithClients.filter(c => c.source === 'ai-auto');
            const aiApproved = aiCreatives.filter(c => c.status === 'approved' || c.status === 'launched').length;
            const aiPending = aiCreatives.filter(c => c.status === 'pending').length;
            const aiRejected = aiCreatives.filter(c => c.status === 'rejected').length;
            
            return (
              <>
                {/* AI Performance Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold">{aiCreatives.length}</p>
                    <p className="text-xs text-muted-foreground">Total AI Generated</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{aiPending}</p>
                    <p className="text-xs text-muted-foreground">Awaiting Approval</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{aiApproved}</p>
                    <p className="text-xs text-muted-foreground">Approved / Launched</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{aiRejected}</p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </Card>
                </div>

                {aiCreatives.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No AI-generated creatives yet</p>
                      <p className="text-sm text-muted-foreground">
                        Creatives are auto-generated when CPL exceeds thresholds
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {aiCreatives.map((creative) => (
                      <Card key={creative.id} className="overflow-hidden hover:border-primary/50 transition-all duration-200 border-violet-500/30">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          {creative.file_url ? (
                            <img src={creative.file_url} alt={creative.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="h-8 w-8 text-violet-500" />
                            </div>
                          )}
                          <Badge className={`absolute top-2 right-2 ${getStatusColor(creative.status)}`}>
                            {creative.status}
                          </Badge>
                          <Badge className="absolute bottom-2 right-2 bg-violet-600 text-white text-[10px] gap-1">
                            <Sparkles className="h-3 w-3" />
                            Auto-Generated
                          </Badge>
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-medium truncate">{creative.title}</h4>
                          <p className="text-xs text-muted-foreground">{creative.clientName}</p>
                          {creative.trigger_campaign_id && (
                            <p className="text-xs text-violet-500 mt-1">CPL Triggered</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">{creative.platform}</Badge>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedCreative(creative)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(creative.created_at), { addSuffix: true })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Creative Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {recentActivity.map((creative) => (
                    <div
                      key={creative.id}
                      className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200 cursor-pointer"
                      onClick={() => setSelectedCreative(creative)}
                    >
                      <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        {creative.type === 'image' && creative.file_url ? (
                          <img
                            src={creative.file_url}
                            alt={creative.title}
                            className="w-full h-full object-cover"
                          />
                        ) : creative.type === 'video' && creative.file_url ? (
                          <video
                            src={creative.file_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getTypeIcon(creative.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(creative.status)}>
                            {getStatusIcon(creative.status)}
                            <span className="ml-1 capitalize">{creative.status}</span>
                          </Badge>
                          <Badge variant="outline">{creative.platform}</Badge>
                        </div>
                        <h4 className="font-medium truncate">{creative.title}</h4>
                        <p className="text-sm text-muted-foreground">{creative.clientName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(creative.updated_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(creative.updated_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Creative Detail Modal - Horizontal Layout */}
      <Dialog open={!!selectedCreative} onOpenChange={(open) => !open && setSelectedCreative(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-auto sm:max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCreative && getTypeIcon(selectedCreative.type)}
              {selectedCreative?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedCreative && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getStatusColor(selectedCreative.status)}>
                  {selectedCreative.status}
                </Badge>
                <Badge variant="outline">{selectedCreative.platform}</Badge>
                <span className="text-sm text-muted-foreground">
                  Client: {selectedCreative.clientName}
                </span>
              </div>

              {/* Horizontal Platform Preview - All platforms side by side */}
              <CreativeHorizontalPreview 
                creative={selectedCreative} 
                clientName={selectedCreative.clientName || 'Unknown Client'}
              />

              {/* Download + AI Actions */}
              <div className="flex items-center gap-2 flex-wrap border-t pt-4">
                {selectedCreative.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedCreative.file_url!;
                      link.download = selectedCreative.title || 'creative';
                      link.target = '_blank';
                      link.rel = 'noreferrer';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success('Download started');
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
                <Sparkles className="h-4 w-4 text-primary ml-2" />
                <span className="text-sm font-medium mr-1">AI Tools:</span>
                <CreativeAIActions creative={selectedCreative} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap border-t pt-4">
                {selectedCreative.status === 'pending' && (
                  <>
                    <Button
                      variant="default"
                      onClick={() => handleStatusChange(selectedCreative, 'approved')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedCreative, 'revisions')}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Revisions
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange(selectedCreative, 'rejected')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedCreative.status === 'approved' && (
                  <Button
                    variant="default"
                    onClick={() => handleStatusChange(selectedCreative, 'launched')}
                  >
                    <Rocket className="h-4 w-4 mr-1" />
                    Launch
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(selectedCreative)}
                >
                  <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                  Delete
                </Button>
              </div>

              {/* Approval History Timeline */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground/70">Created:</span>
                    <span>{format(new Date(selectedCreative.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground/70">Last Updated:</span>
                    <span>{format(new Date(selectedCreative.updated_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground/70">Current Status:</span>
                    <Badge className={`${getStatusColor(selectedCreative.status)} text-xs`}>
                      {selectedCreative.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({selectedCreative.comments.length})
                </h4>
                {selectedCreative.comments.length > 0 ? (
                  <ScrollArea className="h-[200px] border rounded-lg p-3 mb-2">
                    <div className="space-y-2">
                      {selectedCreative.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-2 rounded-lg text-sm ${
                            comment.author === 'Client'
                              ? 'bg-primary/10 ml-4'
                              : 'bg-muted mr-4'
                          }`}
                        >
                          <div className="flex justify-between mb-0.5">
                            <span className="text-xs font-medium">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p>{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground mb-2">No comments yet</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Briefs & Scripts */}
        <TabsContent value="briefs" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading briefs..." />}>
            <CreativeBriefs embedded />
          </Suspense>
        </TabsContent>

        {/* Static Ads */}
        <TabsContent value="static-ads" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading static ads..." />}>
            <StaticCreativesPage embedded />
          </Suspense>
        </TabsContent>

        {/* Batch Video */}
        <TabsContent value="batch-video" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading batch video..." />}>
            <BatchVideoWorkflow />
          </Suspense>
        </TabsContent>

        {/* Ad Variations */}
        <TabsContent value="ad-variations" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading ad variations..." />}>
            <AdVariationsPage embedded />
          </Suspense>
        </TabsContent>

        {/* Avatars */}
        <TabsContent value="avatars" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading avatars..." />}>
            <AvatarsPage embedded />
          </Suspense>
        </TabsContent>

        {/* Ad Scraping */}
        <TabsContent value="ad-scraping" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading ad scraping..." />}>
            <AdScrapingPage embedded />
          </Suspense>
        </TabsContent>

        {/* Instagram Intel */}
        <TabsContent value="instagram-intel" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading Instagram Intel..." />}>
            <InstagramIntelPage embedded />
          </Suspense>
        </TabsContent>

        {/* Video Editor */}
        <TabsContent value="video-editor" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading video editor..." />}>
            <VideoEditorPage embedded />
          </Suspense>
        </TabsContent>

        {/* B-Roll Library */}
        <TabsContent value="broll" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading B-Roll library..." />}>
            <BrollPage embedded />
          </Suspense>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading history..." />}>
            <HistoryPage embedded />
          </Suspense>
        </TabsContent>

        {/* Export Hub */}
        <TabsContent value="export" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading export hub..." />}>
            <ExportHubPage embedded />
          </Suspense>
        </TabsContent>

        {/* Creative Calendar */}
        <TabsContent value="calendar" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading calendar..." />}>
            <CreativeCalendarLazy embedded />
          </Suspense>
        </TabsContent>

        {/* Creative Analytics */}
        <TabsContent value="analytics" className="mt-4">
          <Suspense fallback={<CashBagLoader message="Loading analytics..." />}>
            <CreativeAnalyticsLazy embedded />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
