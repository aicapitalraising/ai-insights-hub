import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, Type, Plus, X, Loader2, Edit2, Check, Link, ImagePlus, Trash2 } from 'lucide-react';
import { useUpdateClient } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Client } from '@/types';

interface BrandGuideSectionProps {
  client: Client;
}

export function BrandGuideSection({ client }: BrandGuideSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(client.description || '');
  const [offerDescription, setOfferDescription] = useState(client.offer_description || '');
  const [colors, setColors] = useState<string[]>(client.brand_colors || []);
  const [fonts, setFonts] = useState<string[]>(client.brand_fonts || []);
  const [productUrl, setProductUrl] = useState(client.product_url || '');
  const [productImages, setProductImages] = useState<string[]>(client.product_images || []);
  const [newColor, setNewColor] = useState('#3B82F6');
  const [newFont, setNewFont] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateClient = useUpdateClient();

  const handleSave = async () => {
    try {
      await updateClient.mutateAsync({
        id: client.id,
        description: description || null,
        offer_description: offerDescription || null,
        brand_colors: colors,
        brand_fonts: fonts,
        product_url: productUrl || null,
        product_images: productImages,
      });
      toast.success('Brand guide updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update brand guide');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${client.id}/products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }
      setProductImages([...productImages, ...newUrls]);
      toast.success(`${newUrls.length} image(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeProductImage = (url: string) => {
    setProductImages(productImages.filter((img) => img !== url));
  };

  const addColor = () => {
    if (newColor && !colors.includes(newColor)) {
      setColors([...colors, newColor]);
      setNewColor('#3B82F6');
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter((c) => c !== color));
  };

  const addFont = () => {
    if (newFont.trim() && !fonts.includes(newFont.trim())) {
      setFonts([...fonts, newFont.trim()]);
      setNewFont('');
    }
  };

  const removeFont = (font: string) => {
    setFonts(fonts.filter((f) => f !== font));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Brand Guide</CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
              setDescription(client.description || '');
                setOfferDescription(client.offer_description || '');
                setColors(client.brand_colors || []);
                setFonts(client.brand_fonts || []);
                setProductUrl(client.product_url || '');
                setProductImages(client.product_images || []);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateClient.isPending}>
              {updateClient.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <div>
          <Label className="text-sm font-medium">Description</Label>
          {isEditing ? (
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the client/brand..."
              className="mt-1 h-8 text-sm"
            />
          ) : description ? (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No description set</p>
          )}
        </div>

        {/* Offer Description */}
        <div>
          <Label className="text-sm font-medium">Offer / Product</Label>
          {isEditing ? (
            <Textarea
              value={offerDescription}
              onChange={(e) => setOfferDescription(e.target.value)}
              placeholder="Describe the main offer or product (new projects will default to this)..."
              className="mt-1 text-sm min-h-[60px]"
            />
          ) : offerDescription ? (
            <p className="text-sm text-muted-foreground mt-1">{offerDescription}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No offer set — projects will start blank</p>
          )}
        </div>

        {/* Brand Colors */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Brand Colors</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <div key={color} className="relative group">
                <div
                  className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
                {isEditing && (
                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeColor(color)}
                  >
                    <X className="h-2 w-2" />
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addColor}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            {colors.length === 0 && !isEditing && (
              <span className="text-xs text-muted-foreground">No colors set</span>
            )}
          </div>
        </div>

        {/* Brand Fonts */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Brand Fonts</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {fonts.map((font) => (
              <Badge key={font} variant="secondary" className="gap-1">
                {font}
                {isEditing && (
                  <button onClick={() => removeFont(font)}>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {isEditing && (
              <div className="flex items-center gap-1">
                <Input
                  value={newFont}
                  onChange={(e) => setNewFont(e.target.value)}
                  placeholder="Font name..."
                  className="h-7 w-32 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && addFont()}
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addFont}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
            {fonts.length === 0 && !isEditing && (
              <span className="text-xs text-muted-foreground">No fonts set</span>
            )}
          </div>
        </div>

        {/* Product URL */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Product URL</Label>
          </div>
          {isEditing ? (
            <Input
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://example.com/product"
              className="h-8 text-sm"
            />
          ) : productUrl ? (
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate block"
            >
              {productUrl}
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">No product URL set</span>
          )}
        </div>

        {/* Product Images */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Product Images</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {productImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Product ${index + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
                {isEditing && (
                  <button
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeProductImage(url)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="w-16 h-16"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </Button>
              </>
            )}
            {productImages.length === 0 && !isEditing && (
              <span className="text-xs text-muted-foreground">No product images</span>
            )}
          </div>
        </div>

        {!isEditing && (colors.length > 0 || fonts.length > 0 || productUrl || productImages.length > 0) && (
          <p className="text-xs text-muted-foreground">
            AI will use these brand guidelines when generating ads
          </p>
        )}
      </CardContent>
    </Card>
  );
}
