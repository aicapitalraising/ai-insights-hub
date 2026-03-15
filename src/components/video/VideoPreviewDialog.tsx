import { useState, useRef, useEffect } from 'react';
import { isGoogleApiUrl, fetchVideoViaProxy } from '@/lib/video-proxy';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Play,
  Pause,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Scissors,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    id: string;
    prompt: string;
    aspectRatio: string;
    duration: number;
    videoUrl?: string;
    status: string;
  } | null;
  onRegenerate: (id: string, newPrompt: string) => void;
  isRegenerating?: boolean;
  modelName?: string;
}

export function VideoPreviewDialog({
  open,
  onOpenChange,
  video,
  onRegenerate,
  isRegenerating = false,
  modelName = 'Veo 3 Fast',
}: VideoPreviewDialogProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');

  // Reset state when video changes
  useEffect(() => {
    if (video && open) {
      setEditedPrompt(video.prompt);
      setShowRegenerateForm(false);
      setIsPlaying(false);
    }
  }, [video, open]);

  if (!video) return null;

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleDownload = async () => {
    if (!video.videoUrl || video.videoUrl === 'placeholder') {
      toast.info('Video download will be available once connected to video generation API');
      return;
    }

    try {
      let blobUrl: string;

      if (isGoogleApiUrl(video.videoUrl)) {
        // Use proxy for Google API URLs (CORS/auth restricted)
        blobUrl = await fetchVideoViaProxy(video.videoUrl);
      } else {
        const response = await fetch(video.videoUrl);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `broll-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Video downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    }
  };

  const handleRegenerate = () => {
    if (!editedPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    onRegenerate(video.id, editedPrompt.trim());
    setShowRegenerateForm(false);
  };

  // Get aspect ratio dimensions for video container
  const getAspectClass = () => {
    switch (video.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[70vh]';
      case '1:1':
        return 'aspect-square max-h-[70vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[70vh]';
      default:
        return 'aspect-video max-h-[70vh]';
    }
  };

  // Check if we have a real video URL
  const hasRealVideo = video.videoUrl && video.videoUrl !== 'placeholder';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Video Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {modelName}
              </Badge>
              <Badge variant="outline">{video.aspectRatio}</Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {video.duration}s
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Video Player */}
          <div className="flex justify-center bg-black rounded-lg overflow-hidden">
            <div className={cn('relative w-full', getAspectClass())}>
              {hasRealVideo ? (
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              ) : (
                // Placeholder preview
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-muted to-primary/10">
                  <div className="text-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                      <Play className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Video preview will be available when connected to the video generation API
                    </p>
                  </div>
                </div>
              )}

              {/* Video Controls Overlay */}
              {hasRealVideo && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                        onClick={handlePlayPause}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                        onClick={handleMuteToggle}
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                      onClick={handleFullscreen}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Display */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-1">Prompt</p>
            <p className="text-sm text-muted-foreground">{video.prompt}</p>
          </div>

          {/* Regenerate Form */}
          {showRegenerateForm && (
            <div className="space-y-3 p-4 border rounded-lg bg-card">
              <Label>Edit Prompt for Regeneration</Label>
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                placeholder="Modify the prompt to generate a new variation..."
                rows={3}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Will regenerate using {modelName}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              {hasRealVideo && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/video-editor?src=${encodeURIComponent(video.videoUrl!)}&ar=${video.aspectRatio}`)}
                  className="gap-2"
                >
                  <Scissors className="h-4 w-4" />
                  Send to Editor
                </Button>
              )}
              {showRegenerateForm ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowRegenerateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    disabled={isRegenerating || !editedPrompt.trim()}
                    className="gap-2"
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditedPrompt(video.prompt);
                    setShowRegenerateForm(true);
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
