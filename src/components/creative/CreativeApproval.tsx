import { useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'react-router-dom';
import { 
  useCreatives, 
  useCreateCreative, 
  useCreateCreatives,
  useUpdateCreativeStatus, 
  useAddCreativeComment,
  useDeleteCreative,
  uploadCreativeFile,
  detectAspectRatio,
  Creative,
  CreativeComment 
} from '@/hooks/useCreatives';
import { useClient } from '@/hooks/useClients';
import { useClientOffers } from '@/hooks/useClientOffers';
import { useTeamMember } from '@/contexts/TeamMemberContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { CashBagLoader } from '@/components/ui/CashBagLoader';
import { PlatformAdPreview } from './PlatformAdPreview';
import { CreativeHorizontalPreview } from './CreativeHorizontalPreview';
import { CreativeAIActions } from './CreativeAIActions';
import { 
  Upload, 
  Check, 
  X, 
  MessageSquare, 
  Image, 
  Video, 
  FileText,
  Trash2,
  Send,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Clock,
  Sparkles,
  Link,
  SendHorizontal,
  Download
} from 'lucide-react';
import { formatFileSize } from '@/lib/uploadWithProgress';
import { toast } from 'sonner';

interface CreativeApprovalProps {
  clientId: string;
  clientName: string;
  isPublicView?: boolean;
}

export function CreativeApproval({ clientId, clientName, isPublicView = false }: CreativeApprovalProps) {
  const { data: allCreatives = [], isLoading } = useCreatives(clientId);
  const { clientId: routeClientId } = useParams<{ clientId: string }>();
  const { data: client } = useClient(routeClientId || clientId);
  const { data: offers = [] } = useClientOffers(clientId);
  const createCreative = useCreateCreative();
  const createCreatives = useCreateCreatives();
  const updateStatus = useUpdateCreativeStatus();
  const addComment = useAddCreativeComment();
  const deleteCreative = useDeleteCreative();
  const { currentMember } = useTeamMember();
  
  // Check if this is an agency upload (team member logged in and not public view)
  const isAgencyUpload = !!currentMember && !isPublicView;
  
  // Offer filter state
  const [selectedOfferId, setSelectedOfferId] = useState<string>('all');
  
  // Public view: filter out draft creatives (not yet approved by agency)
  const creatives = isPublicView 
    ? allCreatives.filter(c => c.status !== 'draft')
    : allCreatives;
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [commentText, setCommentText] = useState('');
  const [singleUploading, setSingleUploading] = useState(false);
  const [singleUploadProgress, setSingleUploadProgress] = useState(0);
  const [singleUploadCurrentFile, setSingleUploadCurrentFile] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [bulkUploadCurrentFile, setBulkUploadCurrentFile] = useState('');
  const [bulkUploadFileIndex, setBulkUploadFileIndex] = useState(0);
  const [bulkUploadTotalFiles, setBulkUploadTotalFiles] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [cardComments, setCardComments] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkPlatform, setBulkPlatform] = useState<'meta' | 'tiktok' | 'youtube' | 'google'>('meta');
  const [bulkOfferId, setBulkOfferId] = useState<string>('');
  
  const [newCreative, setNewCreative] = useState({
    title: '',
    type: 'image' as 'image' | 'video' | 'copy',
    platform: 'meta' as 'meta' | 'tiktok' | 'youtube' | 'google',
    headline: '',
    body_copy: '',
    cta_text: '',
    file: null as File | null,
    offerId: '' as string,
  });

  // Apply offer filter first
  const offerFilteredCreatives = selectedOfferId === 'all'
    ? creatives
    : selectedOfferId === 'unlinked'
      ? creatives.filter(c => !c.trigger_campaign_id)
      : creatives.filter(c => c.trigger_campaign_id === selectedOfferId);

  const statusCounts = {
    all: offerFilteredCreatives.length,
    draft: offerFilteredCreatives.filter(c => c.status === 'draft').length,
    pending: offerFilteredCreatives.filter(c => c.status === 'pending').length,
    approved: offerFilteredCreatives.filter(c => c.status === 'approved').length,
    launched: offerFilteredCreatives.filter(c => c.status === 'launched').length,
    revisions: offerFilteredCreatives.filter(c => c.status === 'revisions').length,
    rejected: offerFilteredCreatives.filter(c => c.status === 'rejected').length,
  };

  const filteredCreatives = activeTab === 'all' 
    ? offerFilteredCreatives 
    : offerFilteredCreatives.filter(c => c.status === activeTab);

  const handleSendToClient = (creative: Creative) => {
    updateStatus.mutate({ id: creative.id, status: 'pending', clientId, creativeTitle: creative.title });
    toast.success('Creative sent to client for approval');
  };

  const handleCopyApprovalLink = () => {
    const publicToken = client?.public_token;
    if (!publicToken) {
      toast.error('No public link configured for this client. Set up a public token first.');
      return;
    }
    const url = `${window.location.origin}/public/${publicToken}/creatives`;
    navigator.clipboard.writeText(url);
    toast.success('Creative approval link copied to clipboard');
  };

  const handleLaunch = (creative: Creative) => {
    updateStatus.mutate({ id: creative.id, status: 'launched', clientId, creativeTitle: creative.title });
  };

  const handleUpload = async () => {
    if (!newCreative.title) {
      toast.error('Please enter a title');
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
        fileUrl = await uploadCreativeFile(newCreative.file, clientId, (pct) => setSingleUploadProgress(pct));
      }

      await createCreative.mutateAsync({
        client_id: clientId,
        client_name: clientName,
        title: newCreative.title,
        type: newCreative.type,
        platform: newCreative.platform,
        file_url: fileUrl,
        headline: newCreative.headline || null,
        body_copy: newCreative.body_copy || null,
        cta_text: newCreative.cta_text || null,
        status: isAgencyUpload ? 'draft' : 'pending',
        comments: [],
        aspect_ratio: aspectRatio,
        isAgencyUpload,
        trigger_campaign_id: newCreative.offerId || null,
      });

      setUploadOpen(false);
      setBulkUploadOpen(false);
      setNewCreative({
        title: '',
        type: 'image',
        platform: 'meta',
        headline: '',
        body_copy: '',
        cta_text: '',
        file: null,
        offerId: '',
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setSingleUploading(false);
      setSingleUploadProgress(0);
      setSingleUploadCurrentFile('');
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setBulkUploading(true);
    setBulkUploadTotalFiles(bulkFiles.length);

    try {
      const successfulPayloads: Parameters<typeof createCreatives.mutateAsync>[0] = [];
      let failedUploads = 0;

      for (let i = 0; i < bulkFiles.length; i++) {
        const file = bulkFiles[i];
        try {
          setBulkUploadFileIndex(i + 1);
          setBulkUploadCurrentFile(file.name);
          setBulkUploadProgress(0);

          const isVideo = file.type.startsWith('video/');
          const aspectRatio = await detectAspectRatio(file);
          const fileUrl = await uploadCreativeFile(file, clientId, (pct) => setBulkUploadProgress(pct));
          
          const fileName = file.name.replace(/\.[^/.]+$/, '');
          const title = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          successfulPayloads.push({
            client_id: clientId,
            client_name: clientName,
            title,
            type: isVideo ? 'video' : 'image',
            platform: bulkPlatform,
            file_url: fileUrl,
            headline: null,
            body_copy: null,
            cta_text: null,
            status: isAgencyUpload ? 'draft' : 'pending',
            comments: [],
            aspect_ratio: aspectRatio,
            isAgencyUpload,
            trigger_campaign_id: bulkOfferId || null,
          });
        } catch (error) {
          failedUploads++;
          console.error('Failed to upload file before metadata insert:', file.name, error);
        }
      }

      if (successfulPayloads.length > 0) {
        await createCreatives.mutateAsync(successfulPayloads);
      }

      if (successfulPayloads.length > 0) {
        toast.success(`Successfully uploaded ${successfulPayloads.length} creative${successfulPayloads.length !== 1 ? 's' : ''}`);
      }
      if (failedUploads > 0) {
        toast.error(`Failed to upload ${failedUploads} file${failedUploads !== 1 ? 's' : ''}`);
      }

      setBulkUploadOpen(false);
      setBulkFiles([]);
    } catch (error) {
      console.error('Bulk upload error:', error);
    } finally {
      setBulkUploading(false);
      setBulkUploadProgress(0);
      setBulkUploadCurrentFile('');
      setBulkUploadFileIndex(0);
      setBulkUploadTotalFiles(0);
    }
  };

  const handleStatusChange = (creative: Creative, status: 'approved' | 'revisions' | 'rejected') => {
    updateStatus.mutate({ id: creative.id, status, clientId, creativeTitle: creative.title });
    // Close detail modal so the creative visually moves to its new tab
    if (selectedCreative?.id === creative.id) {
      setSelectedCreative(null);
    }
  };

  const handleAddComment = (creative: Creative) => {
    if (!commentText.trim()) return;
    
    const comment: CreativeComment = {
      id: Date.now().toString(),
      author: isPublicView ? 'Client' : 'Agency',
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    
    addComment.mutate({ id: creative.id, comment, clientId });
    setCommentText('');
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'copy': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-border">
        <CardContent className="py-8">
          <CashBagLoader message="Loading creatives..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Creative Approval
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage creative assets for {clientName}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Copy Approval Link - agency only */}
          {!isPublicView && (
            <Button variant="outline" size="sm" onClick={handleCopyApprovalLink}>
              <Link className="h-4 w-4 mr-2" />
              Copy Approval Link
            </Button>
          )}
          {/* Bulk Upload - available for public view too */}
          <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant={isPublicView ? 'default' : 'outline'}>
                <Upload className="h-4 w-4 mr-2" />
                {isPublicView ? 'Upload Creatives' : 'Bulk Upload'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Bulk Upload Creatives</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(['meta', 'tiktok', 'youtube', 'google'] as const).map((platform) => (
                      <Button
                        key={platform}
                        type="button"
                        variant={bulkPlatform === platform ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBulkPlatform(platform)}
                      >
                        {platform === 'meta' && 'Meta/IG'}
                        {platform === 'tiktok' && 'TikTok'}
                        {platform === 'youtube' && 'YouTube'}
                        {platform === 'google' && 'Google PPC'}
                      </Button>
                    ))}
                  </div>
                </div>

                {offers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Link to Offer</label>
                    <Select value={bulkOfferId || '__none__'} onValueChange={(val) => setBulkOfferId(val === '__none__' ? '' : val)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="None (unlinked)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None (unlinked)</SelectItem>
                        {offers.map((offer) => (
                          <SelectItem key={offer.id} value={offer.id}>
                            {offer.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Select Files</label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => bulkFileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Tap to select files</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images & videos up to 10 GB each • 4K supported
                    </p>
                  </div>
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => setBulkFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </div>

                {bulkFiles.length > 0 && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      {bulkFiles.length} file(s) selected 
                      <span className="text-muted-foreground font-normal ml-1">
                        ({formatFileSize(bulkFiles.reduce((sum, f) => sum + f.size, 0))} total)
                      </span>
                    </p>
                    <ul className="text-xs space-y-1 max-h-32 overflow-auto">
                      {bulkFiles.map((file, i) => (
                        <li key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {file.type.startsWith('video/') ? (
                              <Video className="h-3 w-3 flex-shrink-0" />
                            ) : (
                              <Image className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </div>
                          <span className="text-muted-foreground flex-shrink-0">{formatFileSize(file.size)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Upload progress */}
                {bulkUploading && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium">Uploading batch</p>
                        <p className="truncate text-muted-foreground">
                          {bulkUploadTotalFiles > 1 ? `File ${bulkUploadFileIndex}/${bulkUploadTotalFiles} • ` : ''}
                          {bulkUploadCurrentFile}
                        </p>
                      </div>
                      <span className="text-muted-foreground font-mono">{bulkUploadProgress}%</span>
                    </div>
                    <Progress value={bulkUploadProgress} className="h-2" />
                  </div>
                )}

                <Button 
                  onClick={handleBulkUpload} 
                  className="w-full"
                  disabled={bulkUploading || bulkFiles.length === 0}
                >
                  {bulkUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading {bulkUploadFileIndex}/{bulkUploadTotalFiles}...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {bulkFiles.length} Creative{bulkFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Single Upload - agency only */}
          {!isPublicView && (
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Creative
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload New Creative</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={newCreative.title}
                    onChange={(e) => setNewCreative({ ...newCreative, title: e.target.value })}
                    placeholder="Creative title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="flex gap-2 mt-1">
                    {(['image', 'video', 'copy'] as const).map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={newCreative.type === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewCreative({ ...newCreative, type })}
                      >
                        {getTypeIcon(type)}
                        <span className="ml-1 capitalize">{type}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(['meta', 'tiktok', 'youtube', 'google'] as const).map((platform) => (
                      <Button
                        key={platform}
                        type="button"
                        variant={newCreative.platform === platform ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewCreative({ ...newCreative, platform })}
                      >
                        {platform === 'meta' && 'Meta/IG'}
                        {platform === 'tiktok' && 'TikTok'}
                        {platform === 'youtube' && 'YouTube'}
                        {platform === 'google' && 'Google PPC'}
                      </Button>
                    ))}
                  </div>
                </div>

                {offers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Link to Offer</label>
                    <Select value={newCreative.offerId || '__none__'} onValueChange={(val) => setNewCreative({ ...newCreative, offerId: val === '__none__' ? '' : val })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="None (unlinked)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None (unlinked)</SelectItem>
                        {offers.map((offer) => (
                          <SelectItem key={offer.id} value={offer.id}>
                            {offer.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(newCreative.type === 'image' || newCreative.type === 'video') && (
                  <div>
                    <label className="text-sm font-medium">File</label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {newCreative.file ? (
                        <div className="flex items-center justify-center gap-2">
                          {newCreative.type === 'video' ? <Video className="h-4 w-4" /> : <Image className="h-4 w-4" />}
                          <span className="text-sm truncate max-w-[200px]">{newCreative.file.name}</span>
                          <span className="text-xs text-muted-foreground">({formatFileSize(newCreative.file.size)})</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">Tap to select • Up to 10 GB • 4K supported</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={newCreative.type === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) => setNewCreative({ 
                        ...newCreative, 
                        file: e.target.files?.[0] || null 
                      })}
                      className="hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Headline</label>
                  <Input
                    value={newCreative.headline}
                    onChange={(e) => setNewCreative({ ...newCreative, headline: e.target.value })}
                    placeholder="Ad headline"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Body Copy</label>
                  <Textarea
                    value={newCreative.body_copy}
                    onChange={(e) => setNewCreative({ ...newCreative, body_copy: e.target.value })}
                    placeholder="Ad body text"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">CTA Text</label>
                  <Input
                    value={newCreative.cta_text}
                    onChange={(e) => setNewCreative({ ...newCreative, cta_text: e.target.value })}
                    placeholder="Learn More"
                  />
                </div>

                {/* Upload progress */}
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

                <Button 
                  onClick={handleUpload} 
                  className="w-full"
                  disabled={singleUploading}
                >
                  {singleUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading... {singleUploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Creative
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Status Summary Cards */}
        <div className={`grid ${isPublicView ? 'grid-cols-4' : 'grid-cols-5'} gap-3 mb-6`}>
          {!isPublicView && (
            <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-600">{statusCounts.draft}</p>
              <p className="text-xs text-slate-700 dark:text-slate-400">Draft</p>
            </div>
          )}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">Pending</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
            <p className="text-xs text-green-700 dark:text-green-400">Approved</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{statusCounts.revisions}</p>
            <p className="text-xs text-orange-700 dark:text-orange-400">Revisions</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
            <p className="text-xs text-red-700 dark:text-red-400">Rejected</p>
          </div>
        </div>

        {/* Offer Filter + Status Tabs */}
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          {offers.length > 0 && (
            <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <SelectValue placeholder="Filter by offer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offers</SelectItem>
                <SelectItem value="unlinked">Unlinked</SelectItem>
                {offers.map((offer) => (
                  <SelectItem key={offer.id} value={offer.id}>
                    {offer.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            {!isPublicView && <TabsTrigger value="draft">Draft</TabsTrigger>}
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="launched">Launched</TabsTrigger>
            <TabsTrigger value="revisions">Revisions</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredCreatives.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No creatives uploaded yet</p>
                <p className="text-sm">Upload your first creative to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCreatives.map((creative) => (
                  <CreativeCard
                    key={creative.id}
                    creative={creative}
                    clientName={clientName}
                    clientId={clientId}
                    isPublicView={isPublicView}
                    getStatusColor={getStatusColor}
                    getTypeIcon={getTypeIcon}
                    onPreview={() => setSelectedCreative(creative)}
                    onStatusChange={handleStatusChange}
                    onLaunch={() => handleLaunch(creative)}
                    onSendToClient={() => handleSendToClient(creative)}
                    onAddComment={handleAddComment}
                    onDelete={() => deleteCreative.mutate({ id: creative.id, clientId })}
                    commentText={cardComments[creative.id] || ''}
                    onCommentTextChange={(text) => setCardComments(prev => ({ ...prev, [creative.id]: text }))}
                    addCommentMutation={addComment}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Creative Detail Modal - Full horizontal preview */}
        <Dialog open={!!selectedCreative} onOpenChange={() => setSelectedCreative(null)}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-auto sm:max-w-[95vw]">
            {selectedCreative && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>{selectedCreative.title}</DialogTitle>
                    <Badge className={getStatusColor(selectedCreative.status)}>
                      {selectedCreative.status}
                    </Badge>
                  </div>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(selectedCreative.status)}>
                      {selectedCreative.status}
                    </Badge>
                    <Badge variant="outline">{selectedCreative.platform}</Badge>
                    <span className="text-sm text-muted-foreground">Client: {clientName}</span>
                  </div>

                  {/* Horizontal Platform Preview - All platforms side by side */}
                  <CreativeHorizontalPreview 
                    creative={selectedCreative} 
                    clientName={clientName}
                  />

                  {/* Download + AI Tools */}
                  <div className="flex items-center gap-2 flex-wrap border-t pt-4">
                    {/* Download - available for both agency and public */}
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
                    {/* AI Tools - agency only */}
                    {!isPublicView && (
                      <>
                        <Sparkles className="h-4 w-4 text-primary ml-2" />
                        <span className="text-sm font-medium mr-1">AI Tools:</span>
                        <CreativeAIActions creative={selectedCreative} />
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap border-t pt-4">
                    {selectedCreative.status === 'draft' && !isPublicView && (
                      <Button
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => {
                          handleSendToClient(selectedCreative);
                          setSelectedCreative(null);
                        }}
                      >
                        <SendHorizontal className="h-4 w-4 mr-1" />
                        Send to Client
                      </Button>
                    )}
                    {selectedCreative.status !== 'launched' && selectedCreative.status !== 'draft' && (
                      <>
                        {selectedCreative.status === 'approved' && !isPublicView && (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              handleLaunch(selectedCreative);
                              setSelectedCreative(null);
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Launch
                          </Button>
                        )}
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
                    {!isPublicView && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          deleteCreative.mutate({ id: selectedCreative.id, clientId });
                          setSelectedCreative(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* Previous Versions - agency only */}
                  {!isPublicView && selectedCreative.comments && selectedCreative.comments.some(c => c.author === 'System' && c.text.startsWith('📎 Previous version:')) && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Version History</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {selectedCreative.comments
                          .filter(c => c.author === 'System' && c.text.startsWith('📎 Previous version:'))
                          .map((c, i) => {
                            const url = c.text.replace('📎 Previous version: ', '');
                            return (
                              <div key={c.id} className="flex-shrink-0 border rounded-lg overflow-hidden w-32">
                                <img src={url} alt={`Version ${i + 1}`} className="w-full h-24 object-cover bg-muted" />
                                <p className="text-xs text-muted-foreground p-1 text-center">v{i + 1}</p>
                              </div>
                            );
                          })}
                        <div className="flex-shrink-0 border-2 border-primary rounded-lg overflow-hidden w-32">
                          {selectedCreative.file_url && (
                            <img src={selectedCreative.file_url} alt="Current" className="w-full h-24 object-cover bg-muted" />
                          )}
                          <p className="text-xs text-primary font-medium p-1 text-center">Current</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments ({(selectedCreative.comments || []).filter(c => c.author !== 'System').length})
                    </h4>
                    {selectedCreative.comments && selectedCreative.comments.filter(c => c.author !== 'System').length > 0 ? (
                      <ScrollArea className="h-[200px] border rounded-lg p-3 mb-2">
                        <div className="space-y-2">
                          {selectedCreative.comments.filter(c => c.author !== 'System').map((comment) => (
                            <div 
                              key={comment.id}
                              className={`p-2 rounded-lg text-sm ${
                                comment.author === 'Client' 
                                  ? 'bg-primary/10 ml-4' 
                                  : comment.author === 'AI Review'
                                    ? 'bg-accent/50 border border-accent'
                                    : 'bg-muted mr-4'
                              }`}
                            >
                              <div className="flex justify-between mb-0.5">
                                <span className="text-xs font-medium">{comment.author}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleString()}
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
                    
                    {/* Add comment */}
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(selectedCreative);
                          }
                        }}
                      />
                      <Button 
                        size="icon"
                        onClick={() => handleAddComment(selectedCreative)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Helper to get aspect ratio CSS class for card containers
function getCardAspectClass(aspectRatio: string | null | undefined): string {
  switch (aspectRatio) {
    case '16:9': return 'aspect-video';
    case '9:16': return 'aspect-[9/16] max-h-[500px]';
    case '1:1': return 'aspect-square';
    case '4:5': return 'aspect-[4/5]';
    default: return 'aspect-[4/5]';
  }
}

// Inline video player component for card grid
function InlineVideoPlayer({ src, aspectRatio }: { src: string; aspectRatio?: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlaying(true);
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full group cursor-pointer" onClick={toggle}>
      <video 
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <div className="bg-black/50 rounded-full p-4">
          {playing ? (
            <Pause className="h-8 w-8 text-white fill-white" />
          ) : (
            <Play className="h-8 w-8 text-white fill-white" />
          )}
        </div>
      </div>
    </div>
  );
}

// Creative card with inline actions
function CreativeCard({ 
  creative, clientName, clientId, isPublicView, getStatusColor, getTypeIcon,
  onPreview, onStatusChange, onLaunch, onSendToClient, onDelete, commentText, onCommentTextChange, addCommentMutation
}: {
  creative: Creative;
  clientName: string;
  clientId: string;
  isPublicView: boolean;
  getStatusColor: (s: string) => string;
  getTypeIcon: (t: string) => React.ReactNode;
  onPreview: () => void;
  onStatusChange: (c: Creative, s: 'approved' | 'revisions' | 'rejected') => void;
  onLaunch: () => void;
  onSendToClient: () => void;
  onAddComment: (c: Creative) => void;
  onDelete: () => void;
  commentText: string;
  onCommentTextChange: (t: string) => void;
  addCommentMutation: ReturnType<typeof useAddCreativeComment>;
}) {
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState(false);

  const handleCardComment = () => {
    if (!commentText.trim()) return;
    const comment: CreativeComment = {
      id: Date.now().toString(),
      author: isPublicView ? 'Client' : 'Agency',
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    addCommentMutation.mutate({ id: creative.id, comment, clientId });
    onCommentTextChange('');
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplacing(true);
    try {
      const newUrl = await uploadCreativeFile(file, clientId);
      const aspectRatio = await detectAspectRatio(file);
      // Save old version as a comment
      const versionComment: CreativeComment = {
        id: Date.now().toString(),
        author: 'System',
        text: `📎 Previous version: ${creative.file_url}`,
        createdAt: new Date().toISOString(),
      };
      const existingComments = creative.comments || [];
      const updatedComments = [...existingComments, versionComment];
      
      const { supabase: prodDb } = await import('@/integrations/supabase/db');
      const { supabase: cloudDb } = await import('@/integrations/supabase/client');
      const updatePayload: Record<string, any> = { 
        file_url: newUrl, 
        aspect_ratio: aspectRatio,
        comments: updatedComments,
        updated_at: new Date().toISOString(),
        status: 'pending',
      };
      await prodDb.from('creatives').update(updatePayload).eq('id', creative.id);
      cloudDb.from('creatives').update(updatePayload).eq('id', creative.id).then(() => {});
      
      toast.success('New version uploaded — moved to pending');
      // Force page refresh to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Replace file error:', err);
      toast.error('Failed to upload new version');
    } finally {
      setReplacing(false);
    }
  };

  const commentCount = creative.comments?.length || 0;

  return (
    <Card className="border hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        {/* Media area */}
        <div className="relative">
          <Badge className={`absolute top-3 right-3 z-10 ${getStatusColor(creative.status)}`}>
            <Clock className="h-3 w-3 mr-1" />
            {creative.status.charAt(0).toUpperCase() + creative.status.slice(1)}
          </Badge>
          
          <div className={`${getCardAspectClass(creative.aspect_ratio)} bg-muted relative overflow-hidden`}>
            {creative.type === 'image' && creative.file_url ? (
              <img 
                src={creative.file_url} 
                alt={creative.title}
                className="w-full h-full object-contain cursor-pointer"
                onClick={onPreview}
              />
            ) : creative.type === 'video' && creative.file_url ? (
              <InlineVideoPlayer src={creative.file_url} aspectRatio={creative.aspect_ratio} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer" onClick={onPreview}>
                {getTypeIcon(creative.type)}
                <p className="text-sm text-muted-foreground mt-2">
                  {creative.headline || 'Ad Copy'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Info + title row */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{creative.title}</h4>
              <p className="text-xs text-muted-foreground">{clientName}</p>
            </div>
            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
              {creative.platform}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(creative.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Action buttons row */}
        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
          {creative.status === 'draft' && !isPublicView && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90"
              onClick={onSendToClient}
            >
              <SendHorizontal className="h-3 w-3" />
              Send to Client
            </Button>
          )}
          {creative.status !== 'launched' && creative.status !== 'draft' && (
            <>
              {creative.status === 'approved' && !isPublicView && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={onLaunch}
                >
                  <Play className="h-3 w-3" />
                  Launch
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => onStatusChange(creative, 'approved')}
              >
                <Check className="h-3 w-3" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => onStatusChange(creative, 'revisions')}
              >
                <RefreshCw className="h-3 w-3" />
                Revisions
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => onStatusChange(creative, 'rejected')}
              >
                <X className="h-3 w-3" />
                Reject
              </Button>
            </>
          )}
          {/* Download button on card */}
          {creative.file_url && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = creative.file_url!;
                link.download = creative.title || 'creative';
                link.target = '_blank';
                link.rel = 'noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
          )}
          {/* Upload New Version - agency only */}
          {!isPublicView && creative.file_url && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={replacing}
                onClick={(e) => {
                  e.stopPropagation();
                  replaceFileRef.current?.click();
                }}
              >
                {replacing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                {replacing ? 'Uploading...' : 'Upload New'}
              </Button>
              <input
                ref={replaceFileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleReplaceFile}
                className="hidden"
              />
            </>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs gap-1 ml-auto"
            onClick={onPreview}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
          {!isPublicView && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>

        {/* AI Tools row - agency only */}
        {!isPublicView && (
          <div className="px-4 pb-2 border-t border-border pt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Sparkles className="h-3 w-3 text-primary" />
              <CreativeAIActions creative={creative} compact />
            </div>
          </div>
        )}

        {/* Inline comment section */}
        <div className="px-4 pb-3 border-t border-border mt-1 pt-2">
          {commentCount > 0 && (
            <div className="mb-2 max-h-24 overflow-y-auto space-y-1">
              {creative.comments.slice(-2).map((comment) => (
                <div key={comment.id} className="text-xs bg-muted rounded px-2 py-1">
                  <span className="font-medium">{comment.author}:</span>{' '}
                  <span className="text-muted-foreground">{comment.text}</span>
                </div>
              ))}
              {commentCount > 2 && (
                <button 
                  className="text-xs text-primary hover:underline"
                  onClick={onPreview}
                >
                  View all {commentCount} comments
                </button>
              )}
            </div>
          )}
          <div className="flex gap-1.5">
            <Input
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              placeholder="Add a comment..."
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCardComment();
              }}
            />
            <Button 
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleCardComment}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}