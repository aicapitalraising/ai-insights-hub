import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';

export interface AgencySettings {
  id?: string;
  agency_name?: string;
  logo_url?: string | null;
  primary_color?: string | null;
  // All custom fields stored in the `settings` jsonb column
  ai_prompt_agency: string;
  ai_prompt_client: string;
  openai_api_key: string | null;
  gemini_api_key: string | null;
  xai_api_key?: string | null;
  api_usage_limit: number;
  meetgeek_api_key: string | null;
  meetgeek_webhook_secret: string | null;
  selected_openai_model?: string;
  selected_gemini_model?: string;
  selected_grok_model?: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULTS: AgencySettings = {
  ai_prompt_agency: 'You are an expert advertising agency performance analyst. Analyze the uploaded files and provided metrics to give actionable insights for the agency portfolio.',
  ai_prompt_client: 'You are an expert advertising performance analyst. Analyze the uploaded files and provided metrics to give actionable insights for this specific client.',
  openai_api_key: null,
  gemini_api_key: null,
  xai_api_key: null,
  api_usage_limit: 100,
  meetgeek_api_key: null,
  meetgeek_webhook_secret: null,
};

export function useAgencySettings() {
  return useQuery({
    queryKey: ['agency-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return DEFAULTS;
      
      // Merge settings jsonb into the top-level object for easy access
      const settingsJson = (data as any).settings || {};
      return {
        id: data.id,
        agency_name: (data as any).agency_name,
        logo_url: (data as any).logo_url,
        primary_color: (data as any).primary_color,
        created_at: data.created_at,
        updated_at: data.updated_at,
        ...DEFAULTS,
        ...settingsJson,
      } as AgencySettings;
    },
  });
}

export function useUpdateAgencySettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<AgencySettings>) => {
      // Separate DB columns from settings jsonb fields
      const { id, agency_name, logo_url, primary_color, created_at, updated_at, ...settingsFields } = updates;
      
      const { data: existing } = await supabase
        .from('agency_settings')
        .select('id, settings')
        .limit(1)
        .maybeSingle();
      
      // Merge new settings fields into existing settings jsonb
      const existingSettings = (existing as any)?.settings || {};
      const mergedSettings = { ...existingSettings, ...settingsFields };
      
      const dbPayload: Record<string, any> = { settings: mergedSettings };
      if (agency_name !== undefined) dbPayload.agency_name = agency_name;
      if (logo_url !== undefined) dbPayload.logo_url = logo_url;
      if (primary_color !== undefined) dbPayload.primary_color = primary_color;
      
      if (existing) {
        const { data, error } = await supabase
          .from('agency_settings')
          .update(dbPayload)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('agency_settings')
          .insert(dbPayload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-settings'] });
    },
  });
}
