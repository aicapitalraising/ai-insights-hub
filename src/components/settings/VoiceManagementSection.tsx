import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Volume2, Upload, Loader2, Trash2, Play, Pause, Mic } from 'lucide-react';
import { useVoices, useCloneVoice, useDeleteVoice, Voice } from '@/hooks/useVoices';
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';

export function VoiceManagementSection() {
  const { data: voices = [], isLoading } = useVoices();
  const { data: clients = [] } = useClients();
  const cloneVoice = useCloneVoice();
  const deleteVoice = useDeleteVoice();

  const [showCloneForm, setShowCloneForm] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneDescription, setCloneDescription] = useState('');
  const [cloneClientId, setCloneClientId] = useState('');
  const [cloneGender, setCloneGender] = useState('');
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [deletingVoice, setDeletingVoice] = useState<Voice | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClone = async () => {
    if (!cloneFile || !cloneName.trim()) {
      toast.error('Please provide a name and audio file');
      return;
    }

    try {
      await cloneVoice.mutateAsync({
        audioFile: cloneFile,
        name: cloneName,
        description: cloneDescription || undefined,
        clientId: cloneClientId || undefined,
        gender: cloneGender || undefined,
      });
      toast.success('Voice cloned successfully');
      setShowCloneForm(false);
      setCloneName('');
      setCloneDescription('');
      setCloneClientId('');
      setCloneGender('');
      setCloneFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clone voice');
    }
  };

  const handleDelete = async () => {
    if (!deletingVoice) return;
    try {
      await deleteVoice.mutateAsync(deletingVoice.id);
      toast.success('Voice deleted');
    } catch {
      toast.error('Failed to delete voice');
    }
    setDeletingVoice(null);
  };

  const handlePlayPreview = (voice: Voice) => {
    if (playingId === voice.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    const url = voice.preview_url || voice.sample_url;
    if (!url) {
      toast.error('No preview available for this voice');
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => { setPlayingId(null); toast.error('Failed to play preview'); };
    audio.play();
    setPlayingId(voice.id);
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Stock';
    return clients.find(c => c.id === clientId)?.name || 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Library
            </CardTitle>
            <CardDescription>Manage cloned and stock voices for video generation</CardDescription>
          </div>
          <Button onClick={() => setShowCloneForm(!showCloneForm)} variant={showCloneForm ? 'secondary' : 'default'}>
            {showCloneForm ? 'Cancel' : <><Upload className="h-4 w-4 mr-2" /> Clone New Voice</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clone Form */}
        {showCloneForm && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Voice Name *</Label>
                <Input value={cloneName} onChange={(e) => setCloneName(e.target.value)} placeholder="e.g. Sarah - Friendly" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Gender</Label>
                <Select value={cloneGender} onValueChange={setCloneGender}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Assign to Client</Label>
              <Select value={cloneClientId} onValueChange={setCloneClientId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Stock (all clients)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Stock (All Clients)</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Input value={cloneDescription} onChange={(e) => setCloneDescription(e.target.value)} placeholder="Warm, conversational tone..." className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Audio Sample *</Label>
              <div className="flex gap-2 mt-1">
                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => setCloneFile(e.target.files?.[0] || null)} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  {cloneFile ? cloneFile.name : 'Upload Audio File'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Upload 30s-5min of clear speech. MP3, WAV, or M4A.</p>
            </div>
            <Button onClick={handleClone} disabled={cloneVoice.isPending || !cloneFile || !cloneName.trim()}>
              {cloneVoice.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cloning...</> : 'Clone Voice'}
            </Button>
          </div>
        )}

        {/* Voice List */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : voices.length > 0 ? (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {voices.map((voice) => (
                <div key={voice.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  {/* Play button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => handlePlayPreview(voice)}
                    disabled={!voice.preview_url && !voice.sample_url}
                  >
                    {playingId === voice.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{voice.name}</span>
                      {voice.is_stock && <Badge variant="secondary" className="text-[10px]">Stock</Badge>}
                      {voice.gender && <Badge variant="outline" className="text-[10px]">{voice.gender}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {getClientName(voice.client_id)}
                      {voice.description && ` • ${voice.description}`}
                    </p>
                  </div>

                  {/* Delete */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingVoice(voice)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No voices yet. Clone a voice to get started.</p>
        )}
      </CardContent>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingVoice} onOpenChange={() => setDeletingVoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingVoice?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
