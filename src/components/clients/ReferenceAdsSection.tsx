import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, Loader2, Plus, Trash2, X, Upload, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReferenceAdsSectionProps {
  clientId: string;
}

interface ReferenceAd {
  id: string;
  name: string;
  file_url: string;
  file_type: string | null;
  category: string | null;
  description: string | null;
  created_at: string;
}

export function ReferenceAdsSection({ clientId }: ReferenceAdsSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['reference-ads', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_ads')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReferenceAd[];
    },
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_ads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-ads', clientId] });
      toast.success('Reference ad removed');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const isVideo = file.type.startsWith('video/');
        const fileType = isVideo ? 'video' : 'image';
        const fileName = `${clientId}/reference-ads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase.from('custom_ads').insert({
          name: file.name.replace(/\.[^/.]+$/, ''),
          file_url: publicUrl,
          file_type: fileType,
          client_id: clientId,
          category: 'reference',
        });
        if (insertError) throw insertError;
      }

      queryClient.invalidateQueries({ queryKey: ['reference-ads', clientId] });
      toast.success(`${files.length} reference ad(s) uploaded`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload reference ad');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Reference Ads</CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Upload ads or visuals your brand likes — AI will use these as style references when generating new creatives.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ads.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload reference ads or brand visuals
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports images and videos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {ads.map((ad) => (
                <div key={ad.id} className="relative group aspect-square">
                  {ad.file_type === 'video' ? (
                    <video
                      src={ad.file_url}
                      className="w-full h-full object-cover rounded-lg border"
                      muted
                      playsInline
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : (
                    <img
                      src={ad.file_url}
                      alt={ad.name}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:bg-white/20"
                      onClick={() => setPreviewUrl(ad.file_url)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:bg-destructive/80"
                      onClick={() => deleteAd.mutate(ad.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {ad.file_type === 'video' && (
                    <Badge variant="secondary" className="absolute bottom-1 left-1 text-[10px] px-1 py-0">
                      Video
                    </Badge>
                  )}
                </div>
              ))}
              {/* Add more button */}
              <div
                className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reference Ad Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            previewUrl.match(/\.(mp4|webm|mov)/) ? (
              <video src={previewUrl} controls className="w-full rounded-lg" />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
