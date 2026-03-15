import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { X, Plus, Loader2, Sparkles, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  offer_description: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
  isLoading?: boolean;
}

export function ClientForm({ open, onOpenChange, client, onSubmit, isLoading }: ClientFormProps) {
  const [brandColors, setBrandColors] = useState<string[]>(client?.brand_colors || []);
  const [brandFonts, setBrandFonts] = useState<string[]>(client?.brand_fonts || []);
  const [productUrl, setProductUrl] = useState<string>(client?.product_url || '');
  const [newColor, setNewColor] = useState('#6366f1');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || '',
      description: client?.description || '',
      offer_description: client?.offer_description || '',
      logo_url: client?.logo_url || '',
      website_url: '',
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setBrandColors(client?.brand_colors || []);
      setBrandFonts(client?.brand_fonts || []);
      setProductUrl(client?.product_url || '');
      setHasAnalyzed(false);
      form.reset({
        name: client?.name || '',
        description: client?.description || '',
        offer_description: client?.offer_description || '',
        logo_url: client?.logo_url || '',
        website_url: client?.product_url || '',
      });
    }
  }, [open, client, form]);

  const handleAnalyzeUrl = async () => {
    const websiteUrl = form.getValues('website_url');
    if (!websiteUrl) {
      toast.error('Please enter a website URL first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-brand', {
        body: { url: websiteUrl },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const result = data.data;
        
        // Update form fields
        if (result.name) {
          form.setValue('name', result.name);
        }
        if (result.description) {
          form.setValue('description', result.description);
        }
        // Only set logo if it's not a data URI (actual URL)
        if (result.logoUrl && !result.logoUrl.startsWith('data:')) {
          form.setValue('logo_url', result.logoUrl);
        }
        if (result.offerDescription) {
          form.setValue('offer_description', result.offerDescription);
        }
        
        // Update brand colors and fonts
        if (result.brandColors?.length > 0) {
          setBrandColors(result.brandColors);
        }
        if (result.brandFonts?.length > 0) {
          setBrandFonts(result.brandFonts);
        }

        // Save the website URL as product URL
        let formattedUrl = websiteUrl.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = `https://${formattedUrl}`;
        }
        setProductUrl(formattedUrl);

        setHasAnalyzed(true);
        toast.success('Brand info extracted! Review and edit as needed.');
      } else {
        throw new Error(data?.error || 'Failed to analyze website');
      }
    } catch (error) {
      console.error('Error analyzing brand:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze website');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      name: values.name,
      description: values.description || undefined,
      offer_description: values.offer_description || undefined,
      logo_url: values.logo_url || undefined,
      brand_colors: brandColors,
      brand_fonts: brandFonts,
      product_url: productUrl || undefined,
      product_images: client?.product_images || [],
    });
  };

  const addColor = () => {
    if (newColor && !brandColors.includes(newColor.toUpperCase())) {
      setBrandColors([...brandColors, newColor.toUpperCase()]);
    }
  };

  const removeColor = (color: string) => {
    setBrandColors(brandColors.filter(c => c !== color));
  };

  const removeFont = (font: string) => {
    setBrandFonts(brandFonts.filter(f => f !== font));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'New Client'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Website URL with AI Analysis */}
            {!client && (
              <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Auto-fill with AI</span>
                </div>
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Enter website URL..." 
                              className="pl-9"
                              {...field} 
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleAnalyzeUrl}
                            disabled={isAnalyzing || !field.value}
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Analyze
                              </>
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the company website to auto-extract brand info
                      </FormDescription>
                    </FormItem>
                  )}
                />
                {hasAnalyzed && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI extracted brand info - review and edit below
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the client..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offer_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer / Product Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What does this client sell or offer? Key selling points, pricing, value props..." 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This will be the default offer context for all new projects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Brand Colors */}
            <div className="space-y-2">
              <FormLabel>Brand Colors</FormLabel>
              <div className="flex flex-wrap gap-2">
                {brandColors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-1 rounded-full border border-border px-2 py-1"
                  >
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono">{color}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={addColor}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Brand Fonts */}
            <div className="space-y-2">
              <FormLabel>Brand Fonts</FormLabel>
              <div className="flex flex-wrap gap-2">
                {brandFonts.length > 0 ? (
                  brandFonts.map((font) => (
                    <Badge key={font} variant="secondary" className="gap-1">
                      {font}
                      <button type="button" onClick={() => removeFont(font)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No fonts set</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isAnalyzing}>
                {isLoading ? 'Saving...' : client ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
