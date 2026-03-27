import { useQuery } from '@tanstack/react-query';
import { supabase as cloudClient } from '@/integrations/supabase/client';
import { Creative, CreativeComment } from './useCreatives';
import { fetchAllRows } from '@/lib/fetchAllRows';

function mapCreativeRow(item: any): Creative {
  return {
    ...item,
    type: item.type as 'image' | 'video' | 'copy',
    platform: (item.platform as 'meta' | 'tiktok' | 'youtube' | 'google') || 'meta',
    status: item.status as 'draft' | 'pending' | 'approved' | 'revisions' | 'rejected' | 'launched',
    comments: (item.comments as unknown as CreativeComment[]) || [],
    aspect_ratio: (item as any).aspect_ratio || null,
    source: (item as any).source || 'manual',
    trigger_campaign_id: (item as any).trigger_campaign_id || null,
    ai_performance_score: (item as any).ai_performance_score || null,
  };
}

export function useAllCreatives() {
  return useQuery({
    queryKey: ['all-creatives'],
    queryFn: async () => {
      // Fetch from both databases in parallel
      const [prodData, cloudData] = await Promise.all([
        Promise.resolve(fetchAllRows((sb) =>
          sb.from('creatives')
            .select('*')
            .order('created_at', { ascending: false })
        )).catch(() => [] as any[]),
        (async () => {
          try {
            const { data } = await cloudClient.from('creatives')
              .select('*')
              .order('created_at', { ascending: false });
            return data || [];
          } catch { return [] as any[]; }
        })(),
      ]);
      
      const allMapped = [...prodData, ...cloudData].map(mapCreativeRow);
      const seen = new Set<string>();
      return allMapped
        .filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });
}
