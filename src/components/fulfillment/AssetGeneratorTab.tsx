import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, Clock, Edit3, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ClientData {
  id: string;
  name: string;
  description?: string | null;
  offer_description?: string | null;
  website_url?: string | null;
  industry?: string | null;
  brand_colors?: string[] | null;
  brand_fonts?: string[] | null;
  client_type?: string | null;
}

interface Asset {
  id: string;
  asset_type: string;
  title: string | null;
  content: any;
  status: string;
  version: number;
  created_at: string;
}

interface AssetGeneratorTabProps {
  client: ClientData;
  assetType: string;
  icon: React.ElementType;
  title: string;
  description: string;
  renderContent: (content: any) => React.ReactNode;
}

const statusBadge: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-600 border-amber-200',
  internal_review: 'bg-blue-500/10 text-blue-600 border-blue-200',
  client_review: 'bg-purple-500/10 text-purple-600 border-purple-200',
  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  revision: 'bg-red-500/10 text-red-600 border-red-200',
};

export default function AssetGeneratorTab({ client, assetType, icon: Icon, title, description, renderContent }: AssetGeneratorTabProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [client.id, assetType]);

  const loadAssets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_offers' as any)
      .select('*')
      .eq('client_id', client.id)
      .eq('offer_type', `asset_${assetType}`)
      .order('created_at', { ascending: false });
    
    // Map client_offers fields to asset structure
    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      asset_type: assetType,
      title: d.title,
      content: d.description ? JSON.parse(d.description) : null,
      status: d.file_type || 'draft',
      version: 1,
      created_at: d.created_at,
    }));
    setAssets(mapped);
    setLoading(false);
  };

  const getExistingContext = async () => {
    let existing_research = null;
    let existing_angles = null;

    if (['angles', 'emails', 'sms', 'adcopy', 'scripts', 'creatives', 'report', 'funnel'].includes(assetType)) {
      const { data: researchAssets } = await supabase
        .from('client_offers' as any)
        .select('description')
        .eq('client_id', client.id)
        .eq('offer_type', 'asset_research')
        .order('created_at', { ascending: false })
        .limit(1);
      if (researchAssets?.[0]?.description) {
        try { existing_research = JSON.parse(researchAssets[0].description); } catch {}
      }
    }

    if (['emails', 'sms', 'adcopy', 'scripts', 'creatives'].includes(assetType)) {
      const { data: angleAssets } = await supabase
        .from('client_offers' as any)
        .select('description')
        .eq('client_id', client.id)
        .eq('offer_type', 'asset_angles')
        .order('created_at', { ascending: false })
        .limit(1);
      if (angleAssets?.[0]?.description) {
        try { existing_angles = JSON.parse(angleAssets[0].description); } catch {}
      }
    }

    return { existing_research, existing_angles };
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const { existing_research, existing_angles } = await getExistingContext();

      const { data, error } = await supabase.functions.invoke('generate-asset', {
        body: {
          client_id: client.id,
          asset_type: assetType,
          client_data: {
            company_name: client.name,
            fund_name: client.name,
            fund_type: client.client_type || 'Capital Raising',
            website: client.website_url,
            brand_notes: client.description,
            additional_notes: client.offer_description,
            brand_colors: client.brand_colors,
            brand_fonts: client.brand_fonts,
            industry: client.industry,
          },
          existing_research,
          existing_angles,
        },
      });

      if (error) throw error;
      toast.success(`${title} generated!`);
      await loadAssets();
    } catch (e: any) {
      console.error(e);
      toast.error(`Generation failed: ${e.message || 'Please try again.'}`);
    }
    setGenerating(false);
  };

  const updateStatus = async (assetId: string, status: string) => {
    await supabase.from('client_offers' as any).update({ file_type: status }).eq('id', assetId);
    await loadAssets();
    toast.success(`Status updated to ${status.replace('_', ' ')}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-1">{description}</p>
        {assetType !== 'research' && (
          <p className="text-xs text-muted-foreground/70 mb-4">
            {assetType === 'angles' ? 'Tip: Generate Research first for better results.' : 'Tip: Generate Research & Angles first for best results.'}
          </p>
        )}
        <Button onClick={generate} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Generating…' : `Generate ${title}`}
        </Button>
      </div>
    );
  }

  const latest = assets[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(latest.created_at).toLocaleString()} · v{latest.version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-[10px] ${statusBadge[latest.status] || statusBadge.draft}`}>
            {latest.status.replace('_', ' ')}
          </Badge>
          <Button size="sm" variant="outline" onClick={generate} disabled={generating} className="gap-1.5">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerate
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => updateStatus(latest.id, 'internal_review')} className="gap-1.5 text-xs">
          <Clock className="w-3 h-3" /> Send to Review
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus(latest.id, 'client_review')} className="gap-1.5 text-xs">
          <Edit3 className="w-3 h-3" /> Send to Client
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus(latest.id, 'approved')} className="gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="w-3 h-3" /> Approve
        </Button>
      </div>

      {latest.content && renderContent(latest.content)}
    </div>
  );
}
