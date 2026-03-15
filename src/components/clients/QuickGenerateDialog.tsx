import { useState } from 'react';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Zap, Image, Video, User, Loader2 } from 'lucide-react';
import { useAdStyles } from '@/hooks/useAdStyles';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface QuickGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

const FORMAT_PRESETS = [
  { id: 'fb_feed', label: 'Facebook Feed', w: 1200, h: 628 },
  { id: 'ig_square', label: 'Instagram Square', w: 1080, h: 1080 },
  { id: 'ig_story', label: 'Story / Reels', w: 1080, h: 1920 },
  { id: 'linkedin', label: 'LinkedIn', w: 1200, h: 627 },
];

const ASPECT_RATIOS = [
  { id: '16:9', label: 'Landscape 16:9' },
  { id: '1:1', label: 'Square 1:1' },
  { id: '9:16', label: 'Portrait 9:16' },
];

export function QuickGenerateDialog({ open, onOpenChange, client }: QuickGenerateDialogProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'static' | 'video' | 'avatar'>('static');
  const [isGenerating, setIsGenerating] = useState(false);

  // Static ad settings
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['ig_square']);
  const [variants, setVariants] = useState(3);
  const [ctaText, setCTAText] = useState('Learn More');

  // Video settings
  const [scriptText, setScriptText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState('30');

  const { data: styles = [] } = useAdStyles(client.id);

  const toggleFormat = (id: string) => {
    setSelectedFormats(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Navigate to the appropriate page with pre-filled params
    if (mode === 'static') {
      navigate(`/static-ads?clientId=${client.id}`);
    } else if (mode === 'video') {
      navigate(`/batch-video?clientId=${client.id}`);
    } else {
      navigate(`/avatars?clientId=${client.id}`);
    }
    onOpenChange(false);
    setIsGenerating(false);
    toast.info(`Navigating to ${mode === 'static' ? 'Static Ads' : mode === 'video' ? 'Video' : 'Avatars'} with ${client.name} pre-selected`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Generate
          </DialogTitle>
        </DialogHeader>

        {/* Client Header */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={client.logo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {client.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{client.name}</p>
            {client.brand_colors?.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {client.brand_colors.slice(0, 4).map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full border" style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mode Selection */}
        <div>
          <Label className="text-sm mb-2 block">What do you want to create?</Label>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="grid grid-cols-3 gap-2">
            {[
              { value: 'static', icon: Image, label: 'Static Ad' },
              { value: 'video', icon: Video, label: 'Video Ad' },
              { value: 'avatar', icon: User, label: 'Avatar' },
            ].map(({ value, icon: Icon, label }) => (
              <Label
                key={value}
                htmlFor={`mode-${value}`}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  mode === value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={value} id={`mode-${value}`} className="sr-only" />
                <Icon className={`h-5 w-5 ${mode === value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium">{label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Mode-specific settings */}
        <div className="space-y-3">
          {mode === 'static' && (
            <>
              <div>
                <Label className="text-sm">Style</Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a style..." /></SelectTrigger>
                  <SelectContent>
                    {styles.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Formats</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {FORMAT_PRESETS.map(f => (
                    <Label key={f.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs ${selectedFormats.includes(f.id) ? 'border-primary bg-primary/5' : ''}`}>
                      <Checkbox checked={selectedFormats.includes(f.id)} onCheckedChange={() => toggleFormat(f.id)} />
                      {f.label} <span className="text-muted-foreground">({f.w}×{f.h})</span>
                    </Label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">Variants: {variants}</Label>
                <Slider value={[variants]} onValueChange={([v]) => setVariants(v)} min={1} max={10} step={1} className="mt-2" />
              </div>
              <div>
                <Label className="text-sm">CTA Text</Label>
                <Input value={ctaText} onChange={(e) => setCTAText(e.target.value)} className="mt-1" />
              </div>
            </>
          )}

          {mode === 'video' && (
            <>
              <div>
                <Label className="text-sm">Script</Label>
                <Textarea value={scriptText} onChange={(e) => setScriptText(e.target.value)} placeholder="Enter script or leave blank to auto-generate..." rows={3} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {mode === 'avatar' && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              You'll be taken to the Avatars page with {client.name} pre-selected to create or select an avatar.
            </p>
          )}
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
          Generate
        </Button>
      </DialogContent>
    </Dialog>
  );
}
