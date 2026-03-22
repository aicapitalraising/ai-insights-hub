import { useState, useEffect, useRef } from 'react';
import { Client, AdStyle } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, Plus, Loader2, Sparkles, Globe, Check, ArrowRight, ArrowLeft, Upload, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/db';
import { useAdStyles } from '@/hooks/useAdStyles';
import { toast } from 'sonner';

interface ClientOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>, selectedStyleIds?: string[]) => void;
  isLoading?: boolean;
}

export function ClientOnboardingWizard({ open, onOpenChange, onSubmit, isLoading }: ClientOnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Step 1 + 2 data
  const [name, setName] = useState('');
  const [clientType, setClientType] = useState<'Capital Raising' | 'ECOM'>('Capital Raising');
  const [description, setDescription] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [brandFonts, setBrandFonts] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newFont, setNewFont] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 3 data
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const { data: defaultStyles = [] } = useAdStyles();

  useEffect(() => {
    if (open) {
      setStep(1);
      setWebsiteUrl('');
      setIsAnalyzing(false);
      setHasAnalyzed(false);
      setName('');
      setClientType('Capital Raising');
      setDescription('');
      setOfferDescription('');
      setLogoUrl('');
      setBrandColors([]);
      setBrandFonts([]);
      setProductUrl('');
      setSelectedStyleIds([]);
    }
  }, [open]);

  const handleAnalyze = async () => {
    if (!websiteUrl) return;
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-brand', {
        body: { url: websiteUrl },
      });
      if (error) throw error;
      if (data?.success && data?.data) {
        const r = data.data;
        if (r.name) setName(r.name);
        if (r.description) setDescription(r.description);
        if (r.offerDescription) setOfferDescription(r.offerDescription);
        if (r.logoUrl && !r.logoUrl.startsWith('data:')) setLogoUrl(r.logoUrl);
        if (r.brandColors?.length > 0) setBrandColors(r.brandColors);
        if (r.brandFonts?.length > 0) setBrandFonts(r.brandFonts);
        let url = websiteUrl.trim();
        if (!url.startsWith('http')) url = `https://${url}`;
        setProductUrl(url);
        setHasAnalyzed(true);
        toast.success('Brand info extracted! Review and edit below.');
      } else {
        throw new Error(data?.error || 'Failed to analyze');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze website');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('assets').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path);
      setLogoUrl(publicUrl);
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const addColor = () => {
    if (newColor && !brandColors.includes(newColor.toUpperCase())) {
      setBrandColors([...brandColors, newColor.toUpperCase()]);
    }
  };

  const addFont = () => {
    if (newFont.trim() && !brandFonts.includes(newFont.trim())) {
      setBrandFonts([...brandFonts, newFont.trim()]);
      setNewFont('');
    }
  };

  const toggleStyle = (id: string) => {
    setSelectedStyleIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    onSubmit({
      name,
      description: description || undefined,
      offer_description: offerDescription || undefined,
      logo_url: logoUrl || undefined,
      brand_colors: brandColors,
      brand_fonts: brandFonts,
      product_url: productUrl || undefined,
      product_images: [],
    }, selectedStyleIds.length > 0 ? selectedStyleIds : undefined);
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  const steps = [
    { num: 1, label: 'Website' },
    { num: 2, label: 'Brand Assets' },
    { num: 3, label: 'Ad Styles' },
    { num: 4, label: 'Review' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Client Setup</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s.num ? <Check className="h-3 w-3" /> : s.num}
              </div>
              <span className={`text-xs hidden sm:inline ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${step > s.num ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Website URL + Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Auto-fill with AI</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter website URL..."
                    className="pl-9"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  />
                </div>
                <Button onClick={handleAnalyze} disabled={isAnalyzing || !websiteUrl}>
                  {isAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" />Analyze</>}
                </Button>
              </div>
              {hasAnalyzed && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <Check className="h-3 w-3" /> Brand info extracted — review below
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label>Company Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="mt-1" rows={2} />
              </div>
              <div>
                <Label>Offer / Product Description</Label>
                <Textarea value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} placeholder="What does this client sell?" className="mt-1" rows={3} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Brand Assets */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Logo */}
            <div>
              <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Logo</Label>
              <div className="flex items-center gap-3 mt-2">
                {logoUrl ? (
                  <div className="relative group">
                    <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-contain border bg-background" />
                    <button className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100" onClick={() => setLogoUrl('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                      {isUploadingLogo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Upload Logo
                    </Button>
                  </>
                )}
                {!logoUrl && (
                  <Input placeholder="Or paste logo URL..." value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="flex-1" />
                )}
              </div>
            </div>

            {/* Colors */}
            <div>
              <Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> Brand Colors</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {brandColors.map((color) => (
                  <div key={color} className="flex items-center gap-1 rounded-full border px-2 py-1">
                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
                    <span className="text-xs font-mono">{color}</span>
                    <button onClick={() => setBrandColors(brandColors.filter(c => c !== color))} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                <Input value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="#000000" className="flex-1" />
                <Button type="button" variant="outline" size="icon" onClick={addColor}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Fonts */}
            <div>
              <Label className="flex items-center gap-2"><Type className="h-4 w-4" /> Brand Fonts</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {brandFonts.map((font) => (
                  <Badge key={font} variant="secondary" className="gap-1">
                    {font}
                    <button onClick={() => setBrandFonts(brandFonts.filter(f => f !== font))}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input value={newFont} onChange={(e) => setNewFont(e.target.value)} placeholder="Font name..." className="flex-1" onKeyDown={(e) => e.key === 'Enter' && addFont()} />
                <Button variant="outline" size="icon" onClick={addFont}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Ad Styles */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select the ad styles you want enabled for this client. You can add more later.</p>
            <div className="grid gap-3 grid-cols-2">
              {defaultStyles.map((style) => (
                <Card
                  key={style.id}
                  className={`cursor-pointer transition-all ${selectedStyleIds.includes(style.id) ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                  onClick={() => toggleStyle(style.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Checkbox checked={selectedStyleIds.includes(style.id)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{style.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{style.description}</p>
                      </div>
                    </div>
                    {style.example_image_url && (
                      <img src={style.example_image_url} alt={style.name} className="w-full h-20 object-cover rounded mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {defaultStyles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No default styles configured yet. You can add styles later from the project settings.</p>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {logoUrl && <img src={logoUrl} alt={name} className="w-12 h-12 rounded-lg object-contain border" />}
                  <div>
                    <h3 className="font-semibold text-lg">{name}</h3>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                  </div>
                </div>

                {offerDescription && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Offer</Label>
                    <p className="text-sm">{offerDescription}</p>
                  </div>
                )}

                {brandColors.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Colors</Label>
                    <div className="flex gap-2 mt-1">
                      {brandColors.map((c) => (
                        <div key={c} className="w-6 h-6 rounded-full border" style={{ backgroundColor: c }} title={c} />
                      ))}
                    </div>
                  </div>
                )}

                {brandFonts.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Fonts</Label>
                    <div className="flex gap-1 mt-1">
                      {brandFonts.map((f) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                    </div>
                  </div>
                )}

                {selectedStyleIds.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Selected Styles</Label>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {selectedStyleIds.map((id) => {
                        const s = defaultStyles.find(st => st.id === id);
                        return s ? <Badge key={id} variant="outline" className="text-xs">{s.name}</Badge> : null;
                      })}
                    </div>
                  </div>
                )}

                {productUrl && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <p className="text-sm text-primary">{productUrl}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => step === 1 ? onOpenChange(false) : setStep(step - 1)}>
            {step === 1 ? 'Cancel' : <><ArrowLeft className="h-4 w-4 mr-1" /> Back</>}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Create Client
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
