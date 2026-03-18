import { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Palette, Type, FileText, Package, Image as ImageIcon, Link } from 'lucide-react';

interface BrandKitBarProps {
  client: Client;
  stylesCount?: number;
  assetsCount?: number;
  onEditSection?: (section: 'colors' | 'fonts' | 'offer' | 'logo') => void;
}

export function BrandKitBar({ client, stylesCount = 0, assetsCount = 0, onEditSection }: BrandKitBarProps) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-3">
        <div className="flex items-center gap-4 overflow-x-auto">
          {/* Logo + Name */}
          <div
            className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onEditSection?.('logo')}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={client.logo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {client.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{client.name}</span>
          </div>

          <div className="w-px h-6 bg-border shrink-0" />

          {/* Colors */}
          <div
            className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onEditSection?.('colors')}
            title="Brand Colors"
          >
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            {client.brand_colors?.length > 0 ? (
              <div className="flex gap-1">
                {client.brand_colors.slice(0, 5).map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-background shadow-sm" style={{ backgroundColor: c }} />
                ))}
                {client.brand_colors.length > 5 && (
                  <span className="text-xs text-muted-foreground ml-0.5">+{client.brand_colors.length - 5}</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No colors</span>
            )}
          </div>

          <div className="w-px h-6 bg-border shrink-0" />

          {/* Fonts */}
          <div
            className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onEditSection?.('fonts')}
            title="Brand Fonts"
          >
            <Type className="h-3.5 w-3.5 text-muted-foreground" />
            {client.brand_fonts?.length > 0 ? (
              <div className="flex gap-1">
                {client.brand_fonts.slice(0, 2).map((f) => (
                  <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0">{f}</Badge>
                ))}
                {client.brand_fonts.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{client.brand_fonts.length - 2}</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No fonts</span>
            )}
          </div>

          <div className="w-px h-6 bg-border shrink-0" />

          {/* Offer */}
          <div
            className="flex items-center gap-1.5 shrink-0 max-w-[200px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onEditSection?.('offer')}
            title={client.description || 'No description set'}
          >
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {client.description ? client.description.slice(0, 50) + (client.description.length > 50 ? '...' : '') : 'No description set'}
            </span>
          </div>

          <div className="w-px h-6 bg-border shrink-0" />

          {/* Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1" title="Ad Styles">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{stylesCount}</span>
              <span className="text-xs text-muted-foreground">styles</span>
            </div>
            <div className="flex items-center gap-1" title="Assets">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{assetsCount}</span>
              <span className="text-xs text-muted-foreground">assets</span>
            </div>
          </div>

          {client.product_url && (
            <>
              <div className="w-px h-6 bg-border shrink-0" />
              <a href={client.product_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                <Link className="h-3 w-3" />
                Website
              </a>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
